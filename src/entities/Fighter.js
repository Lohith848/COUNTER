import Phaser from 'phaser';
import { audio } from '../utils/SoundSynth.js';

export default class Fighter extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture, name, stats) {
    super(scene, x, y, texture);
    
    // Add to scene & enable physics
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    this.fighterName = name;

    // Statistics for this fight. Uses the shared StatsTracker object when provided
    // so there is a single source of truth for the whole match.
    this.stats = stats || {
      thrown: 0, landed: 0, jabs: 0, hooks: 0, uppercuts: 0, blocks: 0, dodges: 0
    };
    
    // Core attributes
    this.maxHealth = 100;
    this.health = 100;
    this.maxStamina = 100;
    this.stamina = 100;
    this.baseSpeed = 220;
    this.speed = 220;
    
    // Combat states
    this.isAttacking = false;
    this.currentAttackType = null;
    this.isBlocking = false;
    this.isDodging = false;
    this.isStaggered = false;
    this.isKnockedOut = false;
    this.isClinching = false;
    this.blockTimer = null;

    // Physics setup
    this.setCollideWorldBounds(true);
    this.setOrigin(0.5, 0.95); // Set origin near the feet
    this.body.setSize(this.width * 0.45, this.height * 0.15); // Hitbox around floor contact
    this.body.setOffset(this.width * 0.28, this.height * 0.82); // Shift collision down
    
    // Visual adjustments
    // Scale characters to look substantial in the ring
    const scaleFactor = (scene.cameras.main.height * 0.55) / this.height;
    this.setScale(scaleFactor);
    
    // Idle stance breathing animation
    this.idleTween = scene.tweens.add({
      targets: this,
      scaleY: scaleFactor * 0.97,
      scaleX: scaleFactor * 1.02,
      yoyo: true,
      duration: 700,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Shadow graphics below fighter
    this.shadow = scene.add.graphics();
    this.shadow.fillStyle(0x000000, 0.4);
    this.shadow.fillEllipse(0, 0, this.width * scaleFactor * 0.5, 20);
    this.shadow.setDepth(this.depth - 1);
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    
    // Update shadow position to track feet
    if (this.shadow) {
      this.shadow.x = this.x;
      this.shadow.y = this.y - 10;
    }
  }

  updateFighter(time, delta) {
    if (this.isKnockedOut) return;

    // 1. Stamina recovery (faster when idle, slower/stopped when blocking/sprinting/attacking)
    let staminaRegen = 20 * (delta / 1000); // 20 units/sec
    if (this.isBlocking || this.isAttacking || this.isDodging || this.body.velocity.length() > this.baseSpeed) {
      staminaRegen = 0; // No regen during high action
    } else if (this.body.velocity.length() === 0) {
      staminaRegen = 28 * (delta / 1000); // Faster regen when standing still
    }
    
    this.stamina = Phaser.Math.Clamp(this.stamina + staminaRegen, 0, this.maxStamina);
  }

  // PUNCH ACTION
  punch(type) {
    if (this.isAttacking || this.isDodging || this.isStaggered || this.isKnockedOut) return;
    
    // Stamina costs
    let cost = 12;
    if (type === 'hook') cost = 18;
    if (type === 'uppercut') cost = 25;
    
    // Check if stamina is depleted
    const isExhausted = this.stamina < cost;
    if (isExhausted) {
      cost = this.stamina; // Drain remaining stamina
      audio.playDodge(); // Exhausted swing sound (air)
    }

    this.stamina = Math.max(0, this.stamina - cost);
    this.isAttacking = true;
    this.currentAttackType = type;
    this.stats.thrown++;

    // Release idle tween temporarily
    if (this.idleTween) this.idleTween.pause();

    const direction = this.flipX ? -1 : 1;
    let lungeDist = 45;
    let animDuration = 100;
    let recoverDuration = 120;
    let angleRotate = 5;

    if (type === 'hook') {
      lungeDist = 60;
      animDuration = 150;
      recoverDuration = 180;
      angleRotate = 15;
    } else if (type === 'uppercut') {
      lungeDist = 30;
      animDuration = 220;
      recoverDuration = 240;
      angleRotate = -8;
    }

    // Play punch wind-up sound
    audio.playDodge();

    // Scale factors
    const originalScaleX = this.flipX ? -Math.abs(this.scaleX) : Math.abs(this.scaleX);
    const originalScaleY = this.scaleY;

    // Punch Tween Animation (Lunge, Stretch & Return)
    this.scene.tweens.add({
      targets: this,
      x: this.x + (direction * lungeDist),
      angle: direction * angleRotate,
      scaleX: originalScaleX * 1.15,
      scaleY: originalScaleY * 0.95,
      duration: animDuration,
      ease: 'Back.easeOut',
      yoyo: true,
      hold: 40,
      onYoyo: () => {
        // Trigger punch impact check at peak of lunge
        this.scene.checkPunchHit(this, type, isExhausted);
      },
      onComplete: () => {
        this.angle = 0;
        this.setScale(Math.abs(originalScaleX), originalScaleY);
        this.isAttacking = false;
        this.currentAttackType = null;
        if (this.idleTween) this.idleTween.resume();
      }
    });
  }

  // BLOCK/GUARD ACTION
  block(duration = null) {
    if (this.isAttacking || this.isDodging || this.isStaggered || this.isKnockedOut) return;
    
    if (this.isBlocking) return;
    this.isBlocking = true;
    this.stats.blocks++;
    
    this.setVelocity(0, 0);

    // Apply color tint (blue/guard color) & squash sprite slightly to guard
    this.setTint(0x88ccff);
    if (this.idleTween) this.idleTween.pause();
    
    // Scale squish
    const baseScale = (this.scene.cameras.main.height * 0.55) / this.height;
    this.setScale(baseScale * 1.05, baseScale * 0.90);

    if (duration) {
      if (this.blockTimer) this.blockTimer.remove();
      this.blockTimer = this.scene.time.delayedCall(duration, () => {
        this.unblock();
      });
    }
  }

  unblock() {
    if (!this.isBlocking) return;
    this.isBlocking = false;
    this.clearTint();
    
    const baseScale = (this.scene.cameras.main.height * 0.55) / this.height;
    this.setScale(baseScale);
    if (this.idleTween) this.idleTween.resume();
  }

  // DODGE/SLIP ACTION
  dodge() {
    if (this.isAttacking || this.isDodging || this.isStaggered || this.isKnockedOut) return;

    if (this.stamina < 20) return; // Need stamina to dodge
    this.stamina = Math.max(0, this.stamina - 20);

    this.isDodging = true;
    this.stats.dodges++;
    audio.playDodge();

    // Semi-transparent ghost effect
    this.setAlpha(0.4);
    
    const direction = this.flipX ? 1 : -1; // Dodge backward usually
    let dodgeX = this.x + (direction * 120);

    // Constrain dodge to ring boundaries
    dodgeX = Phaser.Math.Clamp(dodgeX, 150, 1130);

    // Dodge slide tween
    this.scene.tweens.add({
      targets: this,
      x: dodgeX,
      duration: 250,
      ease: 'Power2.easeOut',
      onComplete: () => {
        this.setAlpha(1);
        this.isDodging = false;
      }
    });
  }

  // CLINCH/TACKLE ACTION
  clinch() {
    if (this.isAttacking || this.isDodging || this.isStaggered || this.isKnockedOut) return;
    if (this.stamina < 15) return;
    this.stamina = Math.max(0, this.stamina - 15);

    this.isClinching = true;
    audio.playTackle();

    const direction = this.flipX ? -1 : 1;
    
    // Lunge forward aggressively
    this.scene.tweens.add({
      targets: this,
      x: this.x + (direction * 90),
      scaleX: (this.flipX ? -1 : 1) * Math.abs(this.scaleX) * 1.2,
      duration: 150,
      yoyo: true,
      onYoyo: () => {
        // Check if clinch overlaps opponent
        this.scene.checkClinchHit(this);
      },
      onComplete: () => {
        this.isClinching = false;
      }
    });
  }

  // STAGGER FEEDBACK
  stagger(duration = 300) {
    if (this.isKnockedOut) return;
    
    // Stop current animations/tweens
    this.scene.tweens.killTweensOf(this);
    this.unblock();
    
    this.isStaggered = true;
    this.isAttacking = false;
    this.currentAttackType = null;
    
    // Red flash tint
    this.setTint(0xff5555);
    
    // Shake animation
    const dir = this.flipX ? 1 : -1;
    this.scene.tweens.add({
      targets: this,
      x: this.x + (dir * 25),
      angle: dir * -10,
      duration: 50,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        this.clearTint();
        this.angle = 0;
        this.isStaggered = false;
        if (this.idleTween) this.idleTween.resume();
      }
    });
  }

  // TAKE DAMAGE
  takeDamage(amount, type) {
    if (this.isKnockedOut) return 0;
    
    // 1. Dodge Check: Immune to damage
    if (this.isDodging) {
      return 0;
    }

    // 2. Block Check: Reduce damage
    let finalDamage = amount;
    if (this.isBlocking) {
      finalDamage = Math.round(amount * 0.1); // Mitigate 90%
      audio.playBlock();
      // Show block particles
      this.scene.showFloatyText(this.x, this.y - 120, 'BLOCKED', '#88ccff');
      return finalDamage;
    }

    // Landed Hit
    audio.playPunch(type);
    this.health = Math.max(0, this.health - finalDamage);
    
    // Show damage number floaty text
    this.scene.showFloatyText(this.x, this.y - 140, `-${finalDamage}`, '#ff0055');
    
    // Camera shake for heavy hits
    if (type === 'uppercut') {
      this.scene.cameras.main.shake(150, 0.015);
      this.stagger(500); // Longer stagger for heavy hit
    } else if (type === 'hook') {
      this.scene.cameras.main.shake(100, 0.008);
      this.stagger(400);
    } else {
      this.stagger(250);
    }

    // Check knockout
    if (this.health <= 0) {
      this.knockout();
    }

    return finalDamage;
  }

  // KNOCKOUT STATE
  knockout() {
    this.isKnockedOut = true;
    this.unblock();
    this.setVelocity(0, 0);
    this.scene.tweens.killTweensOf(this);
    if (this.idleTween) this.idleTween.stop();

    audio.playKoAmbient();

    // Fall down animation
    const dir = this.flipX ? 1 : -1;
    this.scene.tweens.add({
      targets: this,
      angle: dir * 90,
      y: this.y + 100,
      alpha: 0.8,
      duration: 800,
      ease: 'Bounce.easeOut',
      onComplete: () => {
        // Trigger scene KO handling
        this.scene.handleKnockout(this);
      }
    });
  }

  // Reset helper for rematches or round resets
  resetFighter(x, y) {
    this.health = this.maxHealth;
    this.stamina = this.maxStamina;
    this.isAttacking = false;
    this.currentAttackType = null;
    this.isBlocking = false;
    this.isDodging = false;
    this.isStaggered = false;
    this.isKnockedOut = false;
    this.isClinching = false;
    this.angle = 0;
    this.alpha = 1;
    this.clearTint();
    this.setPosition(x, y);
    
    const baseScale = (this.scene.cameras.main.height * 0.55) / this.height;
    this.setScale(baseScale);
    // Restart the idle breathing tween (it may have been stopped by a knockout).
    if (this.idleTween) this.idleTween.stop();
    this.idleTween = this.scene.tweens.add({
      targets: this,
      scaleY: baseScale * 0.97,
      scaleX: baseScale * 1.02,
      yoyo: true,
      duration: 700,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  // Victory celebration pose: arms-up bounce used on the result screen.
  victoryPose() {
    if (this.isKnockedOut) return;
    this.scene.tweens.killTweensOf(this);
    this.unblock();
    this.angle = 0;
    this.clearTint();
    this.alpha = 1;

    const baseScale = (this.scene.cameras.main.height * 0.55) / this.height;
    if (this.idleTween) this.idleTween.stop();

    // Jump for joy and settle into a bouncing idle.
    this.scene.tweens.add({
      targets: this,
      y: this.y - 40,
      scaleX: baseScale * 0.95,
      scaleY: baseScale * 1.08,
      duration: 260,
      yoyo: true,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.setScale(baseScale);
        this.idleTween = this.scene.tweens.add({
          targets: this,
          y: this.y - 12,
          duration: 420,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
    });
  }
}
