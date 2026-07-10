import Phaser from 'phaser';
import { audio } from '../utils/SoundSynth.js';

export default class ResultScene extends Phaser.Scene {
  constructor() {
    super('ResultScene');
  }

  init(data) {
    // Save match data passed from FightScene
    this.matchData = data || {
      winner: 'Akira',
      reason: 'KO',
      stats: {
        player: { thrown: 0, landed: 0, jabs: 0, hooks: 0, uppercuts: 0, blocks: 0, dodges: 0 },
        opponent: { thrown: 0, landed: 0, jabs: 0, hooks: 0, uppercuts: 0, blocks: 0, dodges: 0 }
      }
    };
  }

  create() {
    audio.playCheer();
    
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Dark ring background
    const bg = this.add.image(width / 2, height / 2, 'ring');
    bg.setDisplaySize(width, height);
    bg.setTint(0x222233);

    const winnerName = this.matchData.winner.toUpperCase();
    const isPlayerWin = winnerName === 'AKIRA';
    
    // Result Announcement
    const titleText = this.add.text(width / 2, 70, `${winnerName} WINS!`, {
      fontFamily: '"Press Start 2P"',
      fontSize: '36px',
      color: isPlayerWin ? '#00ff88' : '#ff0055',
      stroke: '#000000',
      strokeThickness: 6,
      shadow: { color: isPlayerWin ? '#00ccaa' : '#cc0033', blur: 15, stroke: true, fill: true }
    }).setOrigin(0.5);

    // Method of Victory (e.g. "BY KNOCKOUT" or "BY SPLIT DECISION")
    const methodText = this.add.text(width / 2, 120, `BY ${this.matchData.reason === 'KO' ? 'KNOCKOUT' : 'POINTS DECISION'}`, {
      fontFamily: '"Press Start 2P"',
      fontSize: '14px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Display winner portrait
    const winnerSpriteKey = isPlayerWin ? 'akira_clean' : 'ryuga_clean';
    const winnerPortrait = this.add.image(isPlayerWin ? width * 0.18 : width * 0.82, height / 2 + 30, winnerSpriteKey);
    winnerPortrait.setScale((height * 0.6) / winnerPortrait.height);
    if (!isPlayerWin) winnerPortrait.setFlipX(true);

    // Slide portrait in
    const targetX = isPlayerWin ? width * 0.22 : width * 0.78;
    winnerPortrait.setX(isPlayerWin ? -100 : width + 100);
    this.tweens.add({
      targets: winnerPortrait,
      x: targetX,
      duration: 600,
      ease: 'Back.easeOut'
    });

    // Stats Table Container
    const statsPanel = this.add.graphics();
    statsPanel.fillStyle(0x0b0c10, 0.9);
    statsPanel.lineStyle(2, isPlayerWin ? 0x00ff88 : 0xff0055, 0.5);
    statsPanel.fillRoundedRect(width / 2 - 220, 160, 440, 320, 10);
    statsPanel.strokeRoundedRect(width / 2 - 220, 160, 440, 320, 10);

    // Table Headers
    this.add.text(width / 2, 185, 'FIGHT STATISTICS', {
      fontFamily: '"Press Start 2P"',
      fontSize: '14px',
      color: '#66fcf1'
    }).setOrigin(0.5);

    const pStats = this.matchData.stats.player;
    const oStats = this.matchData.stats.opponent;

    const pAcc = pStats.thrown > 0 ? Math.round((pStats.landed / pStats.thrown) * 100) : 0;
    const oAcc = oStats.thrown > 0 ? Math.round((oStats.landed / oStats.thrown) * 100) : 0;

    const rows = [
      ['PUNCHES LANDED', pStats.landed, oStats.landed],
      ['PUNCHES THROWN', pStats.thrown, oStats.thrown],
      ['ACCURACY %', `${pAcc}%`, `${oAcc}%`],
      ['JABS LANDED', pStats.jabs, oStats.jabs],
      ['HOOKS LANDED', pStats.hooks, oStats.hooks],
      ['UPPERCUTS LANDED', pStats.uppercuts, oStats.uppercuts],
      ['BLOCKS HELD', pStats.blocks, oStats.blocks],
      ['SLIP DODGES', pStats.dodges, oStats.dodges]
    ];

    // Col Labels
    this.add.text(width / 2 - 80, 220, 'AKIRA', { fontFamily: '"Press Start 2P"', fontSize: '10px', color: '#00ff88' }).setOrigin(0.5);
    this.add.text(width / 2 + 80, 220, 'RYUGA', { fontFamily: '"Press Start 2P"', fontSize: '10px', color: '#ff0055' }).setOrigin(0.5);

    rows.forEach((row, i) => {
      const y = 250 + i * 26;
      
      // Metric Label
      this.add.text(width / 2 - 200, y, row[0], {
        fontFamily: '"Outfit"',
        fontSize: '13px',
        color: '#c5c6c7',
        fontWeight: 'bold'
      }).setOrigin(0, 0.5);

      // Akira Val
      this.add.text(width / 2 - 80, y, row[1].toString(), {
        fontFamily: '"Outfit"',
        fontSize: '14px',
        color: '#ffffff',
        fontWeight: '800'
      }).setOrigin(0.5);

      // Ryuga Val
      this.add.text(width / 2 + 80, y, row[2].toString(), {
        fontFamily: '"Outfit"',
        fontSize: '14px',
        color: '#ffffff',
        fontWeight: '800'
      }).setOrigin(0.5);
    });

    // Rematch Button
    const rematchBtn = this.add.graphics();
    rematchBtn.fillStyle(0x00ff88, 1);
    rematchBtn.fillRoundedRect(width / 2 - 210, 500, 195, 45, 8);
    
    const rematchText = this.add.text(width / 2 - 112, 522, 'REMATCH', {
      fontFamily: '"Press Start 2P"',
      fontSize: '11px',
      color: '#0b0c10',
      fontWeight: 'bold'
    }).setOrigin(0.5);

    const rematchZone = this.add.zone(width / 2 - 112, 522, 195, 45).setOrigin(0.5);
    rematchZone.setInteractive({ useHandCursor: true });
    
    rematchZone.on('pointerover', () => {
      rematchBtn.clear();
      rematchBtn.fillStyle(0x22ff99, 1);
      rematchBtn.fillRoundedRect(width / 2 - 210, 500, 195, 45, 8);
      rematchText.setScale(1.05);
      audio.playPunch('light');
    });
    rematchZone.on('pointerout', () => {
      rematchBtn.clear();
      rematchBtn.fillStyle(0x00ff88, 1);
      rematchBtn.fillRoundedRect(width / 2 - 210, 500, 195, 45, 8);
      rematchText.setScale(1.0);
    });
    rematchZone.on('pointerdown', () => {
      audio.playBell();
      this.cameras.main.flash(300, 255, 255, 255);
      this.time.delayedCall(300, () => {
        this.scene.start('FightScene');
      });
    });

    // Menu Button
    const menuBtn = this.add.graphics();
    menuBtn.fillStyle(0x1f2833, 1);
    menuBtn.lineStyle(2, 0x66fcf1, 0.8);
    menuBtn.fillRoundedRect(width / 2 + 15, 500, 195, 45, 8);
    menuBtn.strokeRoundedRect(width / 2 + 15, 500, 195, 45, 8);

    const menuText = this.add.text(width / 2 + 112, 522, 'MAIN MENU', {
      fontFamily: '"Press Start 2P"',
      fontSize: '11px',
      color: '#ffffff',
      fontWeight: 'bold'
    }).setOrigin(0.5);

    const menuZone = this.add.zone(width / 2 + 112, 522, 195, 45).setOrigin(0.5);
    menuZone.setInteractive({ useHandCursor: true });
    
    menuZone.on('pointerover', () => {
      menuBtn.clear();
      menuBtn.fillStyle(0x2c3540, 1);
      menuBtn.lineStyle(2, 0x66fcf1, 1);
      menuBtn.fillRoundedRect(width / 2 + 15, 500, 195, 45, 8);
      menuBtn.strokeRoundedRect(width / 2 + 15, 500, 195, 45, 8);
      menuText.setScale(1.05);
      audio.playPunch('light');
    });
    menuZone.on('pointerout', () => {
      menuBtn.clear();
      menuBtn.fillStyle(0x1f2833, 1);
      menuBtn.lineStyle(2, 0x66fcf1, 0.8);
      menuBtn.fillRoundedRect(width / 2 + 15, 500, 195, 45, 8);
      menuBtn.strokeRoundedRect(width / 2 + 15, 500, 195, 45, 8);
      menuText.setScale(1.0);
    });
    menuZone.on('pointerdown', () => {
      audio.playPunch('medium');
      this.scene.start('MenuScene');
    });
  }
}
