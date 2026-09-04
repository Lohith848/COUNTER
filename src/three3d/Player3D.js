/**
 * Player3D — The human-controlled boxer (Akira).
 * Maps keyboard (WASD/Arrows, J/K/L, U/I Special, SPACE Block, SHIFT Dodge, E Clinch)
 * and TouchControls events to 3D boxing combat mechanics.
 */

import Phaser from 'phaser';
import Fighter3D from './Fighter3D.js';

export default class Player3D extends Fighter3D {
  constructor(scene, x, y, name, stats) {
    super(scene, x, y, name || 'Akira', stats);

    this.keys = null;
    if (scene.input && scene.input.keyboard) {
      this.keys = scene.input.keyboard.addKeys({
        w: Phaser.Input.Keyboard.KeyCodes.W,
        a: Phaser.Input.Keyboard.KeyCodes.A,
        s: Phaser.Input.Keyboard.KeyCodes.S,
        d: Phaser.Input.Keyboard.KeyCodes.D,
        up: Phaser.Input.Keyboard.KeyCodes.UP,
        left: Phaser.Input.Keyboard.KeyCodes.LEFT,
        down: Phaser.Input.Keyboard.KeyCodes.DOWN,
        right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
        j: Phaser.Input.Keyboard.KeyCodes.J,
        k: Phaser.Input.Keyboard.KeyCodes.K,
        l: Phaser.Input.Keyboard.KeyCodes.L,
        u: Phaser.Input.Keyboard.KeyCodes.U,
        i: Phaser.Input.Keyboard.KeyCodes.I,
        space: Phaser.Input.Keyboard.KeyCodes.SPACE,
        shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
        e: Phaser.Input.Keyboard.KeyCodes.E
      });
    }

    this.touchMovement = { x: 0, y: 0 };
    this.isTouchInputActive = false;
  }

  update(time, delta) {
    this._readInput(time, delta);
    super.update(time, delta);
  }

  _readInput(time, delta) {
    if (this.isKnockedOut) return;
    if (this.scene.inputLocked || this.isStaggered) {
      this.setVelocity(0, 0);
      return;
    }

    let blockPressed = false;
    let dodgePressed = false;
    let sprintPressed = false;
    let clinchPressed = false;
    let specialPressed = false;
    let punchType = null;
    let moveX = 0;
    let moveY = 0;

    if (this.keys) {
      sprintPressed = this.keys.shift.isDown;
      blockPressed = this.keys.space.isDown;

      if (Phaser.Input.Keyboard.JustDown(this.keys.shift)) {
        dodgePressed = true;
      }
      if (Phaser.Input.Keyboard.JustDown(this.keys.e)) clinchPressed = true;
      if (Phaser.Input.Keyboard.JustDown(this.keys.u) || Phaser.Input.Keyboard.JustDown(this.keys.i)) {
        specialPressed = true;
      }

      if (Phaser.Input.Keyboard.JustDown(this.keys.j)) punchType = 'jab';
      else if (Phaser.Input.Keyboard.JustDown(this.keys.k)) punchType = 'hook';
      else if (Phaser.Input.Keyboard.JustDown(this.keys.l)) punchType = 'uppercut';

      if (this.keys.w.isDown || this.keys.up.isDown) moveY = -1;
      else if (this.keys.s.isDown || this.keys.down.isDown) moveY = 1;

      if (this.keys.a.isDown || this.keys.left.isDown) moveX = -1;
      else if (this.keys.d.isDown || this.keys.right.isDown) moveX = 1;
    }

    if (this.isTouchInputActive) {
      moveX = this.touchMovement.x;
      moveY = this.touchMovement.y;
    }

    // 1. Special Attack
    if (specialPressed && !this.isBlocking && !this.isAttacking) {
      const executed = this.specialAttack();
      if (executed && this.scene.aiBrain) {
        this.scene.aiBrain.recordPlayerAction('special');
      }
      return;
    }

    // 2. Slip Dodge
    if (dodgePressed && !this.isDodging && this.stamina >= 18) {
      this.dodge();
      if (this.scene.aiBrain) this.scene.aiBrain.recordPlayerAction('dodge');
      return;
    }

    // 3. High Guard Block
    if (blockPressed && !this.isAttacking && !this.isDodging && !this.isClinching) {
      this.block();
      if (this.scene.aiBrain) this.scene.aiBrain.recordPlayerAction('block');
    } else {
      this.unblock();
    }

    // 4. Punch execution
    if (punchType && !this.isBlocking && !this.isAttacking) {
      this.punch(punchType);
      if (this.scene.aiBrain) this.scene.aiBrain.recordPlayerAction(punchType);
    }

    // 5. Clinch Push
    if (clinchPressed && !this.isBlocking && !this.isAttacking) {
      this.clinch();
      if (this.scene.aiBrain) this.scene.aiBrain.recordPlayerAction('clinch');
    }

    // 6. 8-Way Footwork Movement & Dash
    if (!this.isAttacking && !this.isBlocking && !this.isClinching && !this.isDodging && !this.isSpecialActive) {
      const isSprinting = sprintPressed && (moveX !== 0 || moveY !== 0) && this.stamina > 10;
      this.speed = isSprinting ? this.baseSpeed * 1.45 : this.baseSpeed;

      if (isSprinting) {
        this.stamina = Math.max(0, this.stamina - 14 * (delta / 1000));
        if (time % 1000 < delta && this.scene.aiBrain) this.scene.aiBrain.recordPlayerAction('sprint');
      }

      let vx = moveX;
      let vy = moveY;
      if (vx !== 0 && vy !== 0) {
        const len = Math.sqrt(vx * vx + vy * vy);
        vx /= len;
        vy /= len;
      }
      this.setVelocity(vx * this.speed, vy * this.speed);

      if ((vx !== 0 || vy !== 0) && Math.random() < 0.02 && this.scene.aiBrain) {
        this.scene.aiBrain.recordPlayerAction('move');
      }
    }
  }

  // ------------------------------------------------------------------
  // TOUCH CONTROLS HOOKS (For Mobile / Touch UI)
  // ------------------------------------------------------------------
  setTouchMovement(vx, vy) {
    this.isTouchInputActive = true;
    this.touchMovement.x = vx;
    this.touchMovement.y = vy;
  }

  touchPunch(type) {
    if (!this.isBlocking && !this.isAttacking) {
      this.punch(type);
      if (this.scene.aiBrain) this.scene.aiBrain.recordPlayerAction(type);
    }
  }

  touchSpecial() {
    if (!this.isBlocking && !this.isAttacking) {
      this.specialAttack();
      if (this.scene.aiBrain) this.scene.aiBrain.recordPlayerAction('special');
    }
  }

  touchBlock(state) {
    if (state) {
      this.block();
      if (this.scene.aiBrain) this.scene.aiBrain.recordPlayerAction('block');
    } else {
      this.unblock();
    }
  }

  touchDodge() {
    if (!this.isDodging && this.stamina >= 18) {
      this.dodge();
      if (this.scene.aiBrain) this.scene.aiBrain.recordPlayerAction('dodge');
    }
  }

  touchClinch() {
    if (!this.isBlocking && !this.isAttacking) {
      this.clinch();
      if (this.scene.aiBrain) this.scene.aiBrain.recordPlayerAction('clinch');
    }
  }
}
