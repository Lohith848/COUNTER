import Fighter from './Fighter.js';
import Phaser from 'phaser';

export default class Player extends Fighter {
  constructor(scene, x, y, texture, stats) {
    super(scene, x, y, texture, 'Akira', stats);

    // Player inputs
    if (scene.input.keyboard) {
      this.keys = scene.input.keyboard.addKeys({
        w: Phaser.Input.Keyboard.KeyCodes.W,
        a: Phaser.Input.Keyboard.KeyCodes.A,
        s: Phaser.Input.Keyboard.KeyCodes.S,
        d: Phaser.Input.Keyboard.KeyCodes.D,
        j: Phaser.Input.Keyboard.KeyCodes.J,
        k: Phaser.Input.Keyboard.KeyCodes.K,
        l: Phaser.Input.Keyboard.KeyCodes.L,
        space: Phaser.Input.Keyboard.KeyCodes.SPACE,
        shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
        e: Phaser.Input.Keyboard.KeyCodes.E
      });
    }

    // Touch inputs API
    this.touchMovement = { x: 0, y: 0 };
    this.isTouchInputActive = false;

    // Set player depth
    this.setDepth(10);
  }

  update(time, delta) {
    super.updateFighter(time, delta);
    if (this.isKnockedOut) return;

    // If staggered, force velocity to 0 and exit control loops
    if (this.isStaggered) {
      this.setVelocity(0, 0);
      return;
    }

    // 1. Handle Dodge and Block
    let blockPressed = false;
    let dodgePressed = false;
    let sprintPressed = false;
    let clinchPressed = false;
    let punchType = null;

    let moveX = 0;
    let moveY = 0;

    // Read keyboard if available
    if (this.keys) {
      sprintPressed = this.keys.shift.isDown;
      blockPressed = this.keys.space.isDown;
      
      if (Phaser.Input.Keyboard.JustDown(this.keys.space) && sprintPressed) {
        dodgePressed = true;
      }
      if (Phaser.Input.Keyboard.JustDown(this.keys.e)) {
        clinchPressed = true;
      }
      if (Phaser.Input.Keyboard.JustDown(this.keys.j)) {
        punchType = 'jab';
      } else if (Phaser.Input.Keyboard.JustDown(this.keys.k)) {
        punchType = 'hook';
      } else if (Phaser.Input.Keyboard.JustDown(this.keys.l)) {
        punchType = 'uppercut';
      }

      if (this.keys.w.isDown) moveY = -1;
      else if (this.keys.s.isDown) moveY = 1;
      
      if (this.keys.a.isDown) moveX = -1;
      else if (this.keys.d.isDown) moveX = 1;
    }

    // Overlay touch inputs if active
    if (this.isTouchInputActive) {
      moveX = this.touchMovement.x;
      moveY = this.touchMovement.y;
    }

    // 2. Dodge execution
    if (dodgePressed && !this.isDodging && this.stamina >= 20) {
      this.dodge();
      this.scene.aiBrain.recordPlayerAction('dodge');
      return;
    }

    // 3. Block execution
    if (blockPressed && !this.isAttacking && !this.isDodging && !this.isClinching) {
      this.block();
      this.scene.aiBrain.recordPlayerAction('block');
    } else {
      this.unblock();
    }

    // 4. Punch execution
    if (punchType && !this.isBlocking && !this.isAttacking) {
      this.punch(punchType);
      this.scene.aiBrain.recordPlayerAction(punchType);
    }

    // 5. Clinch execution
    if (clinchPressed && !this.isBlocking && !this.isAttacking) {
      this.clinch();
      this.scene.aiBrain.recordPlayerAction('clinch');
    }

    // 6. Movement execution (disabled during punch lunges, blocks, or clinches)
    if (!this.isAttacking && !this.isBlocking && !this.isClinching && !this.isDodging) {
      // Determine speed (sprint vs base walk)
      const isSprinting = sprintPressed && (moveX !== 0 || moveY !== 0) && this.stamina > 10;
      this.speed = isSprinting ? this.baseSpeed * 1.5 : this.baseSpeed;
      
      if (isSprinting) {
        // Sprint drains stamina: 15 per second
        this.stamina = Math.max(0, this.stamina - 15 * (delta / 1000));
        // Record action to AI
        if (time % 1000 < delta) {
          this.scene.aiBrain.recordPlayerAction('sprint');
        }
      }

      // Calculate velocity vector
      let vx = moveX;
      let vy = moveY;

      // Normalize if diagonal movement to prevent extra speed
      if (vx !== 0 && vy !== 0) {
        const len = Math.sqrt(vx * vx + vy * vy);
        vx /= len;
        vy /= len;
      }

      this.setVelocity(vx * this.speed, vy * this.speed);

      // Record walk action to AI occasionally
      if ((vx !== 0 || vy !== 0) && Math.random() < 0.02) {
        this.scene.aiBrain.recordPlayerAction('move');
      }
    }
  }

  // Touch UI Hooks called from TouchControls overlay
  setTouchMovement(vx, vy) {
    this.isTouchInputActive = true;
    this.touchMovement.x = vx;
    this.touchMovement.y = vy;
  }

  touchPunch(type) {
    if (!this.isBlocking && !this.isAttacking) {
      this.punch(type);
      this.scene.aiBrain.recordPlayerAction(type);
    }
  }

  touchBlock(state) {
    if (state) {
      this.block();
      this.scene.aiBrain.recordPlayerAction('block');
    } else {
      this.unblock();
    }
  }

  touchDodge() {
    if (!this.isDodging && this.stamina >= 20) {
      this.dodge();
      this.scene.aiBrain.recordPlayerAction('dodge');
    }
  }

  touchClinch() {
    if (!this.isBlocking && !this.isAttacking) {
      this.clinch();
      this.scene.aiBrain.recordPlayerAction('clinch');
    }
  }
}
