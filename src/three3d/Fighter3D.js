/**
 * Fighter3D — The game-logic entity that owns and commands a 3D Boxer3D rig.
 * Manages combat states, health, stamina, Super Meter, hit detection, damage mitigation,
 * staggers, and 10-count knockdowns.
 */

import Phaser from 'phaser';
import Boxer3D, { FIGHTER_PALETTES } from './Boxer3D.js';
import { audio } from '../utils/SoundSynth.js';

export const BOUNDS = { minX: 100, maxX: 1180, minY: 445, maxY: 670 };

export default class Fighter3D {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x Classic ring x (px)
   * @param {number} y Classic ring y (px)
   * @param {string} name 'Akira' | 'Ryuga'
   * @param {object} stats Shared StatsTracker sub-object
   */
  constructor(scene, x, y, name, stats) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.name = name.toLowerCase().includes('ryuga') ? 'Ryuga' : 'Akira';
    const isRyuga = this.name === 'Ryuga';
    const pal = isRyuga ? FIGHTER_PALETTES.ryuga : FIGHTER_PALETTES.akira;

    // Build procedural 3D boxer rig
    this.boxer = new Boxer3D({
      name: this.name,
      palette: pal
    });

    this.scene.fight3d.scene.add(this.boxer.root);

    // Combat stats & meters
    this.stats = stats || {
      thrown: 0, landed: 0, jabs: 0, hooks: 0, uppercuts: 0, specials: 0, blocks: 0, dodges: 0
    };

    this.maxHealth = 100;
    this.health = 100;
    this.maxStamina = 100;
    this.stamina = 100;
    this.maxSuper = 100;
    this.superMeter = 0;       // 0 - 100% Super Gauge

    this.baseSpeed = 220;
    this.speed = 220;

    // States
    this.isAttacking = false;
    this.currentAttackType = null;
    this.isBlocking = false;
    this.isDodging = false;
    this.isStaggered = false;
    this.isKnockedOut = false;
    this.isClinching = false;
    this.isSpecialActive = false;
    this.facing = this.x < 640 ? 1 : -1;

    // Movement (px/s in classic 2D plane)
    this.vx = 0;
    this.vy = 0;
    this._lunge = null;

    this.boxer.setFacing(this.facing);
    this.syncRig(true);

    // Dynamic blob shadow
    this.shadow = this.scene.fight3d.makeBlobShadow();
    this._updateShadow();
  }

  // ------------------------------------------------------------------
  // RIG SYNCHRONIZATION
  // ------------------------------------------------------------------
  syncRig(force = false) {
    const w = this.scene.fight3d.toWorld(this.x, this.y, 0);
    const root = this.boxer.root;
    if (force || Math.abs(root.position.x - w.x) > 0.01) root.position.x = w.x;
    if (force || Math.abs(root.position.z - w.z) > 0.01) root.position.z = w.z;
  }

  _updateShadow() {
    if (!this.shadow) return;
    const w = this.scene.fight3d.toWorld(this.x, this.y, 0);
    this.shadow.position.set(w.x, 0.6, w.z);
    const opacity = this.isDodging ? 0.3 : 0.6;
    const sc = 1 - this.boxer.ko * 0.25;
    this.shadow.material.opacity = opacity;
    this.shadow.scale.setScalar(sc);
  }

  setFacing(dir) {
    if (dir === this.facing) return;
    this.facing = dir;
    this.boxer.setFacing(dir);
  }

  // ------------------------------------------------------------------
  // MOVEMENT
  // ------------------------------------------------------------------
  setVelocity(vx, vy) {
    this.vx = vx;
    this.vy = vy;
  }

  move(vx, vy) {
    if (this.isKnockedOut || this.isStaggered || this.isBlocking ||
        this.isAttacking || this.isDodging || this.isClinching || this.isSpecialActive) return;

    let dx = vx, dy = vy;
    if (dx !== 0 && dy !== 0) {
      dx *= 0.7071;
      dy *= 0.7071;
    }
    this.vx = dx * this.speed;
    this.vy = dy * this.speed;
  }

  // ------------------------------------------------------------------
  // COMBAT ACTIONS
  // ------------------------------------------------------------------
  punch(type) {
    if (this.isKnockedOut || this.isStaggered || this.isAttacking ||
        this.isBlocking || this.isDodging || this.isClinching || this.isSpecialActive) return false;

    // Stamina check
    const stamCosts = { jab: 8, hook: 16, uppercut: 24 };
    const cost = stamCosts[type] || 10;
    if (this.stamina < cost * 0.4) return false;

    this.stamina = Math.max(0, this.stamina - cost);
    this.isAttacking = true;
    this.currentAttackType = type;
    this.stats.thrown++;

    // Lunge forward slightly into the punch
    const lungeDist = type === 'jab' ? 32 : type === 'hook' ? 44 : 26;
    this._lunge = {
      dx: this.facing * lungeDist,
      t: 0,
      dur: type === 'jab' ? 140 : 180,
      startX: this.x
    };

    const isExhausted = this.stamina <= 15;
    const armChoice = Math.random() > 0.45 ? 'lead' : 'rear';

    this.boxer.playPunch(type, armChoice, () => {
      this.scene.checkPunchHit(this, type, isExhausted);
    });

    const durs = { jab: 230, hook: 310, uppercut: 370 };
    this.scene.time.delayedCall(durs[type] || 280, () => {
      this.isAttacking = false;
      this.currentAttackType = null;
      this._lunge = null;
    });

    return true;
  }

  specialAttack() {
    if (this.isKnockedOut || this.isStaggered || this.isAttacking ||
        this.isBlocking || this.isDodging || this.isClinching || this.isSpecialActive) return false;

    if (this.superMeter < 100) return false;

    // Consume full super gauge
    this.superMeter = 0;
    this.isSpecialActive = true;
    this.isAttacking = true;
    this.currentAttackType = 'special';
    if (this.stats.specials !== undefined) this.stats.specials++;

    audio.playSpecialCharge();

    // Cinematic zoom & super aura
    this.scene.fight3d.setZoom(1.25);
    this.scene.fight3d.shake(1.4);

    const head = this.boxer.getHeadWorldPos();
    const sp = this.scene.fight3d.toScreen(head);
    this.scene.showFloatyText(sp.x, sp.y - 70, 'SUPER MOVE!', '#00ffff', 900, '18px', true);

    this.boxer.playSuperSpecial(
      () => {
        // On full impact
        audio.playSpecialImpact();
        this.scene.checkPunchHit(this, 'special', false);
        this.scene.fight3d.setZoom(1.0);
      },
      () => {
        this.isSpecialActive = false;
        this.isAttacking = false;
        this.currentAttackType = null;
        this.scene.fight3d.setZoom(1.0);
      }
    );

    return true;
  }

  block() {
    if (this.isKnockedOut || this.isStaggered || this.isAttacking ||
        this.isDodging || this.isClinching || this.isSpecialActive) return;
    if (this.isBlocking) return;

    this.isBlocking = true;
    this.boxer.playBlock(true);
    this.stats.blocks++;
  }

  unblock() {
    if (!this.isBlocking) return;
    this.isBlocking = false;
    this.boxer.playBlock(false);
  }

  dodge() {
    if (this.isKnockedOut || this.isStaggered || this.isAttacking ||
        this.isDodging || this.isClinching || this.isSpecialActive) return false;
    if (this.stamina < 18) return false;

    this.stamina = Math.max(0, this.stamina - 18);
    this.isDodging = true;
    this.stats.dodges++;
    audio.playDodge();

    // Visual slip fade
    this.boxer.opacityTarget = 0.45;
    this.boxer.playDodge(this.facing);

    // Quick slip translation
    const slipDir = this.facing * -1;
    this.vx = slipDir * 180;

    this.scene.time.delayedCall(320, () => {
      this.isDodging = false;
      this.boxer.opacityTarget = 1.0;
    });

    return true;
  }

  clinch() {
    if (this.isKnockedOut || this.isStaggered || this.isAttacking ||
        this.isBlocking || this.isDodging || this.isClinching || this.isSpecialActive) return false;
    if (this.stamina < 15) return false;

    this.stamina = Math.max(0, this.stamina - 15);
    this.isClinching = true;

    this.boxer.playClinch(() => {
      this.scene.checkClinchHit(this);
    });

    this.scene.time.delayedCall(360, () => {
      this.isClinching = false;
    });

    return true;
  }

  // ------------------------------------------------------------------
  // DAMAGE, MITIGATION & REACTIONS
  // ------------------------------------------------------------------
  takeDamage(amount, punchType, isCounter = false) {
    if (this.isKnockedOut) return 0;

    // Dodge gives total immunity
    if (this.isDodging) {
      const head = this.boxer.getHeadWorldPos();
      const sp = this.scene.fight3d.toScreen(head);
      this.scene.showFloatyText(sp.x, sp.y - 40, 'SLIPPED!', '#00ff88', 600, '12px');
      return 0;
    }

    let finalDamage = amount;
    const worldPos = this.scene.fight3d.toWorld(this.x, this.y, 80);

    // High Guard Block mitigates 85% damage
    if (this.isBlocking) {
      finalDamage = Math.max(1, Math.round(amount * 0.15));
      this.stamina = Math.max(0, this.stamina - amount * 0.8);
      audio.playBlock();

      this.scene.fight3d.hitSpark(worldPos, 0x66cfff, 0.7, 6);
      this.boxer.setFlash(0.3);

      const head = this.boxer.getHeadWorldPos();
      const sp = this.scene.fight3d.toScreen(head);
      this.scene.showFloatyText(sp.x, sp.y - 40, 'BLOCKED', '#66cfff', 500, '11px');

      this.health = Math.max(0, this.health - finalDamage);
      this.addSuperMeter(4);
      if (this.health <= 0) this.knockout();
      return finalDamage;
    }

    // Counter hit bonus
    if (isCounter) {
      finalDamage = Math.round(finalDamage * 1.5);
    }

    this.health = Math.max(0, this.health - finalDamage);

    // Build Super Gauge on taking damage
    this.addSuperMeter(finalDamage * 0.65);

    // Audio & Particle FX
    audio.playPunch(punchType === 'special' ? 'heavy' : punchType);
    this.scene.fight3d.hitSpark(worldPos, isCounter ? 0xff0055 : 0xffdd00, punchType === 'uppercut' ? 1.6 : 1.1, 14);

    if (punchType === 'uppercut' || punchType === 'special' || isCounter) {
      this.scene.fight3d.shockwave(worldPos, isCounter ? 0xff0055 : 0x00ffff, 9);
      this.scene.fight3d.shake(1.2);
    } else {
      this.scene.fight3d.shake(0.6);
    }

    this.boxer.setFlash(0.9);

    if (this.health <= 0) {
      this.knockout();
    } else {
      const staggerDur = punchType === 'uppercut' ? 520 : punchType === 'hook' ? 420 : 280;
      this.stagger(staggerDur);
    }

    return finalDamage;
  }

  addSuperMeter(amount) {
    this.superMeter = Math.min(this.maxSuper, this.superMeter + amount);
  }

  stagger(duration = 400) {
    if (this.isKnockedOut) return;
    this.isStaggered = true;
    this.isAttacking = false;
    this.isBlocking = false;
    this._lunge = null;

    this.boxer.playStagger(duration);

    // Pushback recoil
    const pushDir = this.facing * -1;
    this.vx = pushDir * 90;

    this.scene.time.delayedCall(duration, () => {
      this.isStaggered = false;
      this.vx = 0;
    });
  }

  knockout() {
    if (this.isKnockedOut) return;
    this.isKnockedOut = true;
    this.health = 0;
    this.isAttacking = false;
    this.isBlocking = false;
    this.isStaggered = false;
    this.isSpecialActive = false;
    this._lunge = null;
    this.setVelocity(0, 0);

    const dir = this.facing * -1;
    this.boxer.playKnockdown(dir);
    this.scene.handleKnockout(this);
  }

  victoryPose() {
    this.boxer.playVictory();
  }

  resetFighter(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.isAttacking = false;
    this.currentAttackType = null;
    this.isBlocking = false;
    this.isDodging = false;
    this.isStaggered = false;
    this.isKnockedOut = false;
    this.isClinching = false;
    this.isSpecialActive = false;
    this._lunge = null;

    this.facing = this.x < 640 ? 1 : -1;
    this.boxer.setFacing(this.facing);
    this.boxer.resetPose();
    this.syncRig(true);
    this._updateShadow();
  }

  // ------------------------------------------------------------------
  // PER-FRAME UPDATE
  // ------------------------------------------------------------------
  update(time, delta) {
    const dt = delta / 1000;

    // Stamina Regeneration (quicker when idle)
    if (!this.isAttacking && !this.isBlocking && !this.isDodging && !this.isKnockedOut) {
      const regenRate = 18;
      this.stamina = Math.min(this.maxStamina, this.stamina + regenRate * dt);
    }

    // Punch lunge progression
    if (this._lunge) {
      this._lunge.t += delta;
      const p = Math.min(1, this._lunge.t / this._lunge.dur);
      this.x = this._lunge.startX + this._lunge.dx * Math.sin(p * Math.PI);
    } else if (!this.isKnockedOut) {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
    }

    // Clamp inside 3D ring boundaries
    this.x = Phaser.Math.Clamp(this.x, BOUNDS.minX, BOUNDS.maxX);
    this.y = Phaser.Math.Clamp(this.y, BOUNDS.minY, BOUNDS.maxY);

    // Sync procedural 3D rig with coordinate plane
    this.syncRig();
    this._updateShadow();

    // Update 3D boxer kinematics
    if (!this.isAttacking && !this.isBlocking && !this.isDodging &&
        !this.isStaggered && !this.isKnockedOut && !this.isClinching) {
      const speedSq = this.vx * this.vx + this.vy * this.vy;
      if (speedSq > 400) {
        this.boxer.playWalk(Math.sqrt(speedSq));
      } else {
        this.boxer.playIdle();
      }
    }

    this.boxer.update(dt);
  }

  destroy() {
    if (this.boxer && this.boxer.root) {
      this.scene.fight3d.scene.remove(this.boxer.root);
    }
    if (this.shadow) {
      this.scene.fight3d.removeBlobShadow(this.shadow);
    }
  }
}
