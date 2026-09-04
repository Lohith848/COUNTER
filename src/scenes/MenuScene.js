/**
 * MenuScene — 90s Retro Arcade Title Screen.
 * Features:
 * - Glowing arcade neon title and animated background.
 * - Interactive Start Fight button with audio stings.
 * - Fight Controls Breakdown (PC & Mobile layouts).
 * - Sound toggle button.
 */

import Phaser from 'phaser';
import { audio } from '../utils/SoundSynth.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    audio.init();

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 1. Procedural 90s Retro Arcade Stadium Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x06090f, 0x06090f, 0x121a28, 0x121a28, 1);
    bg.fillRect(0, 0, width, height);

    // Subtle arena grid floor
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x66fcf1, 0.08);
    for (let x = 0; x < width; x += 40) {
      grid.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y < height; y += 40) {
      grid.lineBetween(0, y, width, y);
    }

    // 2. 90s Retro Arcade Title
    const subTitle = this.add.text(width / 2, 75, '★ 90s RETRO 3D ARCADE ★', {
      fontFamily: '"Press Start 2P"',
      fontSize: '14px',
      color: '#66fcf1',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    const titleTop = this.add.text(width / 2, 120, 'RING OF', {
      fontFamily: '"Press Start 2P"',
      fontSize: '28px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 6,
      shadow: { color: '#00ff88', blur: 12, fill: true, stroke: true }
    }).setOrigin(0.5);

    const titleBottom = this.add.text(width / 2, 175, 'DOMINANCE', {
      fontFamily: '"Press Start 2P"',
      fontSize: '48px',
      color: '#ff0055',
      stroke: '#000000',
      strokeThickness: 8,
      shadow: { color: '#ff0055', blur: 20, fill: true, stroke: true }
    }).setOrigin(0.5);

    this.tweens.add({
      targets: [titleTop, titleBottom],
      y: '+=6',
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // 3. Fight Controls Guide Panel
    const panelX = width / 2 - 280;
    const panelY = 230;
    const panelW = 560;
    const panelH = 260;

    const panel = this.add.graphics();
    panel.fillStyle(0x0a0e16, 0.9);
    panel.lineStyle(2, 0x66fcf1, 0.7);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 10);
    panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 10);

    this.add.text(width / 2, panelY + 24, 'CHAMPIONSHIP CONTROLS', {
      fontFamily: '"Press Start 2P"',
      fontSize: '12px',
      color: '#00ff88'
    }).setOrigin(0.5);

    const controlLines = [
      'WASD / Arrows  : 360° Ring Footwork & Advance',
      'J : Snapping Jab   | K : Power Hook',
      'L : Uppercut Drive | U / I : SUPER SPECIAL MOVE',
      'SPACE : High Guard | SHIFT : Slip & Roll Dodge',
      'E : Clinch & Break | ESC : Pause Match',
      '📱 Mobile : Left Virtual Joystick + Right Action Diamond'
    ];

    controlLines.forEach((text, i) => {
      this.add.text(width / 2, panelY + 62 + i * 28, text, {
        fontFamily: '"Outfit"',
        fontSize: '15px',
        fontWeight: '700',
        color: i === 2 ? '#ffcc00' : '#c5c6c7'
      }).setOrigin(0.5);
    });

    // 4. Start Button
    const btnW = 280;
    const btnH = 58;
    const btnX = width / 2;
    const btnY = 540;

    const startBtnBg = this.add.graphics();
    startBtnBg.fillStyle(0xff0055, 1);
    startBtnBg.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);

    const startGlow = this.add.graphics();
    startGlow.lineStyle(3, 0x00ff88, 1);
    startGlow.strokeRoundedRect(btnX - btnW / 2 - 2, btnY - btnH / 2 - 2, btnW + 4, btnH + 4, 10);

    this.tweens.add({
      targets: startGlow,
      alpha: { from: 0.3, to: 1.0 },
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    const startText = this.add.text(btnX, btnY, 'INSERT COIN / START', {
      fontFamily: '"Press Start 2P"',
      fontSize: '13px',
      color: '#ffffff',
      fontWeight: 'bold'
    }).setOrigin(0.5);

    const startZone = this.add.zone(btnX, btnY, btnW, btnH).setOrigin(0.5);
    startZone.setInteractive({ useHandCursor: true });

    startZone.on('pointerover', () => {
      startBtnBg.clear();
      startBtnBg.fillStyle(0xff2277, 1);
      startBtnBg.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);
      startText.setScale(1.05);
      audio.playPunch('light');
    });

    startZone.on('pointerout', () => {
      startBtnBg.clear();
      startBtnBg.fillStyle(0xff0055, 1);
      startBtnBg.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);
      startText.setScale(1.0);
    });

    startZone.on('pointerdown', () => {
      audio.init();
      audio.playBell();
      this.cameras.main.flash(350, 255, 255, 255);
      this.time.delayedCall(350, () => {
        this.scene.start('FightScene');
      });
    });

    // 5. Sound Toggle Button (Top Right)
    const muteBg = this.add.graphics();
    muteBg.fillStyle(0x151b26, 0.85);
    muteBg.lineStyle(2, 0x66fcf1, 0.6);
    muteBg.fillRoundedRect(width - 70, 20, 50, 50, 8);
    muteBg.strokeRoundedRect(width - 70, 20, 50, 50, 8);

    const muteIcon = this.add.text(width - 45, 45, '🔊', {
      font: '24px Outfit'
    }).setOrigin(0.5);

    const muteZone = this.add.zone(width - 45, 45, 50, 50).setOrigin(0.5);
    muteZone.setInteractive({ useHandCursor: true });
    muteZone.on('pointerdown', () => {
      const active = audio.toggleMute();
      muteIcon.setText(active ? '🔊' : '🔇');
      if (active) audio.playPunch('light');
    });

    // 6. Footer
    this.add.text(width / 2, height - 25, 'ROUND 1: APPRENTICE • ROUND 2: ADAPTIVE • ROUND 3: CHAMPION', {
      fontFamily: '"Press Start 2P"',
      fontSize: '9px',
      color: '#66fcf1'
    }).setOrigin(0.5);
  }
}
