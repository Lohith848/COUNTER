/**
 * Ring3D — 90s Championship Boxing Arena Environment.
 * Features:
 * - 100% Procedural 3D arena (No external image files needed).
 * - High-res procedural canvas mat with retro championship decals & boundary lines.
 * - Corner posts with Red (Ryuga) and Blue (Akira) corner pads + steel turnbuckles.
 * - Ropes on side and back boundaries (Front/1st-person POV ropes removed for unobstructed combat view).
 * - Procedural stadium arena backdrop with dark crowd silhouettes, neon arena truss, dynamic spotlights & flashbulbs.
 */

import * as THREE from 'three';

export const ARENA = {
  floorX: 2000,
  floorZ: 1400,
  postY: 340,
  ropeLevels: [110, 185, 260],
  postX: 740,
  postZ: 410
};

/**
 * Procedurally paint high-res 90s retro championship canvas mat.
 */
function paintChampionshipMat() {
  const W = 1024;
  const H = 512;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');

  // 1. Arena Floor Surround
  const gradFloor = g.createRadialGradient(W / 2, H * 0.5, 60, W / 2, H * 0.5, 680);
  gradFloor.addColorStop(0, '#101620');
  gradFloor.addColorStop(1, '#05070a');
  g.fillStyle = gradFloor;
  g.fillRect(0, 0, W, H);

  // 2. Ring Canvas Mat Bounds
  const mx = W * 0.08;
  const my = H * 0.07;
  const mw = W - mx * 2;
  const mh = H - my * 2;

  // Mat surface gradient (deep navy steel blue with center stage spotlight sheen)
  const matGrad = g.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, mw * 0.6);
  matGrad.addColorStop(0, '#3d4f63');
  matGrad.addColorStop(0.5, '#253444');
  matGrad.addColorStop(1, '#151e28');
  g.fillStyle = matGrad;
  g.fillRect(mx, my, mw, mh);

  // Outer Apron border
  g.strokeStyle = '#66fcf1';
  g.lineWidth = 4;
  g.strokeRect(mx, my, mw, mh);

  // Corner Floor Accents (Blue Corner Left / Red Corner Right)
  const blueCornerGrad = g.createLinearGradient(mx, my, mx + 160, my + 160);
  blueCornerGrad.addColorStop(0, 'rgba(0, 150, 255, 0.35)');
  blueCornerGrad.addColorStop(1, 'rgba(0, 150, 255, 0)');
  g.fillStyle = blueCornerGrad;
  g.beginPath();
  g.moveTo(mx, my);
  g.lineTo(mx + 180, my);
  g.lineTo(mx, my + 180);
  g.closePath();
  g.fill();

  const redCornerGrad = g.createLinearGradient(mx + mw, my, mx + mw - 160, my + 160);
  redCornerGrad.addColorStop(0, 'rgba(255, 30, 60, 0.35)');
  redCornerGrad.addColorStop(1, 'rgba(255, 30, 60, 0)');
  g.fillStyle = redCornerGrad;
  g.beginPath();
  g.moveTo(mx + mw, my);
  g.lineTo(mx + mw - 180, my);
  g.lineTo(mx + mw, my + 180);
  g.closePath();
  g.fill();

  // 3. Inner White Combat Bounds
  const ix = mx + mw * 0.09;
  const iy = my + mh * 0.09;
  const iw = mw * 0.82;
  const ih = mh * 0.82;
  g.strokeStyle = 'rgba(240, 245, 255, 0.85)';
  g.lineWidth = 5;
  g.strokeRect(ix, iy, iw, ih);

  // Center Circle & Divider Line
  g.beginPath();
  g.arc(W / 2, H / 2, 54, 0, Math.PI * 2);
  g.strokeStyle = 'rgba(240, 245, 255, 0.7)';
  g.lineWidth = 4;
  g.stroke();

  g.beginPath();
  g.moveTo(W / 2, iy);
  g.lineTo(W / 2, iy + ih);
  g.strokeStyle = 'rgba(240, 245, 255, 0.3)';
  g.lineWidth = 2;
  g.stroke();

  // 4. Retro 90s Championship Typography
  g.fillStyle = 'rgba(255, 255, 255, 0.75)';
  g.font = '900 22px "Press Start 2P", Arial, sans-serif';
  g.textAlign = 'center';
  g.fillText('RING OF', W / 2, H / 2 - 14);

  g.fillStyle = '#ff0055';
  g.font = '900 28px "Press Start 2P", Arial, sans-serif';
  g.fillText('DOMINANCE', W / 2, H / 2 + 24);

  g.fillStyle = 'rgba(0, 220, 255, 0.8)';
  g.font = '700 14px "Outfit", sans-serif';
  g.textAlign = 'left';
  g.fillText('BLUE CORNER: AKIRA', ix + 12, iy + 24);

  g.fillStyle = 'rgba(255, 50, 90, 0.8)';
  g.font = '700 14px "Outfit", sans-serif';
  g.textAlign = 'right';
  g.fillText('RED CORNER: RYUGA', ix + iw - 12, iy + 24);

  // 5. Canvas Fabric Texture Weave
  g.strokeStyle = 'rgba(0, 0, 0, 0.08)';
  g.lineWidth = 1;
  for (let x = mx; x <= mx + mw; x += 22) {
    g.beginPath();
    g.moveTo(x, my);
    g.lineTo(x, my + mh);
    g.stroke();
  }
  for (let y = my; y <= my + mh; y += 22) {
    g.beginPath();
    g.moveTo(mx, y);
    g.lineTo(mx + mw, y);
    g.stroke();
  }

  return c;
}

/**
 * Procedurally paint 90s retro championship stadium arena wall backdrop
 * (No external ring.jpg required).
 */
function paintArenaBackdropCanvas() {
  const W = 1024;
  const H = 512;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');

  // Dark stadium ambient gradient
  const grad = g.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#04070c');
  grad.addColorStop(0.4, '#0d1522');
  grad.addColorStop(0.7, '#162338');
  grad.addColorStop(1, '#070b12');
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);

  // Stadium seating tiers & crowd silhouette levels
  g.fillStyle = '#090e17';
  for (let y = H * 0.45; y < H * 0.85; y += 28) {
    g.fillRect(0, y, W, 8);
    // Subtle crowd head shapes
    g.fillStyle = 'rgba(18, 28, 42, 0.8)';
    for (let x = 10; x < W; x += 18 + (x % 7)) {
      g.beginPath();
      g.arc(x, y - 3, 5, 0, Math.PI * 2);
      g.fill();
    }
  }

  // Overhead arena floodlight glow beams
  const lightBeams = [
    { x: W * 0.15, c: 'rgba(0, 200, 255, 0.25)' },
    { x: W * 0.38, c: 'rgba(255, 240, 200, 0.35)' },
    { x: W * 0.62, c: 'rgba(255, 240, 200, 0.35)' },
    { x: W * 0.85, c: 'rgba(255, 40, 100, 0.25)' }
  ];

  lightBeams.forEach(b => {
    const beamGrad = g.createRadialGradient(b.x, 0, 10, b.x, H * 0.7, 300);
    beamGrad.addColorStop(0, b.c);
    beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    g.fillStyle = beamGrad;
    g.beginPath();
    g.moveTo(b.x - 40, 0);
    g.lineTo(b.x + 40, 0);
    g.lineTo(b.x + 220, H);
    g.lineTo(b.x - 220, H);
    g.closePath();
    g.fill();
  });

  // Top Neon Arena Banner
  g.fillStyle = 'rgba(102, 252, 241, 0.7)';
  g.font = '900 18px "Press Start 2P", Arial, sans-serif';
  g.textAlign = 'center';
  g.fillText('★ 90s WORLD CHAMPIONSHIP BOXING ARENA ★', W / 2, 45);

  return c;
}

export default class Ring3D {
  /**
   * @param {THREE.Scene} scene
   */
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    scene.add(this.group);

    this.flashbulbs = [];
    this.spotlights = [];

    this.buildLights();
    this.buildFloor();
    this.buildBackdrop();
    this.buildRopesAndCorners();
    this.buildOverheadTruss();
    this.buildAudienceFlashbulbs();
  }

  buildLights() {
    const hemi = new THREE.HemisphereLight(0xc8ddf0, 0x12100e, 0.95);
    this.scene.add(hemi);

    // Warm broadcast key light from audience side
    const keyLight = new THREE.DirectionalLight(0xfff4e0, 1.8);
    keyLight.position.set(500, 950, 650);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.camera.left = -1200;
    keyLight.shadow.camera.right = 1200;
    keyLight.shadow.camera.top = 900;
    keyLight.shadow.camera.bottom = -900;
    keyLight.shadow.camera.near = 100;
    keyLight.shadow.camera.far = 3000;
    keyLight.shadow.bias = -0.0005;
    this.scene.add(keyLight);

    // Cool neon rim light from back arena wall
    const rimLight = new THREE.DirectionalLight(0x4488ff, 0.85);
    rimLight.position.set(-600, 350, -750);
    this.scene.add(rimLight);

    // Center Stage Spotlight
    const spot = new THREE.SpotLight(0xffffff, 1100, 0, Math.PI / 4.8, 0.5, 1.2);
    spot.position.set(0, 1350, 0);
    spot.target.position.set(0, 0, 0);
    this.scene.add(spot);
    this.scene.add(spot.target);

    // Colored Dynamic Moving Searchlights (Cyan and Magenta)
    const spotCyan = new THREE.SpotLight(0x00ffff, 450, 1800, Math.PI / 7, 0.7);
    spotCyan.position.set(-500, 800, -200);
    this.scene.add(spotCyan);
    this.scene.add(spotCyan.target);
    this.spotlights.push({ light: spotCyan, basePos: spotCyan.position.clone(), speed: 1.2, phase: 0 });

    const spotMagenta = new THREE.SpotLight(0xff0088, 450, 1800, Math.PI / 7, 0.7);
    spotMagenta.position.set(500, 800, -200);
    this.scene.add(spotMagenta);
    this.scene.add(spotMagenta.target);
    this.spotlights.push({ light: spotMagenta, basePos: spotMagenta.position.clone(), speed: 1.4, phase: Math.PI });

    // Volumetric arena fog
    this.scene.fog = new THREE.Fog(0x0a0e14, 850, 2700);
  }

  buildFloor() {
    const canvas = paintChampionshipMat();
    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 4;
    tex.colorSpace = THREE.SRGBColorSpace;

    const u0 = 0.08, u1 = 0.92;
    const v0 = 0.07, v1 = 0.93;
    const planeW = 1400 / (u1 - u0);
    const planeD = 620 / (v1 - v0);

    const mat = new THREE.Mesh(
      new THREE.PlaneGeometry(ARENA.floorX, ARENA.floorZ),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, metalness: 0.04 })
    );
    mat.rotation.x = -Math.PI / 2;
    mat.position.y = 0;
    mat.receiveShadow = true;
    mat.scale.x = planeW / ARENA.floorX;
    mat.scale.y = planeD / ARENA.floorZ;
    this.mat = mat;
    this.group.add(mat);
  }

  buildBackdrop() {
    // 100% Procedural stadium arena wall canvas (No ring.jpg dependency)
    const bgCanvas = paintArenaBackdropCanvas();
    const bgTex = new THREE.CanvasTexture(bgCanvas);
    bgTex.colorSpace = THREE.SRGBColorSpace;
    bgTex.anisotropy = 4;

    const wall = new THREE.Mesh(
      new THREE.PlaneGeometry(3200, 1800),
      new THREE.MeshBasicMaterial({ map: bgTex })
    );
    wall.position.set(0, 850, -1200);
    this.group.add(wall);

    // Floor-to-wall vignette blend
    const vg = document.createElement('canvas');
    vg.width = 256; vg.height = 128;
    const g = vg.getContext('2d');
    const grad = g.createLinearGradient(0, 0, 0, 128);
    grad.addColorStop(0, 'rgba(10, 14, 20, 0)');
    grad.addColorStop(1, 'rgba(10, 14, 20, 0.92)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 256, 128);

    const vt = new THREE.CanvasTexture(vg);
    const blend = new THREE.Mesh(
      new THREE.PlaneGeometry(2600, 750),
      new THREE.MeshBasicMaterial({ map: vt, transparent: true, depthWrite: false })
    );
    blend.position.set(0, 340, -1050);
    blend.rotation.x = 0.06;
    this.group.add(blend);
  }

  buildRopesAndCorners() {
    const ropeMat = new THREE.MeshStandardMaterial({ color: 0xe5eaf0, roughness: 0.5, metalness: 0.2 });
    const postMat = new THREE.MeshStandardMaterial({ color: 0x222a36, roughness: 0.35, metalness: 0.6 });

    // Corner Pad Materials: Blue for Akira, Red for Ryuga, Neutral White for front corners
    const padBlue = new THREE.MeshStandardMaterial({ color: 0x0077ff, roughness: 0.4, metalness: 0.1 });
    const padRed = new THREE.MeshStandardMaterial({ color: 0xff0044, roughness: 0.4, metalness: 0.1 });
    const padWhite = new THREE.MeshStandardMaterial({ color: 0xecf0f1, roughness: 0.5, metalness: 0.1 });

    const x0 = -ARENA.postX, x1 = ARENA.postX;
    const z0 = -ARENA.postZ, z1 = ARENA.postZ;

    const corners = [
      { x: x0, z: z0, padMat: padBlue, name: 'Akira Corner' },
      { x: x1, z: z0, padMat: padRed, name: 'Ryuga Corner' },
      { x: x0, z: z1, padMat: padWhite, name: 'Neutral Left' },
      { x: x1, z: z1, padMat: padWhite, name: 'Neutral Right' }
    ];

    corners.forEach(c => {
      // Steel post
      const post = new THREE.Mesh(new THREE.CylinderGeometry(24, 28, ARENA.postY, 14), postMat);
      post.position.set(c.x, ARENA.postY / 2, c.z);
      post.castShadow = true;
      this.group.add(post);

      // Padded protective corner cushion
      const pad = new THREE.Mesh(new THREE.BoxGeometry(42, 210, 42), c.padMat);
      pad.position.set(c.x * 0.96, 185, c.z * 0.96);
      pad.rotation.y = Math.PI / 4;
      pad.castShadow = true;
      this.group.add(pad);

      // Metallic top cap
      const cap = new THREE.Mesh(new THREE.SphereGeometry(28, 14, 12), postMat);
      cap.position.set(c.x, ARENA.postY, c.z);
      this.group.add(cap);
    });

    // 3-tier ring ropes
    // NOTE: Foreground 1st-person POV front ropes at z1 are omitted so the fighters are clearly visible.
    // Ropes are preserved along:
    // 1) Back side (at z0)
    // 2) Left side (at x0)
    // 3) Right side (at x1)
    const makeRopeX = (xStart, xEnd, z, y) => {
      const len = Math.abs(xEnd - xStart);
      const rope = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, len, 10), ropeMat);
      rope.rotation.z = Math.PI / 2;
      rope.position.set((xStart + xEnd) / 2, y, z);
      rope.castShadow = true;
      this.group.add(rope);
    };

    const makeRopeZ = (x, zStart, zEnd, y) => {
      const len = Math.abs(zEnd - zStart);
      const rope = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, len, 10), ropeMat);
      rope.rotation.x = Math.PI / 2;
      rope.position.set(x, y, (zStart + zEnd) / 2);
      rope.castShadow = true;
      this.group.add(rope);
    };

    ARENA.ropeLevels.forEach(y => {
      // Back boundary ropes
      makeRopeX(x0 + 26, x1 - 26, z0, y);
      // Left side ropes
      makeRopeZ(x0, z0 + 26, z1 - 26, y);
      // Right side ropes
      makeRopeZ(x1, z0 + 26, z1 - 26, y);
    });
  }

  buildOverheadTruss() {
    const trussMat = new THREE.MeshStandardMaterial({ color: 0x1f242e, roughness: 0.6, metalness: 0.5 });
    const truss = new THREE.Mesh(new THREE.BoxGeometry(1600, 24, 900), trussMat);
    truss.position.set(0, 1350, 0);
    this.group.add(truss);
  }

  buildAudienceFlashbulbs() {
    // 36 Audience Camera Flashbulbs in the background
    const flashGeo = new THREE.SphereGeometry(6, 8, 6);
    for (let i = 0; i < 36; i++) {
      const flashMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0
      });
      const flash = new THREE.Mesh(flashGeo, flashMat);
      const fx = (Math.random() - 0.5) * 2400;
      const fy = 350 + Math.random() * 500;
      const fz = -1050 + Math.random() * 100;
      flash.position.set(fx, fy, fz);
      this.group.add(flash);

      this.flashbulbs.push({
        mesh: flash,
        cooldown: Math.random() * 3,
        duration: 0
      });
    }
  }

  update(dt) {
    // Animate audience flashbulbs popping in the arena
    for (let i = 0; i < this.flashbulbs.length; i++) {
      const fb = this.flashbulbs[i];
      if (fb.duration > 0) {
        fb.duration -= dt;
        fb.mesh.material.opacity = Math.max(0, fb.duration / 0.12);
      } else {
        fb.cooldown -= dt;
        if (fb.cooldown <= 0) {
          fb.duration = 0.12;
          fb.mesh.material.opacity = 1;
          fb.cooldown = 1.2 + Math.random() * 4.5;
        }
      }
    }

    // Animate sweeping colored spotlights
    for (let i = 0; i < this.spotlights.length; i++) {
      const sp = this.spotlights[i];
      sp.phase += dt * sp.speed;
      const tx = Math.sin(sp.phase) * 450;
      const tz = Math.cos(sp.phase * 0.7) * 250;
      sp.light.target.position.set(tx, 0, tz);
    }
  }
}
