import Phaser from 'phaser';

export default class TouchControls {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.container = scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(100);

    const width = scene.cameras.main.width;
    const height = scene.cameras.main.height;

    // Joystick properties
    this.joystickBaseX = 160;
    this.joystickBaseY = height - 150;
    this.joystickLimit = 60;
    this.joystickPointer = null;

    // Build the virtual joystick graphics
    this.buildJoystick();

    // Build Action Buttons
    this.buildActionButtons(width, height);

    // Make scene listen to touch move events for joystick tracking
    scene.input.on('pointermove', this.handlePointerMove, this);
    scene.input.on('pointerup', this.handlePointerUp, this);
  }

  buildJoystick() {
    // Outer circle (Base)
    this.baseCircle = this.scene.add.graphics();
    this.baseCircle.fillStyle(0x0a1622, 0.45);
    this.baseCircle.lineStyle(3, 0x2f9bff, 0.7);
    this.baseCircle.fillCircle(this.joystickBaseX, this.joystickBaseY, this.joystickLimit);
    this.baseCircle.strokeCircle(this.joystickBaseX, this.joystickBaseY, this.joystickLimit);
    this.container.add(this.baseCircle);

    // Inner circle (Knob)
    this.knobCircle = this.scene.add.graphics();
    this.knobCircle.fillStyle(0x2f9bff, 0.8);
    this.knobCircle.fillCircle(this.joystickBaseX, this.joystickBaseY, 24);
    this.container.add(this.knobCircle);

    // Joystick Touch Zone
    this.joystickZone = this.scene.add.zone(
      this.joystickBaseX,
      this.joystickBaseY,
      this.joystickLimit * 2,
      this.joystickLimit * 2
    ).setOrigin(0.5);
    this.joystickZone.setInteractive();
    
    this.joystickZone.on('pointerdown', (pointer) => {
      this.joystickPointer = pointer;
      this.updateJoystick(pointer);
    });

    this.container.add(this.joystickZone);
  }

  buildActionButtons(width, height) {
    // Positions relative to bottom right
    const rx = width;
    const ry = height;

    // Config of buttons: [label, dx, dy, color, actionFunc]
    // Arranged in an ergonomic layout
    const buttonsConfig = [
      { key: 'jab', label: 'JAB', x: rx - 250, y: ry - 170, radius: 28, color: 0x00ff88, downFunc: () => this.player.touchPunch('jab'), upFunc: null },
      { key: 'hook', label: 'HOOK', x: rx - 165, y: ry - 225, radius: 28, color: 0xffaa00, downFunc: () => this.player.touchPunch('hook'), upFunc: null },
      { key: 'uppercut', label: 'UPPR', x: rx - 80, y: ry - 170, radius: 28, color: 0xff0055, downFunc: () => this.player.touchPunch('uppercut'), upFunc: null },
      { key: 'block', label: 'BLOCK', x: rx - 165, y: ry - 115, radius: 34, color: 0x2f9bff, downFunc: () => this.player.touchBlock(true), upFunc: () => this.player.touchBlock(false) },
      { key: 'dodge', label: 'SLIP', x: rx - 270, y: ry - 75, radius: 25, color: 0xcc00ff, downFunc: () => this.player.touchDodge(), upFunc: null },
      { key: 'clinch', label: 'CLNC', x: rx - 60, y: ry - 75, radius: 25, color: 0x00ffff, downFunc: () => this.player.touchClinch(), upFunc: null }
    ];

    buttonsConfig.forEach(cfg => {
      // Draw graphic background
      const btnBg = this.scene.add.graphics();
      btnBg.fillStyle(0x111625, 0.7);
      btnBg.lineStyle(3, cfg.color, 0.8);
      btnBg.fillCircle(cfg.x, cfg.y, cfg.radius);
      btnBg.strokeCircle(cfg.x, cfg.y, cfg.radius);
      this.container.add(btnBg);

      // Add label text
      const btnText = this.scene.add.text(cfg.x, cfg.y, cfg.label, {
        fontFamily: '"Outfit"',
        fontSize: cfg.radius > 25 ? '13px' : '11px',
        fontWeight: '900',
        color: '#ffffff'
      }).setOrigin(0.5);
      this.container.add(btnText);

      // Interactive zone
      const zone = this.scene.add.zone(cfg.x, cfg.y, cfg.radius * 2, cfg.radius * 2).setOrigin(0.5);
      zone.setInteractive();

      zone.on('pointerdown', (pointer) => {
        // Visual click feed
        btnBg.clear();
        btnBg.fillStyle(cfg.color, 0.4);
        btnBg.lineStyle(3, cfg.color, 1);
        btnBg.fillCircle(cfg.x, cfg.y, cfg.radius);
        btnBg.strokeCircle(cfg.x, cfg.y, cfg.radius);
        
        if (cfg.downFunc) cfg.downFunc();
      });

      const releaseBtn = () => {
        btnBg.clear();
        btnBg.fillStyle(0x111625, 0.7);
        btnBg.lineStyle(3, cfg.color, 0.8);
        btnBg.fillCircle(cfg.x, cfg.y, cfg.radius);
        btnBg.strokeCircle(cfg.x, cfg.y, cfg.radius);
        
        if (cfg.upFunc) cfg.upFunc();
      };

      zone.on('pointerup', releaseBtn);
      zone.on('pointerout', releaseBtn);

      this.container.add(zone);
    });
  }

  handlePointerMove(pointer) {
    if (this.joystickPointer && this.joystickPointer.id === pointer.id) {
      this.updateJoystick(pointer);
    }
  }

  handlePointerUp(pointer) {
    if (this.joystickPointer && this.joystickPointer.id === pointer.id) {
      this.joystickPointer = null;
      
      // Reset knob to center
      this.knobCircle.clear();
      this.knobCircle.fillStyle(0x2f9bff, 0.7);
      this.knobCircle.fillCircle(this.joystickBaseX, this.joystickBaseY, 24);
      
      // Reset player velocity vector
      this.player.setTouchMovement(0, 0);
    }
  }

  updateJoystick(pointer) {
    // Calculate offset
    const dx = pointer.x - this.joystickBaseX;
    const dy = pointer.y - this.joystickBaseY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    let knobX = pointer.x;
    let knobY = pointer.y;

    let vx = dx;
    let vy = dy;

    // Clamp knob position to outer circle
    if (dist > this.joystickLimit) {
      const angle = Math.atan2(dy, dx);
      knobX = this.joystickBaseX + Math.cos(angle) * this.joystickLimit;
      knobY = this.joystickBaseY + Math.sin(angle) * this.joystickLimit;
      vx = Math.cos(angle) * this.joystickLimit;
      vy = Math.sin(angle) * this.joystickLimit;
    }

    // Redraw Knob
    this.knobCircle.clear();
    this.knobCircle.fillStyle(0x2f9bff, 0.9);
    this.knobCircle.fillCircle(knobX, knobY, 24);

    // Set normalized vector to player
    const normX = vx / this.joystickLimit;
    const normY = vy / this.joystickLimit;
    this.player.setTouchMovement(normX, normY);
  }

  setVisible(visible) {
    this.container.setVisible(visible);
  }

  destroy() {
    this.scene.input.off('pointermove', this.handlePointerMove, this);
    this.scene.input.off('pointerup', this.handlePointerUp, this);
    this.container.destroy();
  }
}
