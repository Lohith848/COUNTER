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

    // 1. Ring Background (Darkened/Blurred for UI readability)
    const bg = this.add.image(width / 2, height / 2, 'ring');
    bg.setDisplaySize(width, height);
    bg.setTint(0x444455); // Darken the background

    // 2. Faceoff Sprites (Slide in from sides)
    const akiraFace = this.add.image(-200, height / 2 + 50, 'akira_clean');
    akiraFace.setOrigin(0.5, 0.5);
    // Scale appropriately based on raw dimensions
    const scaleFactor = (height * 0.75) / akiraFace.height;
    akiraFace.setScale(scaleFactor);

    const ryugaFace = this.add.image(width + 200, height / 2 + 50, 'ryuga_clean');
    ryugaFace.setOrigin(0.5, 0.5);
    ryugaFace.setScale(scaleFactor);
    ryugaFace.setFlipX(true); // Face left

    // Slide in tween
    this.tweens.add({
      targets: akiraFace,
      x: width * 0.22,
      duration: 800,
      ease: 'Power2'
    });
    this.tweens.add({
      targets: ryugaFace,
      x: width * 0.78,
      duration: 800,
      ease: 'Power2'
    });

    // 3. Title Text: "RING OF" + "DOMINANCE"
    const titleTop = this.add.text(width / 2, 70, 'RING OF', {
      fontFamily: '"Press Start 2P"',
      fontSize: '24px',
      color: '#ffffff',
      shadow: { color: '#ff0055', blur: 10, stroke: true, fill: true }
    }).setOrigin(0.5);

    const titleBottom = this.add.text(width / 2, 120, 'DOMINANCE', {
      fontFamily: '"Press Start 2P"',
      fontSize: '44px',
      color: '#ff0055',
      stroke: '#000000',
      strokeThickness: 8,
      shadow: { color: '#00ff88', blur: 15, stroke: true, fill: true }
    }).setOrigin(0.5);

    // Bounce title slightly
    this.tweens.add({
      targets: [titleTop, titleBottom],
      y: '+=8',
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // 4. Center Panels: CONTROLS
    const controlsPanel = this.add.graphics();
    controlsPanel.fillStyle(0x0b0c10, 0.85);
    controlsPanel.lineStyle(2, 0xff0055, 0.6);
    controlsPanel.fillRoundedRect(width / 2 - 250, 190, 500, 240, 12);
    controlsPanel.strokeRoundedRect(width / 2 - 250, 190, 500, 240, 12);

    this.add.text(width / 2, 215, 'FIGHT CONTROLS', {
      fontFamily: '"Press Start 2P"',
      fontSize: '14px',
      color: '#00ff88'
    }).setOrigin(0.5);

    const controlList = [
      'WASD : Move / Position in Ring',
      'J : Fast Jab (Low Dmg) | K : Hook (Med Dmg)',
      'L : Uppercut (High Dmg) | SPACE : Block/Guard',
      'Shift+SPACE : Dodge Slip | E : Clinch Push',
      '* Mobile: Left Joystick & Right Action Buttons'
    ];

    controlList.forEach((text, i) => {
      this.add.text(width / 2, 260 + i * 28, text, {
        fontFamily: '"Outfit"',
        fontSize: '15px',
        color: '#c5c6c7',
        fontWeight: '600'
      }).setOrigin(0.5);
    });

    // 5. Start Button
    const startBtnBg = this.add.graphics();
    startBtnBg.fillStyle(0xff0055, 1);
    startBtnBg.fillRoundedRect(width / 2 - 120, 460, 240, 55, 10);
    
    // Add glow outline
    const startGlow = this.add.graphics();
    startGlow.lineStyle(3, 0x00ff88, 1);
    startGlow.strokeRoundedRect(width / 2 - 122, 458, 244, 59, 11);
    startGlow.setAlpha(0.5);
    
    this.tweens.add({
      targets: startGlow,
      alpha: 1,
      scaleX: 1.02,
      scaleY: 1.05,
      x: -width * 0.01,
      y: -5,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    const startText = this.add.text(width / 2, 487, 'START FIGHT', {
      fontFamily: '"Press Start 2P"',
      fontSize: '16px',
      color: '#ffffff',
      fontWeight: 'bold'
    }).setOrigin(0.5);

    // Make button interactive
    const startZone = this.add.zone(width / 2, 487, 240, 55).setOrigin(0.5);
    startZone.setInteractive({ useHandCursor: true });

    startZone.on('pointerover', () => {
      startBtnBg.clear();
      startBtnBg.fillStyle(0xff1a75, 1);
      startBtnBg.fillRoundedRect(width / 2 - 120, 460, 240, 55, 10);
      startText.setScale(1.05);
      audio.playPunch('light');
    });

    startZone.on('pointerout', () => {
      startBtnBg.clear();
      startBtnBg.fillStyle(0xff0055, 1);
      startBtnBg.fillRoundedRect(width / 2 - 120, 460, 240, 55, 10);
      startText.setScale(1.0);
    });

    startZone.on('pointerdown', () => {
      audio.init();
      audio.playBell();
      
      // Flash camera
      this.cameras.main.flash(400, 255, 255, 255);
      
      // Delay transition to let bell play
      this.time.delayedCall(400, () => {
        this.scene.start('FightScene');
      });
    });

    // 6. Sound Toggle Button
    const muteBtnBg = this.add.graphics();
    muteBtnBg.fillStyle(0x1f2833, 0.8);
    muteBtnBg.fillRoundedRect(width - 70, 20, 50, 50, 8);
    
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

    // 7. Footer Credits
    this.add.text(width / 2, height - 25, 'ROUND 1: APPRENTICE | ROUND 2: ADAPTIVE | ROUND 3: CHAMPION', {
      fontFamily: '"Outfit"',
      fontSize: '13px',
      color: '#66fcf1',
      fontWeight: 'bold',
      letterSpacing: '1px'
    }).setOrigin(0.5);
  }
}
