/**
 * ResultScene — 90s Retro Arcade Victory & Statistics Screen.
 * Features:
 * - Match victory celebration and winner declaration.
 * - Performance Rank grading (S / A / B / C / D).
 * - Comprehensive punch analytics & accuracy metrics.
 * - Interactive Rematch and Main Menu flow.
 */

import Phaser from 'phaser';
import { audio } from '../utils/SoundSynth.js';

export default class ResultScene extends Phaser.Scene {
  constructor() {
    super('ResultScene');
  }

  init(data) {
    this.matchData = data || {
      winner: 'Akira',
      reason: 'KO',
      roundResults: [],
      stats: {
        player: { thrown: 0, landed: 0, jabs: 0, hooks: 0, uppercuts: 0, specials: 0, blocks: 0, dodges: 0 },
        opponent: { thrown: 0, landed: 0, jabs: 0, hooks: 0, uppercuts: 0, specials: 0, blocks: 0, dodges: 0 }
      }
    };
  }

  static accuracy(stat) {
    if (!stat.thrown || stat.thrown <= 0) return 0;
    const pct = (stat.landed / stat.thrown) * 100;
    return Math.max(0, Math.min(100, Math.round(pct)));
  }

  static calculateGrade(isPlayerWin, pAcc, reason) {
    if (!isPlayerWin) return 'D';
    if (pAcc >= 65 && reason === 'KO') return 'S';
    if (pAcc >= 50) return 'A';
    if (pAcc >= 35) return 'B';
    return 'C';
  }

  create() {
    audio.playAnnouncer('winner');
    audio.playCheer();

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.ui = this.add.container(0, 0).setDepth(10);

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x06090f, 0x06090f, 0x141b26, 0x141b26, 1);
    bg.fillRect(0, 0, width, height);
    this.ui.add(bg);

    const winnerName = this.matchData.winner.toUpperCase();
    const isPlayerWin = winnerName === 'AKIRA';

    // 1. Victory Title
    const titleText = this.add.text(width / 2, 50, `${winnerName} WINS!`, {
      fontFamily: '"Press Start 2P"',
      fontSize: '34px',
      color: isPlayerWin ? '#00ff88' : '#ff0055',
      stroke: '#000000',
      strokeThickness: 7,
      shadow: { color: isPlayerWin ? '#00ccaa' : '#cc0033', blur: 16, stroke: true, fill: true }
    }).setOrigin(0.5);
    this.ui.add(titleText);

    const methodText = this.add.text(width / 2, 94, `BY ${this.matchData.reason === 'KO' ? 'KNOCKOUT' : 'POINTS DECISION'}`, {
      fontFamily: '"Press Start 2P"',
      fontSize: '13px',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.ui.add(methodText);

    // 2. Round Summary
    const summary = this.buildRoundSummary();
    const summaryText = this.add.text(width / 2, 130, summary, {
      fontFamily: '"Outfit"',
      fontSize: '15px',
      fontWeight: 'bold',
      color: '#66fcf1',
      align: 'center'
    }).setOrigin(0.5);
    this.ui.add(summaryText);

    // 3. Performance Rank Badge (e.g. S / A / B / C / D)
    const pStats = this.matchData.stats.player;
    const oStats = this.matchData.stats.opponent;
    const pAcc = ResultScene.accuracy(pStats);
    const grade = ResultScene.calculateGrade(isPlayerWin, pAcc, this.matchData.reason);

    const rankBox = this.add.graphics();
    rankBox.fillStyle(0x0a0f18, 0.9);
    rankBox.lineStyle(3, grade === 'S' ? 0xffd700 : 0x00ff88, 0.8);
    rankBox.fillRoundedRect(width * 0.82 - 60, 165, 120, 140, 10);
    rankBox.strokeRoundedRect(width * 0.82 - 60, 165, 120, 140, 10);
    this.ui.add(rankBox);

    const gradeLabel = this.add.text(width * 0.82, 190, 'RANK', {
      fontFamily: '"Press Start 2P"',
      fontSize: '12px',
      color: '#66fcf1'
    }).setOrigin(0.5);
    this.ui.add(gradeLabel);

    const gradeVal = this.add.text(width * 0.82, 245, grade, {
      fontFamily: '"Press Start 2P"',
      fontSize: '48px',
      color: grade === 'S' ? '#ffd700' : grade === 'A' ? '#00ff88' : '#ffffff',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);
    this.ui.add(gradeVal);

    // 4. Fight Statistics Table Panel
    const panelX = width / 2 - 240;
    const panelY = 160;
    const panelW = 480;
    const panelH = 340;

    const statsPanel = this.add.graphics();
    statsPanel.fillStyle(0x0a0e16, 0.92);
    statsPanel.lineStyle(2, isPlayerWin ? 0x00ff88 : 0xff0055, 0.6);
    statsPanel.fillRoundedRect(panelX, panelY, panelW, panelH, 10);
    statsPanel.strokeRoundedRect(panelX, panelY, panelW, panelH, 10);
    this.ui.add(statsPanel);

    this.ui.add(this.add.text(width / 2, panelY + 22, 'FIGHT STATISTICS', {
      fontFamily: '"Press Start 2P"',
      fontSize: '13px',
      color: '#66fcf1'
    }).setOrigin(0.5));

    const headerA = this.add.text(width / 2 - 80, panelY + 52, 'AKIRA', {
      fontFamily: '"Press Start 2P"',
      fontSize: '11px',
      color: '#00ff88'
    }).setOrigin(0.5);

    const headerR = this.add.text(width / 2 + 80, panelY + 52, 'RYUGA', {
      fontFamily: '"Press Start 2P"',
      fontSize: '11px',
      color: '#ff0055'
    }).setOrigin(0.5);

    this.ui.add(headerA);
    this.ui.add(headerR);

    const oAcc = ResultScene.accuracy(oStats);

    const rows = [
      ['PUNCHES LANDED', pStats.landed, oStats.landed],
      ['PUNCHES THROWN', pStats.thrown, oStats.thrown],
      ['ACCURACY %', `${pAcc}%`, `${oAcc}%`],
      ['JABS', pStats.jabs || 0, oStats.jabs || 0],
      ['HOOKS', pStats.hooks || 0, oStats.hooks || 0],
      ['UPPERCUTS', pStats.uppercuts || 0, oStats.uppercuts || 0],
      ['SUPER MOVES', pStats.specials || 0, oStats.specials || 0],
      ['BLOCKS HELD', pStats.blocks || 0, oStats.blocks || 0],
      ['SLIP DODGES', pStats.dodges || 0, oStats.dodges || 0]
    ];

    rows.forEach((row, i) => {
      const y = panelY + 82 + i * 27;
      const label = this.add.text(panelX + 18, y, row[0], {
        fontFamily: '"Outfit"',
        fontSize: '13px',
        color: '#c5c6c7',
        fontWeight: 'bold'
      }).setOrigin(0, 0.5);

      const pv = this.add.text(width / 2 - 80, y, String(row[1]), {
        fontFamily: '"Outfit"',
        fontSize: '14px',
        color: '#ffffff',
        fontWeight: '800'
      }).setOrigin(0.5);

      const ov = this.add.text(width / 2 + 80, y, String(row[2]), {
        fontFamily: '"Outfit"',
        fontSize: '14px',
        color: '#ffffff',
        fontWeight: '800'
      }).setOrigin(0.5);

      this.ui.add(label);
      this.ui.add(pv);
      this.ui.add(ov);
    });

    // 5. Rematch & Main Menu Buttons
    this.buildButton(width / 2 - 120, 530, 200, 48, 0x00ff88, '#0a0e14', 'REMATCH', () => {
      audio.playBell();
      this.cameras.main.flash(300, 255, 255, 255);
      this.time.delayedCall(300, () => this.scene.start('FightScene'));
    });

    this.buildButton(width / 2 + 120, 530, 200, 48, 0x1f2833, '#ffffff', 'MAIN MENU', () => {
      audio.playPunch('medium');
      this.scene.start('MenuScene');
    }, 0x66fcf1);
  }

  buildRoundSummary() {
    const results = this.matchData.roundResults;
    if (!results || results.length === 0) {
      const w = this.matchData.winner;
      return `MATCH WINNER: ${w.toUpperCase()} (${this.matchData.reason})`;
    }
    const parts = results.map(r => {
      const method = r.method === 'KO' ? 'KO' : 'DEC';
      return `R${r.round} ${r.winner} (${method})`;
    });
    return parts.join('    ★    ');
  }

  buildButton(cx, cy, w, h, fill, textColor, label, onClick, strokeColor) {
    const btnBg = this.add.graphics();
    btnBg.fillStyle(fill, 1);
    if (strokeColor !== undefined) {
      btnBg.lineStyle(2, strokeColor, 0.8);
      btnBg.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 8);
    }
    btnBg.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 8);
    this.ui.add(btnBg);

    const btnText = this.add.text(cx, cy, label, {
      fontFamily: '"Press Start 2P"',
      fontSize: '11px',
      color: textColor,
      fontWeight: 'bold'
    }).setOrigin(0.5);
    this.ui.add(btnText);

    const zone = this.add.zone(cx, cy, w, h).setOrigin(0.5);
    zone.setInteractive({ useHandCursor: true });
    this.ui.add(zone);

    const draw = (c) => {
      btnBg.clear();
      btnBg.fillStyle(c, 1);
      if (strokeColor !== undefined) {
        btnBg.lineStyle(2, strokeColor, 1);
        btnBg.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 8);
      }
      btnBg.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 8);
    };

    zone.on('pointerover', () => {
      draw(0x22ff99);
      btnText.setScale(1.05);
      audio.playPunch('light');
    });

    zone.on('pointerout', () => {
      draw(fill);
      btnText.setScale(1.0);
    });

    zone.on('pointerdown', onClick);
  }
}
