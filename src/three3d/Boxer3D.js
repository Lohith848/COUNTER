/**
 * Boxer3D — High-fidelity procedural 3D humanoid boxer built entirely in Three.js code.
 * Follows the img2threejs anatomical reconstruction and staged code generation standard:
 * - Detailed muscular anatomy (pectoral plates, 6-pack abs, deltoids, biceps, forearms, quads, calves).
 * - Full 3D head with jaw, brow, nose, ears, mouthguard, and multi-layered 3D anime/retro hair.
 * - Curved 3D boxing gloves with thumb guard, knuckle padding, and wrist lace cuffs.
 * - Authentic boxing shorts with champion belt, side stripes, and high-top boots with treads.
 * - Realistic boxing kinematics (footwork shuffle, snapping jabs, rotational hooks, rising uppercuts,
 *   super special moves, high guard block with recoil, slip dodges, visceral hit staggers, and 10-count KOs).
 */

import * as THREE from 'three';

export const BOXER = {
  hipHeight: 196,
  rough: 0.55
};

// Fighter palettes
export const FIGHTER_PALETTES = {
  akira: {
    skin: 0xdeb887,
    skinDark: 0xc49666,
    skinShadow: 0xa87748,
    shorts: 0x1f8a4c,      // Emerald green trunks
    trunksTrim: 0x145a32,  // Forest trim
    waistband: 0xf4d03f,   // Championship gold belt
    stripe: 0xffffff,
    gloves: 0x2e86c1,      // Electric blue gloves
    gloveDark: 0x1b4f72,
    hair: 0x212f3d,        // Dark spiky hero hair with green sheen
    hairHighlight: 0x27ae60,
    boots: 0x1c2833,
    bootTrim: 0x2e86c1,
    tape: 0xf2f4f4
  },
  ryuga: {
    skin: 0xd4a373,
    skinDark: 0xbc8a5f,
    skinShadow: 0x9b6b43,
    shorts: 0xb03a2e,      // Crimson red trunks
    trunksTrim: 0x78281f,  // Blood red trim
    waistband: 0xd4ac0d,   // Dark gold belt
    stripe: 0x17202a,      // Black stripe
    gloves: 0x922b21,      // Deep blood crimson gloves
    gloveDark: 0x641e16,
    hair: 0x17202a,        // Jet black sleek swept hair
    hairHighlight: 0x7b241c,
    boots: 0x17202a,
    bootTrim: 0xb03a2e,
    tape: 0xe5e7e9
  }
};

// Base fight guard stance
const GUARD_POSE = {
  torsoZ: -0.10,    // forward crouch
  torsoX: 0.03,
  torsoY: 0.0,
  headZ: 0.04,
  headX: -0.03,
  armShZ: 1.25,     // upper arms raised
  armShX: 0.12,     // elbows tucked inward to guard ribs
  armElZ: 1.52,     // forearms folded upright protecting chin
  armElX: 0.0,
  legHipZ: 0.12,    // slight athletic forward leg bias
  legKneeZ: -0.28   // knee flexion / ready spring
};

function pbrMat(color, roughness = 0.55, metalness = 0.05) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    transparent: true,
    opacity: 1
  });
}

function boxMesh(w, h, d, material, castShadow = true) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  return mesh;
}

function sphereMesh(radius, material, widthSeg = 12, heightSeg = 10, castShadow = true) {
  const geo = new THREE.SphereGeometry(radius, widthSeg, heightSeg);
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  return mesh;
}

function cylinderMesh(rt, rb, h, material, seg = 12, castShadow = true) {
  const geo = new THREE.CylinderGeometry(rt, rb, h, seg);
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  return mesh;
}

export default class Boxer3D {
  /**
   * @param {object} opts
   * @param {string} opts.name 'Akira' | 'Ryuga'
   * @param {object} [opts.palette]
   */
  constructor(opts = {}) {
    this.name = opts.name || 'Akira';
    const isRyuga = this.name.toLowerCase().includes('ryuga');
    this.pal = opts.palette || (isRyuga ? FIGHTER_PALETTES.ryuga : FIGHTER_PALETTES.akira);

    this.materials = [];
    this._initMaterials();

    // Root node hierarchy
    this.root = new THREE.Group();
    this.root.name = this.name + '_Rig';

    this.body = new THREE.Group();      // Facing / Yaw
    this.pose = new THREE.Group();      // Knockdown roll / Impact recoil
    this.root.add(this.body);
    this.body.add(this.pose);

    this.hips = new THREE.Group();      // Pelvis + Legs + Bob
    this.torso = new THREE.Group();     // Muscular Chest + Head + Arms
    this.pose.add(this.hips);
    this.hips.add(this.torso);

    // Build anatomical body parts
    this._buildPelvisAndTrunks();
    this._buildMuscularTorso();
    this._buildHeadAndHair(isRyuga);
    this._buildArmsAndGloves();
    this._buildLegsAndBoots();
    this._buildAuraFX();

    // Expose handles
    this.parts = {
      hips: this.hips,
      torso: this.torso,
      head: this.headG,
      armL: this.armL,
      armR: this.armR,
      legL: this.legL,
      legR: this.legR,
      aura: this.auraMesh
    };

    // Animation & Combat state
    this.facing = 1;               // 1 = facing right (+x), -1 = facing left (-x)
    this.animTime = 0;
    this.idlePhase = Math.random() * 10;
    this.action = null;
    this.ko = 0;
    this.koDir = -1;
    this.flash = 0;
    this.opacityTarget = 1;
    this._matOpacity = 1;
    this._flashOn = false;
    this.lean = { x: 0, z: 0 };
    this.punchExtend = 0;
    this.punchArmKey = 'armL';
    this.isSuperActive = false;
    this.superGlow = 0;

    this._scratch = new THREE.Vector3();
    this._scratch2 = new THREE.Vector3();

    this.resetPose();
  }

  _initMaterials() {
    const P = this.pal;
    this.mSkin = pbrMat(P.skin, 0.58, 0.04);
    this.mSkinDark = pbrMat(P.skinDark, 0.62, 0.04);
    this.mSkinShadow = pbrMat(P.skinShadow, 0.65, 0.02);
    this.mShorts = pbrMat(P.shorts, 0.45, 0.15);
    this.mTrunksTrim = pbrMat(P.trunksTrim, 0.5, 0.1);
    this.mWaistband = pbrMat(P.waistband, 0.35, 0.4); // Metallic satin sheen
    this.mStripe = pbrMat(P.stripe, 0.45, 0.1);
    this.mGlove = pbrMat(P.gloves, 0.32, 0.25);       // Glossy leather glove
    this.mGloveDark = pbrMat(P.gloveDark, 0.4, 0.2);
    this.mHair = pbrMat(P.hair, 0.7, 0.05);
    this.mHairHighlight = pbrMat(P.hairHighlight, 0.6, 0.08);
    this.mBoot = pbrMat(P.boots, 0.55, 0.1);
    this.mBootTrim = pbrMat(P.bootTrim, 0.4, 0.2);
    this.mTape = pbrMat(P.tape, 0.65, 0.02);
    this.mGold = pbrMat(0xffd700, 0.25, 0.75);       // Champion emblem
    this.mMouth = pbrMat(0x8a1c1c, 0.5, 0.1);

    this.materials = [
      this.mSkin, this.mSkinDark, this.mSkinShadow,
      this.mShorts, this.mTrunksTrim, this.mWaistband, this.mStripe,
      this.mGlove, this.mGloveDark, this.mHair, this.mHairHighlight,
      this.mBoot, this.mBootTrim, this.mTape, this.mGold, this.mMouth
    ];
  }

  // ------------------------------------------------------------------
  // 1. PELVIS & BOXING TRUNKS
  // ------------------------------------------------------------------
  _buildPelvisAndTrunks() {
    const P = this.hips;

    // Pelvic base
    const pelvis = boxMesh(56, 52, 96, this.mShorts);
    pelvis.position.y = -26;
    P.add(pelvis);

    // Boxing shorts trunk body
    const trunks = boxMesh(58, 42, 94, this.mShorts);
    trunks.position.y = -10;
    P.add(trunks);

    // Thick elastic waistband
    const waistband = boxMesh(62, 12, 98, this.mWaistband);
    waistband.position.y = 2;
    P.add(waistband);

    // Champion belt gold buckle emblem
    const buckle = boxMesh(12, 10, 24, this.mGold);
    buckle.position.set(27, 2, 0);
    P.add(buckle);

    // Side racing stripes on trunks (Left and Right)
    const stripeL = boxMesh(59, 44, 8, this.mStripe);
    stripeL.position.set(0, -10, 44);
    P.add(stripeL);

    const stripeR = boxMesh(59, 44, 8, this.mStripe);
    stripeR.position.set(0, -10, -44);
    P.add(stripeR);

    // Trim at hem cuffs
    const hemL = boxMesh(34, 8, 38, this.mTrunksTrim);
    hemL.position.set(0, -32, 22);
    P.add(hemL);

    const hemR = boxMesh(34, 8, 38, this.mTrunksTrim);
    hemR.position.set(0, -32, -22);
    P.add(hemR);
  }

  // ------------------------------------------------------------------
  // 2. MUSCULAR CHEST & TORSO
  // ------------------------------------------------------------------
  _buildMuscularTorso() {
    const T = this.torso;

    // Ribcage core
    const ribcage = boxMesh(58, 68, 92, this.mSkinDark);
    ribcage.position.y = 36;
    T.add(ribcage);

    // Left and Right Pectoral muscle plates
    const pecL = boxMesh(26, 32, 40, this.mSkin);
    pecL.position.set(16, 62, 22);
    pecL.rotation.y = -0.12;
    T.add(pecL);

    const pecR = boxMesh(26, 32, 40, this.mSkin);
    pecR.position.set(16, 62, -22);
    pecR.rotation.y = 0.12;
    T.add(pecR);

    // Sternum groove (shadow between pecs)
    const sternum = boxMesh(4, 28, 4, this.mSkinShadow);
    sternum.position.set(28, 62, 0);
    T.add(sternum);

    // Collarbone (Clavicle)
    const clavicle = boxMesh(12, 6, 84, this.mSkin);
    clavicle.position.set(12, 78, 0);
    T.add(clavicle);

    // 6-Pack Abdominal Muscles
    const abRows = [
      { y: 38, w: 22, h: 14, d: 34 },
      { y: 22, w: 20, h: 13, d: 32 },
      { y: 7,  w: 18, h: 12, d: 30 }
    ];

    abRows.forEach(row => {
      const abL = boxMesh(row.w, row.h, row.d * 0.46, this.mSkin);
      abL.position.set(16, row.y, row.d * 0.25);
      T.add(abL);

      const abR = boxMesh(row.w, row.h, row.d * 0.46, this.mSkin);
      abR.position.set(16, row.y, -row.d * 0.25);
      T.add(abR);
    });

    // Latissimus Dorsi (V-taper back wings)
    const latL = boxMesh(28, 52, 16, this.mSkinDark);
    latL.position.set(-14, 48, 44);
    latL.rotation.z = 0.1;
    T.add(latL);

    const latR = boxMesh(28, 52, 16, this.mSkinDark);
    latR.position.set(-14, 48, -44);
    latR.rotation.z = 0.1;
    T.add(latR);

    // Deltoid Shoulder Bulges
    const shoulderL = sphereMesh(22, this.mSkin, 14, 12);
    shoulderL.position.set(2, 78, 48);
    T.add(shoulderL);

    const shoulderR = sphereMesh(22, this.mSkin, 14, 12);
    shoulderR.position.set(2, 78, -48);
    T.add(shoulderR);
  }

  // ------------------------------------------------------------------
  // 3. 3D HEAD & STYLIZED HAIR
  // ------------------------------------------------------------------
  _buildHeadAndHair(isRyuga) {
    this.headG = new THREE.Group();
    this.headG.position.y = 92;
    this.torso.add(this.headG);

    // Muscular neck with trapezius slope
    const neck = boxMesh(26, 16, 26, this.mSkinDark);
    neck.position.y = 8;
    this.headG.add(neck);

    // Skull & Facial Structure
    const cranium = boxMesh(48, 54, 48, this.mSkin);
    cranium.position.y = 35;
    this.headG.add(cranium);

    // Defined Fighter Jawline & Chin
    const jaw = boxMesh(42, 24, 42, this.mSkinDark);
    jaw.position.set(4, 16, 0);
    this.headG.add(jaw);

    const chin = boxMesh(16, 14, 20, this.mSkin);
    chin.position.set(24, 14, 0);
    this.headG.add(chin);

    // 3D Stylized Nose
    const nose = boxMesh(12, 16, 8, this.mSkinDark);
    nose.position.set(28, 32, 0);
    this.headG.add(nose);

    // Brow Ridge
    const brow = boxMesh(14, 10, 42, this.mSkinDark);
    brow.position.set(23, 42, 0);
    this.headG.add(brow);

    // Protective Mouthguard
    const mouthguard = boxMesh(10, 8, 22, this.mMouth);
    mouthguard.position.set(25, 22, 0);
    this.headG.add(mouthguard);

    // Left and Right Ears
    const earL = boxMesh(8, 16, 6, this.mSkinDark);
    earL.position.set(0, 32, 26);
    this.headG.add(earL);

    const earR = boxMesh(8, 16, 6, this.mSkinDark);
    earR.position.set(0, 32, -26);
    this.headG.add(earR);

    // Multi-layered 3D Stylized Hair
    const hairBase = boxMesh(52, 28, 52, this.mHair);
    hairBase.position.set(-2, 58, 0);
    this.headG.add(hairBase);

    if (isRyuga) {
      // Ryuga: Fierce swept-back champion spikes
      for (let i = 0; i < 5; i++) {
        const spike = boxMesh(28 - i * 3, 14, 12, this.mHairHighlight);
        spike.position.set(-10 - i * 6, 64 + i * 2, (i % 2 === 0 ? 1 : -1) * (i * 6));
        spike.rotation.z = -0.35;
        this.headG.add(spike);
      }
    } else {
      // Akira: Dynamic forward/upward hero hair locks
      const spikes = [
        { x: 18, y: 72, z: 0, rotZ: 0.4, w: 18, h: 22, d: 16 },
        { x: 14, y: 74, z: 15, rotZ: 0.35, w: 16, h: 20, d: 14 },
        { x: 14, y: 74, z: -15, rotZ: 0.35, w: 16, h: 20, d: 14 },
        { x: -6, y: 76, z: 0, rotZ: 0.1, w: 22, h: 22, d: 24 },
        { x: -16, y: 70, z: 12, rotZ: -0.2, w: 16, h: 18, d: 16 },
        { x: -16, y: 70, z: -12, rotZ: -0.2, w: 16, h: 18, d: 16 }
      ];

      spikes.forEach((s, idx) => {
        const spike = boxMesh(s.w, s.h, s.d, idx % 2 === 0 ? this.mHair : this.mHairHighlight);
        spike.position.set(s.x, s.y, s.z);
        spike.rotation.z = s.rotZ;
        this.headG.add(spike);
      });
    }
  }

  // ------------------------------------------------------------------
  // 4. ARMS & DETAILED 3D BOXING GLOVES
  // ------------------------------------------------------------------
  _buildArmsAndGloves() {
    const buildArm = (sideZ) => {
      const shoulder = new THREE.Group();
      shoulder.position.set(2, 78, 48 * sideZ);
      const upper = new THREE.Group();
      shoulder.add(upper);

      // Biceps and triceps bulge
      const bicep = boxMesh(28, 86, 28, this.mSkin);
      bicep.position.y = -43;
      upper.add(bicep);

      const tricepPeak = sphereMesh(14, this.mSkinDark, 10, 8);
      tricepPeak.position.set(-6, -38, 0);
      upper.add(tricepPeak);

      // Elbow joint
      const elbow = new THREE.Group();
      elbow.position.y = -86;
      upper.add(elbow);

      // Tapered forearm
      const forearm = boxMesh(26, 82, 26, this.mSkin);
      forearm.position.y = -41;
      elbow.add(forearm);

      // Wrist tape wraps
      const wristTape = boxMesh(30, 20, 30, this.mTape);
      wristTape.position.y = -72;
      elbow.add(wristTape);

      // Wrist pivot
      const wrist = new THREE.Group();
      wrist.position.y = -82;
      elbow.add(wrist);

      // --- 3D BOXING GLOVE MESH ---
      const gloveG = new THREE.Group();
      wrist.add(gloveG);

      // Main padded glove body
      const gloveBody = boxMesh(40, 42, 38, this.mGlove);
      gloveBody.position.set(22, -10, 0);
      gloveG.add(gloveBody);

      // Heavy knuckle strike plate
      const knucklePad = boxMesh(24, 30, 34, this.mGloveDark);
      knucklePad.position.set(40, -10, 0);
      gloveG.add(knucklePad);

      // Curved thumb guard
      const thumb = boxMesh(18, 20, 14, this.mGloveDark);
      thumb.position.set(16, -6, 18 * sideZ);
      thumb.rotation.y = -0.3 * sideZ;
      gloveG.add(thumb);

      // Glove wrist collar & laces band
      const gloveCollar = boxMesh(34, 14, 34, this.mWaistband);
      gloveCollar.position.set(6, 4, 0);
      gloveG.add(gloveCollar);

      this.torso.add(shoulder);
      return { shoulder, upper, elbow, wrist, gloveG, side: sideZ };
    };

    this.armL = buildArm(1);
    this.armR = buildArm(-1);
  }

  // ------------------------------------------------------------------
  // 5. LEGS & HIGH-TOP BOXING BOOTS
  // ------------------------------------------------------------------
  _buildLegsAndBoots() {
    const buildLeg = (sideZ) => {
      const hip = new THREE.Group();
      hip.position.set(0, -8, 22 * sideZ);

      // Muscular Thigh (Quads)
      const thigh = boxMesh(36, 92, 38, this.mShorts);
      thigh.position.y = -46;
      hip.add(thigh);

      const quadBulge = sphereMesh(18, this.mSkinDark, 10, 8);
      quadBulge.position.set(8, -42, 0);
      hip.add(quadBulge);

      // Knee joint
      const knee = new THREE.Group();
      knee.position.y = -92;
      hip.add(knee);

      // Calves (Gastrocnemius)
      const calf = boxMesh(28, 76, 30, this.mSkin);
      calf.position.y = -38;
      knee.add(calf);

      const calfBulge = sphereMesh(15, this.mSkinDark, 10, 8);
      calfBulge.position.set(-6, -30, 0);
      knee.add(calfBulge);

      // Shin guards / Ankle tape wraps
      const shinTape = boxMesh(30, 36, 32, this.mTape);
      shinTape.position.y = -58;
      knee.add(shinTape);

      // Ankle joint
      const ankle = new THREE.Group();
      ankle.position.y = -76;
      knee.add(ankle);

      // --- HIGH-TOP BOXING BOOTS ---
      const boot = boxMesh(34, 36, 38, this.mBoot);
      boot.position.set(10, -12, 0);
      ankle.add(boot);

      // Boot tongue & laces
      const bootLaces = boxMesh(12, 28, 16, this.mBootTrim);
      bootLaces.position.set(24, -6, 0);
      ankle.add(bootLaces);

      // Rubber grip sole
      const sole = boxMesh(38, 8, 42, this.mShorts);
      sole.position.set(10, -32, 0);
      ankle.add(sole);

      this.hips.add(hip);
      return { hip, knee, ankle, side: sideZ };
    };

    this.legL = buildLeg(1);
    this.legR = buildLeg(-1);
  }

  // ------------------------------------------------------------------
  // 6. SUPER AURA FX (Glowing Fire Ring for Special Moves)
  // ------------------------------------------------------------------
  _buildAuraFX() {
    const auraGeo = new THREE.TorusGeometry(52, 8, 12, 24);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      wireframe: true
    });
    this.auraMesh = new THREE.Mesh(auraGeo, auraMat);
    this.auraMesh.rotation.x = Math.PI / 2;
    this.auraMesh.position.y = 10;
    this.pose.add(this.auraMesh);
    this.materials.push(auraMat);
  }

  // ------------------------------------------------------------------
  // FACING & CORNER ORIENTATION
  // ------------------------------------------------------------------
  setFacing(dir) {
    if (dir === this.facing && this.body.rotation.y !== 0) return;
    this.facing = dir;
    this.body.rotation.y = dir === 1 ? 0 : Math.PI;
  }

  leadArmKey() { return this.facing === 1 ? 'armR' : 'armL'; }
  rearArmKey() { return this.facing === 1 ? 'armL' : 'armR'; }

  // ------------------------------------------------------------------
  // ACTION TRIGGERS
  // ------------------------------------------------------------------
  playIdle() {
    this.action = { type: 'idle', t: 0, dur: Infinity };
  }

  playWalk(speed) {
    if (this.action && this.action.type === 'walk') {
      this.action.speed = speed;
      return;
    }
    this.action = { type: 'walk', t: Math.random() * 2, dur: Infinity, speed };
  }

  playPunch(type, arm, onImpact) {
    const durs = { jab: 220, hook: 300, uppercut: 360, special: 620 };
    this.action = {
      type: 'punch',
      punchType: type,
      armKey: arm === 'rear' ? this.rearArmKey() : this.leadArmKey(),
      t: 0,
      dur: durs[type] || 260,
      impactAt: type === 'special' ? 0.65 : 0.48,
      fired: false,
      onImpact
    };
  }

  playSuperSpecial(onImpact, onFinish) {
    this.isSuperActive = true;
    this.action = {
      type: 'special',
      t: 0,
      dur: 680,
      impactAt: 0.58,
      fired: false,
      onImpact,
      onFinish
    };
  }

  playBlock(active) {
    this.action = { type: 'block', active, t: 0, dur: Infinity };
  }

  playDodge(dir) {
    this.action = { type: 'dodge', t: 0, dur: 320, dir };
  }

  playClinch(onImpact) {
    this.action = { type: 'clinch', t: 0, dur: 360, fired: false, onImpact };
  }

  playStagger(duration = 420) {
    this.action = { type: 'stagger', t: 0, dur: duration };
  }

  playKnockdown(dir) {
    this.action = null;
    this.ko = 0.0001;
    this.koDir = dir || -1;
  }

  playVictory() {
    this.action = { type: 'victory', t: 0, dur: Infinity };
  }

  resetPose() {
    this.action = { type: 'idle', t: 0, dur: Infinity };
    this.ko = 0;
    this.flash = 0;
    this.opacityTarget = 1;
    this.lean = { x: 0, z: 0 };
    this.punchExtend = 0;
    this.isSuperActive = false;
    this.superGlow = 0;
    this.body.rotation.y = this.facing === 1 ? 0 : Math.PI;
    this.body.rotation.z = 0;
    this.pose.rotation.set(0, 0, 0);
    this.root.rotation.set(0, 0, 0);
    this.root.position.y = BOXER.hipHeight;
    this.setOpacity(1);
    this.clearFlash();
    this.applyPoseInternal(0.016, true);
  }

  // ------------------------------------------------------------------
  // FRAME UPDATE & KINEMATICS
  // ------------------------------------------------------------------
  update(dt) {
    this.animTime += dt;

    // --- KNOCKDOWN SEQUENCE (10-Count KO) ---
    if (this.ko > 0) {
      this.ko = Math.min(1, this.ko + dt * 0.9);
      const k = this.ko;
      this.pose.rotation.z = 1.48 * k * k;
      this.body.rotation.y = this.facing === 1 ? 0 : Math.PI;
      this.root.rotation.z = -this.koDir * 0.18 * k;
      this.root.position.y = BOXER.hipHeight - (BOXER.hipHeight - 24) * (k * (1.35 - 0.35 * k));
      this.flash = Math.max(0, this.flash - dt * 3);
      this.punchExtend = 0;
      this.applyPoseInternal(dt, false);
      this.applyFlashFx();
      return;
    }

    // --- ACTION TIMELINE ---
    const act = this.action;
    if (act && act.dur !== Infinity) {
      act.t += dt * 1000;
      if (act.t >= act.dur) {
        if (act.onFinish) act.onFinish();
        this.action = null;
        this.isSuperActive = false;
      }
    }

    if (act && (act.type === 'punch' || act.type === 'special') && !act.fired &&
        act.t / act.dur >= act.impactAt) {
      act.fired = true;
      if (act.onImpact) act.onImpact();
    }

    if (act && act.type === 'clinch' && !act.fired && act.t / act.dur >= 0.42) {
      act.fired = true;
      if (act.onImpact) act.onImpact();
    }

    // Flash decay
    this.flash = Math.max(0, this.flash - dt * 3.5);

    // Opacity transitions (dodge ghosting)
    if (Math.abs(this._matOpacity - this.opacityTarget) > 0.01) {
      const o = this._matOpacity + (this.opacityTarget - this._matOpacity) * Math.min(1, dt * 14);
      this.setOpacity(o);
    }

    // Super aura pulse
    if (this.isSuperActive) {
      this.superGlow = (Math.sin(this.animTime * 15) + 1) * 0.5;
      this.auraMesh.material.opacity = 0.4 + this.superGlow * 0.4;
      this.auraMesh.rotation.z += dt * 8;
      this.auraMesh.scale.setScalar(1 + this.superGlow * 0.3);
    } else {
      this.auraMesh.material.opacity = 0;
    }

    this.applyPoseInternal(dt, false);
    this.applyFlashFx();
  }

  // ------------------------------------------------------------------
  // POSE SOLVER (Authentic Boxing Kinematics)
  // ------------------------------------------------------------------
  applyPoseInternal(dt, snap) {
    const G = GUARD_POSE;
    const P = {
      torso: { x: G.torsoX + this.lean.x, y: G.torsoY, z: G.torsoZ + this.lean.z },
      head: { x: G.headX, y: 0, z: G.headZ },
      armL: { shZ: G.armShZ, shX: G.armShX, elZ: G.armElZ, elX: 0 },
      armR: { shZ: G.armShZ, shX: -G.armShX, elZ: G.armElZ, elX: 0 },
      legL: { hipZ: G.legHipZ, kneeZ: G.legKneeZ },
      legR: { hipZ: G.legHipZ, kneeZ: G.legKneeZ },
      bob: 0
    };

    const act = this.action;

    if (this.ko > 0) {
      // Knocked out sprawl
      P.armL.shZ = 0.25; P.armL.elZ = 1.1;
      P.armR.shZ = 0.25; P.armR.elZ = 1.1;
      P.head.z = 0.4;
      P.torso.z = G.torsoZ - 0.12;
    } else if (act) {
      switch (act.type) {
        // --- 1. FOOTWORK SHUFFLE STEP ---
        case 'walk': {
          const ph = (act.t / 1000) * 9.5;
          const sp = Math.min(1, (act.speed || 140) / 260);
          const s = Math.sin(ph) * (0.55 * sp + 0.12);

          P.legL.hipZ = G.legHipZ + s;
          P.legR.hipZ = G.legHipZ - s;
          // Knee flexes most on the advancing step
          P.legL.kneeZ = G.legKneeZ - Math.max(0, s) * 1.1;
          P.legR.kneeZ = G.legKneeZ - Math.max(0, -s) * 1.1;

          // Subtle upper body rhythmic counter-sway
          P.bob = Math.abs(Math.sin(ph)) * 6.5 * sp;
          P.torso.z = P.torso.z + Math.sin(ph) * 0.05;
          P.torso.x = P.torso.x + Math.cos(ph) * 0.03;
          break;
        }

        // --- 2. SNAPPING JAB / POWER HOOK / CRUSHING UPPERCUT ---
        case 'punch': {
          const p = Math.min(1, act.t / act.dur);
          const key = act.armKey;
          const A = P[key];
          const side = key === 'armL' ? 1 : -1;
          const e = easeOutQuart(p);

          if (act.punchType === 'jab') {
            // Snappy lead jab
            A.shZ = G.armShZ + (1.65 - G.armShZ) * e;     // Level punch line
            A.elZ = G.armElZ + (0.12 - G.armElZ) * e;     // Snap extension
            A.shX = 0.08 * side;
            A.elX = 0.06 * side * e;

            P.torso.z = P.torso.z - 0.32 * e;             // Drive lead shoulder forward
            P.head.z = P.head.z - 0.08 * e;              // Chin tucked
            P.legL.kneeZ = G.legKneeZ - 0.25 * e;         // Lead foot plant
          } else if (act.punchType === 'hook') {
            // Rotational torque hook
            A.shZ = G.armShZ + (1.68 - G.armShZ) * e;
            A.elZ = G.armElZ + (0.65 - G.armElZ) * e;     // 90-degree locked elbow
            A.shX = -1.15 * side * e;                     // Wide sweeping arc
            A.elX = -0.22 * side * e;

            P.torso.y = 0.95 * e * side;                  // Hip & Torso twist
            P.torso.x = P.torso.x - 0.14 * e;
            P.legL.hipZ = G.legHipZ + 0.35 * e;           // Foot pivot
            P.legR.kneeZ = G.legKneeZ - 0.35 * e;
          } else {
            // Explosive Uppercut
            A.shZ = G.armShZ + (0.05 - G.armShZ) * e;     // Drop shoulder
            A.elZ = G.armElZ + (2.1 - G.armElZ) * e;      // Fold elbow tight
            A.shX = (G.armShX + 0.35) * side;
            A.elX = -0.25 * side * e;

            P.torso.z = P.torso.z + 0.55 * e;             // Rise into punch
            P.torso.x = P.torso.x + 0.16 * e;
            P.legL.kneeZ = G.legKneeZ - 0.6 * e;          // Dip and spring
            P.legR.kneeZ = G.legKneeZ - 0.6 * e;
            P.bob = -Math.sin(p * Math.PI) * 9;
          }

          this.punchExtend = e;
          this.punchArmKey = key;
          break;
        }

        // --- 3. SUPER SPECIAL MOVE ("METEOR DRAGON RUSH") ---
        case 'special': {
          const p = Math.min(1, act.t / act.dur);
          const e = easeOutQuart(p);
          const swing = Math.sin(p * Math.PI * 3);

          // Rushing combination punches
          P.armL.shZ = 1.3 + swing * 0.45;
          P.armL.elZ = 0.5 + Math.abs(swing) * 0.8;
          P.armR.shZ = 1.3 - swing * 0.45;
          P.armR.elZ = 0.5 + (1 - Math.abs(swing)) * 0.8;

          P.torso.z = P.torso.z - 0.45 * e;
          P.torso.y = swing * 0.3;
          P.bob = Math.sin(p * Math.PI * 4) * 8;
          this.punchExtend = 1.0;
          break;
        }

        // --- 4. HIGH GUARD BLOCK ---
        case 'block': {
          if (act.active) {
            P.armL.shZ = 1.58; P.armR.shZ = 1.58;         // Tight high guard
            P.armL.elZ = 1.78; P.armR.elZ = 1.78;
            P.armL.shX = 0.28; P.armR.shX = -0.28;        // Pinch gloves together
            P.torso.z = -0.22;
            P.torso.x = 0.18;                             // Duck chin behind gloves
            P.head.z = 0.24;
            P.head.x = -0.10;
          }
          break;
        }

        // --- 5. SLIP & ROLL DODGE ---
        case 'dodge': {
          const p = Math.min(1, act.t / act.dur);
          const slide = Math.sin(p * Math.PI);
          // Lean shoulders and roll head under fist line
          P.torso.z = P.torso.z - 0.48 * slide;
          P.torso.x = P.torso.x + 0.35 * slide * (act.dir || 1);
          P.head.z = P.head.z + 0.28 * slide;
          P.armL.shZ = 1.58; P.armL.elZ = 1.65;
          P.armR.shZ = 1.58; P.armR.elZ = 1.65;
          P.bob = -Math.sin(p * Math.PI) * 11;
          break;
        }

        // --- 6. VISCERAL HIT STAGGER ---
        case 'stagger': {
          const p = Math.min(1, act.t / act.dur);
          const shake = Math.sin((act.t / act.dur) * 32) * (1 - p);
          P.head.z = 0.35 + shake * 0.7;
          P.head.x = -0.35 - shake * 0.45;
          P.torso.z = P.torso.z + 0.25 * (1 - p);
          P.armL.shZ = 0.35 + shake * 1.0; P.armR.shZ = 0.35 - shake * 1.0;
          P.armL.elZ = 0.9; P.armR.elZ = 0.9;
          this.flash = Math.max(this.flash, 0.85);
          break;
        }

        // --- 7. CLINCH PUSH ---
        case 'clinch': {
          const p = Math.min(1, act.t / act.dur);
          P.armL.shZ = 1.65 * p; P.armR.shZ = 1.65 * p;
          P.armL.elZ = 0.75; P.armR.elZ = 0.75;
          P.torso.z = P.torso.z - 0.42 * p;
          break;
        }

        // --- 8. VICTORY CELEBRATION ---
        case 'victory': {
          const t = this.animTime;
          P.armL.shZ = 0.75 + Math.sin(t * 4) * 0.15;
          P.armR.shZ = 0.75 + Math.cos(t * 4) * 0.15;
          P.armL.elZ = 0.2; P.armR.elZ = 0.2;
          P.armL.shX = -0.75; P.armR.shX = 0.75;
          P.bob = Math.abs(Math.sin(t * 2.5)) * 14;
          break;
        }
        default: break;
      }
    } else {
      // Natural breathing & boxing bounce
      P.bob = Math.sin(this.animTime * 3.2 + this.idlePhase) * 1.8;
      P.torso.z = G.torsoZ + Math.sin(this.animTime * 3.2 + this.idlePhase) * 0.02;
    }

    // ---------------- LERP JOINT ROTATIONS ----------------
    const kBody = snap ? 1 : Math.min(1, dt * 16);
    const kLimb = snap ? 1 : Math.min(1, dt * 36);

    const lerpRot = (node, tx, ty, tz, factor) => {
      node.rotation.x += (tx - node.rotation.x) * factor;
      node.rotation.y += (ty - node.rotation.y) * factor;
      node.rotation.z += (tz - node.rotation.z) * factor;
    };

    lerpRot(this.parts.torso, P.torso.x, P.torso.y, P.torso.z, kBody);
    lerpRot(this.parts.head, P.head.x, P.head.y, P.head.z, kLimb);

    const setArm = (key, A) => {
      const arm = this.parts[key];
      lerpRot(arm.shoulder, 0, 0, A.shZ, kLimb);
      arm.shoulder.rotation.x += (A.shX - arm.shoulder.rotation.x) * kLimb;
      lerpRot(arm.elbow, A.elX, 0, A.elZ, kLimb);

      // Glove snap rotation at full extension
      const ext = this.punchExtend;
      const snapRot = -0.18 * ext;
      arm.wrist.rotation.z += (snapRot - arm.wrist.rotation.z) * Math.min(1, dt * 55);
    };

    setArm('armL', P.armL);
    setArm('armR', P.armR);

    const setLeg = (key, L) => {
      const leg = this.parts[key];
      lerpRot(leg.hip, 0, 0, L.hipZ, kBody);
      lerpRot(leg.knee, 0, 0, L.kneeZ, kBody);
      leg.ankle.rotation.z += (L.kneeZ * -0.28 - leg.ankle.rotation.z) * kBody;
    };

    setLeg('legL', P.legL);
    setLeg('legR', P.legR);

    this.parts.hips.position.y += (P.bob - this.parts.hips.position.y) * kBody;
  }

  // ------------------------------------------------------------------
  // WORLD POSITIONS FOR COMBAT HITBOXES & FX
  // ------------------------------------------------------------------
  getGloveWorldPos() {
    const arm = this.parts[this.punchArmKey || 'armL'];
    if (!arm) return null;
    this._scratch.set(0, 0, 0);
    arm.wrist.getWorldPosition(this._scratch);
    return this._scratch;
  }

  getHeadWorldPos(out = new THREE.Vector3()) {
    this.parts.head.getWorldPosition(out);
    return out;
  }

  // ------------------------------------------------------------------
  // HIT FLASH & OPACITY HELPERS
  // ------------------------------------------------------------------
  setFlash(a) { this.flash = Math.max(this.flash, a); }

  clearFlash() {
    this.flash = 0;
    this.materials.forEach(m => {
      if (m.emissive) {
        m.emissive.setHex(0x000000);
        m.emissiveIntensity = 0;
      }
    });
  }

  setOpacity(v) {
    this._matOpacity = v;
    this.materials.forEach(m => { m.opacity = v; });
  }

  applyFlashFx() {
    const on = this.flash > 0.01;
    if (on) {
      const intensity = Math.min(1.2, this.flash);
      this.materials.forEach(m => {
        if (m.emissive) {
          m.emissive.setHex(0xff3300);
          m.emissiveIntensity = intensity;
        }
      });
    } else if (this._flashOn) {
      this.clearFlash();
    }
    this._flashOn = on;
  }
}

function easeOutQuart(t) {
  return 1 - Math.pow(1 - t, 4);
}
