/**
 * TouchControls — 90s Retro Arcade Mobile & Touch Controls.
 * Features:
 * - Left: Virtual 360° analog joystick for fluid footwork.
 * - Right: Arcade button diamond layout (JAB, HOOK, UPPERCUT, SUPER, BLOCK, SLIP, CLINCH).
 * - Dynamic pulsing SUPER button when super gauge is full.
 * - Haptic pulse feedback (navigator.vibrate).
 */

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

    // Joystick Setup
    this.joystickBaseX = 140;
    this.joystickBaseY = height - 130;
    this.joystickLimit = 55;
    this.joystickPointer = null;

    this.buildJoystick();
    this.buildActionButtons(width, height);

    scene.input.on('pointermove', this.handlePointerMove, this);
    scene.input.on('pointerup', this.handlePointerUp, this);
  }

  buildJoystick() {
    this.baseCircle = this.scene.add.graphics();
    this.baseCircle.fillStyle(0x0a1622, 0.55);
    this.baseCircle.lineStyle(3, 0x00ff88, 0.7);
    this.baseCircle.fillCircle(this.joystickBaseX, this.joystickBaseY, this.joystickLimit);
    this.baseCircle.strokeCircle(this.joystickBaseX, this.joystickBaseY, this.joystickLimit);
    this.container.add(this.baseCircle);

    this.knobCircle = this.scene.add.graphics();
    this.knobCircle.fillStyle(0x00ff88, 0.85);
    this.knobCircle.fillCircle(this.joystickBaseX, this.joystickBaseY, 22);
    this.container.add(this.knobCircle);

    this.joystickZone = this.scene.add.zone(
      this.joystickBaseX,
      this.joystickBaseY,
      this.joystickLimit * 2.2,
      this.joystickLimit * 2.2
    ).setOrigin(0.5);
    this.joystickZone.setInteractive();

    this.joystickZone.on('pointerdown', (pointer) => {
      this.joystickPointer = pointer;
      this.updateJoystick(pointer);
    });

    this.container.add(this.joystickZone);
  }

  buildActionButtons(width, height) {
    const rx = width;
    const ry = height;

    const vibrate = () => {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(15); } catch (e) {}
      }
    };

    // Arcade Diamond Layout
    const buttonsConfig = [
      {
        key: 'jab', label: 'JAB', x: rx - 240, y: ry - 165, radius: 28, color: 0x00ff88,
        downFunc: () => { vibrate(); this.player.touchPunch('jab'); }, upFunc: null
      },
      {
        key: 'hook', label: 'HOOK', x: rx - 160, y: ry - 215, radius: 28, color: 0xffaa00,
        downFunc: () => { vibrate(); this.player.touchPunch('hook'); }, upFunc: null
      },
      {
        key: 'uppercut', label: 'UPPR', x: rx - 80, y: ry - 165, radius: 28, color: 0xff0055,
        downFunc: () => { vibrate(); this.player.touchPunch('uppercut'); }, upFunc: null
      },
      {
        key: 'super', label: 'SUPER', x: rx - 160, y: ry - 140, radius: 30, color: 0x00ffff,
        downFunc: () => { vibrate(); this.player.touchSpecial(); }, upFunc: null
      },
      {
        key: 'block', label: 'GUARD', x: rx - 160, y: ry - 65, radius: 32, color: 0x2f9bff,
        downFunc: () => { vibrate(); this.player.touchBlock(true); },
        upFunc: () => this.player.touchBlock(false)
      },
      {
        key: 'dodge', label: 'SLIP', x: rx - 250, y: ry - 80, radius: 25, color: 0xcc00ff,
        downFunc: () => { vibrate(); this.player.touchDodge(); }, upFunc: null
      },
      {
        key: 'clinch', label: 'CLNC', x: rx - 70, y: ry - 80, radius: 25, color: 0x66fcf1,
        downFunc: () => { vibrate(); this.player.touchClinch(); }, upFunc: null
      }
    ];

    this.buttons = [];

    buttonsConfig.forEach(cfg => {
      const btnBg = this.scene.add.graphics();
      btnBg.fillStyle(0x0f1422, 0.75);
      btnBg.lineStyle(3, cfg.color, 0.85);
      btnBg.fillCircle(cfg.x, cfg.y, cfg.radius);
      btnBg.strokeCircle(cfg.x, cfg.y, cfg.radius);
      this.container.add(btnBg);

      const btnText = this.scene.add.text(cfg.x, cfg.y, cfg.label, {
        fontFamily: '"Press Start 2P"',
        fontSize: cfg.radius > 26 ? '9px' : '8px',
        color: '#ffffff'
      }).setOrigin(0.5);
      this.container.add(btnText);

      const zone = this.scene.add.zone(cfg.x, cfg.y, cfg.radius * 2, cfg.radius * 2).setOrigin(0.5);
      zone.setInteractive();

      zone.on('pointerdown', () => {
        btnBg.clear();
        btnBg.fillStyle(cfg.color, 0.5);
        btnBg.lineStyle(3, cfg.color, 1);
        btnBg.fillCircle(cfg.x, cfg.y, cfg.radius);
        btnBg.strokeCircle(cfg.x, cfg.y, cfg.radius);
        if (cfg.downFunc) cfg.downFunc();
      });

      const releaseBtn = () => {
        btnBg.clear();
        btnBg.fillStyle(0x0f1422, 0.75);
        btnBg.lineStyle(3, cfg.color, 0.85);
        btnBg.fillCircle(cfg.x, cfg.y, cfg.radius);
        btnBg.strokeCircle(cfg.x, cfg.y, cfg.radius);
        if (cfg.upFunc) cfg.upFunc();
      };

      zone.on('pointerup', releaseBtn);
      zone.on('pointerout', releaseBtn);

      this.container.add(zone);
      this.buttons.push({ cfg, btnBg, btnText });
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

      this.knobCircle.clear();
      this.knobCircle.fillStyle(0x00ff88, 0.85);
      this.knobCircle.fillCircle(this.joystickBaseX, this.joystickBaseY, 22);

      this.player.setTouchMovement(0, 0);
    }
  }

  updateJoystick(pointer) {
    const dx = pointer.x - this.joystickBaseX;
    const dy = pointer.y - this.joystickBaseY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const clampedDist = Math.min(dist, this.joystickLimit);
    const angle = Math.atan2(dy, dx);

    const knobX = this.joystickBaseX + Math.cos(angle) * clampedDist;
    const knobY = this.joystickBaseY + Math.sin(angle) * clampedDist;

    this.knobCircle.clear();
    this.knobCircle.fillStyle(0x66fcf1, 1);
    this.knobCircle.fillCircle(knobX, knobY, 24);

    const normX = clampedDist > 8 ? Math.cos(angle) : 0;
    const normY = clampedDist > 8 ? Math.sin(angle) : 0;

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
