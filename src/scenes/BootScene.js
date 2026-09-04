/**
 * BootScene — 90s Retro Arcade Loading & Matchup Screen.
 * Features:
 * - 90s Arcade Boot sequence with glowing neon progress bar.
 * - Pre-match "CHALLENGER APPROACHING" VS Faceoff Screen with fighter attribute cards.
 */

import Phaser from 'phaser';
import { audio } from '../utils/SoundSynth.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 1. Dark Retro Arcade Boot Grid
    const bg = this.add.graphics();
    bg.fillStyle(0x07090e, 1);
    bg.fillRect(0, 0, width, height);

    // Retro Arcade Header
    const brandText = this.add.text(width / 2, height / 2 - 120, '★ NEO-ARCADE 90s ENGINE ★', {
      fontFamily: '"Press Start 2P"',
      fontSize: '12px',
      color: '#66fcf1'
    }).setOrigin(0.5);

    const loadingText = this.add.text(width / 2, height / 2 - 60, 'NOW INITIALIZING...', {
      fontFamily: '"Press Start 2P"',
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    const percentText = this.add.text(width / 2, height / 2 + 50, '0%', {
      fontFamily: '"Press Start 2P"',
      fontSize: '16px',
      color: '#00ff88'
    }).setOrigin(0.5);

    // Glowing retro loading bar
    const barBg = this.add.graphics();
    barBg.fillStyle(0x131926, 1);
    barBg.fillRoundedRect(width / 2 - 220, height / 2 - 12, 440, 24, 6);
    barBg.lineStyle(2, 0x00ff88, 0.4);
    barBg.strokeRoundedRect(width / 2 - 220, height / 2 - 12, 440, 24, 6);

    const barFill = this.add.graphics();

    this.load.on('progress', (val) => {
      percentText.setText(Math.round(val * 100) + '%');
      barFill.clear();
      barFill.fillStyle(0x00ff88, 1);
      if (val > 0.04) {
        barFill.fillRoundedRect(width / 2 - 218, height / 2 - 10, 436 * val, 20, 5);
      }
    });

    this.load.on('complete', () => {
      barFill.destroy();
      barBg.destroy();
      brandText.destroy();
      loadingText.destroy();
      percentText.destroy();
    });

    // No external image assets needed - 100% procedural 3D graphics
  }

  create() {
    audio.init();
    this.showVsScreen();
  }

  showVsScreen() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const vsContainer = this.add.container(0, 0);

    // Dark split-screen background
    const bg = this.add.graphics();
    bg.fillStyle(0x080b12, 1);
    bg.fillRect(0, 0, width, height);
    vsContainer.add(bg);

    // Diagonal Split Slash
    const slash = this.add.graphics();
    slash.fillStyle(0x111c2e, 0.9);
    slash.beginPath();
    slash.moveTo(0, 0);
    slash.lineTo(width * 0.55, 0);
    slash.lineTo(width * 0.45, height);
    slash.lineTo(0, height);
    slash.closePath();
    slash.fill();
    vsContainer.add(slash);

    // Center VS Logo
    const vsCircle = this.add.graphics();
    vsCircle.fillStyle(0x05070a, 0.95);
    vsCircle.lineStyle(4, 0xffcc00, 1);
    vsCircle.fillCircle(width / 2, height / 2, 54);
    vsCircle.strokeCircle(width / 2, height / 2, 54);
    vsContainer.add(vsCircle);

    const vsText = this.add.text(width / 2, height / 2, 'VS', {
      fontFamily: '"Press Start 2P"',
      fontSize: '36px',
      color: '#ffcc00',
      stroke: '#000000',
      strokeThickness: 8
    }).setOrigin(0.5);
    vsContainer.add(vsText);

    // Left Fighter: AKIRA Card
    const akiraTitle = this.add.text(width * 0.22, 110, 'AKIRA', {
      fontFamily: '"Press Start 2P"',
      fontSize: '30px',
      color: '#00ff88',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);
    vsContainer.add(akiraTitle);

    const akiraSub = this.add.text(width * 0.22, 150, 'THE GREEN LIGHTNING', {
      fontFamily: '"Outfit"',
      fontSize: '15px',
      fontWeight: 'bold',
      color: '#66fcf1'
    }).setOrigin(0.5);
    vsContainer.add(akiraSub);

    const akiraStats = [
      'SPEED   : ★★★★★',
      'POWER   : ★★★★☆',
      'GUARD   : ★★★★☆',
      'SPECIAL : DRAGON RUSH'
    ];
    akiraStats.forEach((st, i) => {
      const t = this.add.text(width * 0.22, 210 + i * 28, st, {
        fontFamily: '"Press Start 2P"',
        fontSize: '10px',
        color: '#ffffff'
      }).setOrigin(0.5);
      vsContainer.add(t);
    });

    // Right Fighter: RYUGA Card
    const ryugaTitle = this.add.text(width * 0.78, 110, 'RYUGA', {
      fontFamily: '"Press Start 2P"',
      fontSize: '30px',
      color: '#ff0055',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);
    vsContainer.add(ryugaTitle);

    const ryugaSub = this.add.text(width * 0.78, 150, 'CRIMSON CHAMPION (AI)', {
      fontFamily: '"Outfit"',
      fontSize: '15px',
      fontWeight: 'bold',
      color: '#ffaa00'
    }).setOrigin(0.5);
    vsContainer.add(ryugaSub);

    const ryugaStats = [
      'SPEED   : ★★★★☆',
      'POWER   : ★★★★★',
      'GUARD   : ★★★★★',
      'SPECIAL : METEOR STRIKE'
    ];
    ryugaStats.forEach((st, i) => {
      const t = this.add.text(width * 0.78, 210 + i * 28, st, {
        fontFamily: '"Press Start 2P"',
        fontSize: '10px',
        color: '#ffffff'
      }).setOrigin(0.5);
      vsContainer.add(t);
    });

    // Match conditions footer
    const footer = this.add.text(width / 2, height - 60, '★ BEST OF 3 ROUNDS • KNOCKOUT OR DECISION ★', {
      fontFamily: '"Press Start 2P"',
      fontSize: '11px',
      color: '#ffffff'
    }).setOrigin(0.5);
    vsContainer.add(footer);

    // Transition to Menu Scene after VS show
    this.time.delayedCall(1600, () => {
      this.cameras.main.fade(400, 0, 0, 0);
      this.time.delayedCall(400, () => {
        this.scene.start('MenuScene');
      });
    });
  }
}
