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
        player: { thrown: 0, landed: 0, jabs: 0, hooks: 0, uppercuts: 0, blocks: 0, dodges: 0 },
        opponent: { thrown: 0, landed: 0, jabs: 0, hooks: 0, uppercuts: 0, blocks: 0, dodges: 0 }
      }
    };
  }

  // Accuracy is clamped so a rounding artifact can never exceed 100%.
  static accuracy(stat) {
    if (!stat.thrown || stat.thrown <= 0) return 0;
    const pct = (stat.landed / stat.thrown) * 100;
    return Math.max(0, Math.min(100, Math.round(pct)));
  }

  create() {
    audio.playCheer();

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Everything lives in one container so there are never overlapping/duplicate
    // text nodes left over from a previous visit to this scene.
    this.ui = this.add.container(0, 0).setDepth(10);

    const bg = this.add.image(width / 2, height / 2, 'ring');
    bg.setDisplaySize(width, height);
    bg.setTint(0x222233);
    this.ui.add(bg);

    const winnerName = this.matchData.winner.toUpperCase();
    const isPlayerWin = winnerName === 'AKIRA';

    // Result Announcement
    const titleText = this.add.text(width / 2, 56, `${winnerName} WINS!`, {
      fontFamily: '"Press Start 2P"', fontSize: '36px',
      color: isPlayerWin ? '#00ff88' : '#ff0055',
      stroke: '#000000', strokeThickness: 6,
      shadow: { color: isPlayerWin ? '#00ccaa' : '#cc0033', blur: 15, stroke: true, fill: true }
    }).setOrigin(0.5);
    this.ui.add(titleText);

    const methodText = this.add.text(width / 2, 102, `BY ${this.matchData.reason === 'KO' ? 'KNOCKOUT' : 'POINTS DECISION'}`, {
      fontFamily: '"Press Start 2P"', fontSize: '14px', color: '#ffffff'
    }).setOrigin(0.5);
    this.ui.add(methodText);

    // Round-by-round match summary
    const summary = this.buildRoundSummary();
    const summaryText = this.add.text(width / 2, 138, summary, {
      fontFamily: '"Outfit"', fontSize: '15px', fontWeight: 'bold',
      color: '#66fcf1', align: 'center'
    }).setOrigin(0.5);
    this.ui.add(summaryText);

    // Winner portrait (right side, clear of the stats panel) with victory animation
    const winnerSpriteKey = isPlayerWin ? 'akira_clean' : 'ryuga_clean';
    const portraitX = width * 0.85;
    const winnerPortrait = this.add.image(portraitX, height / 2 + 40, winnerSpriteKey);
    winnerPortrait.setScale((height * 0.5) / winnerPortrait.height);
    if (!isPlayerWin) winnerPortrait.setFlipX(true);
    this.ui.add(winnerPortrait);
    this.animateVictory(winnerPortrait);

    // Stats Table Container
    const panelX = width / 2 - 220;
    const panelY = 168;
    const panelW = 440;
    const panelH = 300;

    const statsPanel = this.add.graphics();
    statsPanel.fillStyle(0x0b0c10, 0.9);
    statsPanel.lineStyle(2, isPlayerWin ? 0x00ff88 : 0xff0055, 0.5);
    statsPanel.fillRoundedRect(panelX, panelY, panelW, panelH, 10);
    statsPanel.strokeRoundedRect(panelX, panelY, panelW, panelH, 10);
    this.ui.add(statsPanel);

    this.ui.add(this.add.text(width / 2, panelY + 22, 'FIGHT STATISTICS', {
      fontFamily: '"Press Start 2P"', fontSize: '14px', color: '#66fcf1'
    }).setOrigin(0.5));

    // Stat rows are drawn (and re-drawn) via renderStats(), which destroys
    // any previously created text objects first to prevent overlap/duplicates.
    this.renderStats();

    // Rematch Button
    this.buildButton(width / 2 - 112, 510, 195, 45, 0x00ff88, '#0b0c10', 'REMATCH', () => {
      audio.playBell();
      this.cameras.main.flash(300, 255, 255, 255);
      this.time.delayedCall(300, () => this.scene.start('FightScene'));
    });

    // Menu Button
    this.buildButton(width / 2 + 112, 510, 195, 45, 0x1f2833, '#ffffff', 'MAIN MENU', () => {
      audio.playPunch('medium');
      this.scene.start('MenuScene');
    }, 0x66fcf1);
  }

  // Draws the statistics table. Always destroys previously created text nodes
  // first so rows can never overlap or duplicate.
  renderStats() {
    if (this._statTexts) {
      this._statTexts.forEach(o => o.destroy());
    }
    this._statTexts = [];

    const width = this.cameras.main.width;
    const panelX = width / 2 - 220;
    const panelY = 168;

    const headerA = this.add.text(width / 2 - 80, panelY + 48, 'AKIRA', {
      fontFamily: '"Press Start 2P"', fontSize: '10px', color: '#00ff88'
    }).setOrigin(0.5);
    const headerR = this.add.text(width / 2 + 80, panelY + 48, 'RYUGA', {
      fontFamily: '"Press Start 2P"', fontSize: '10px', color: '#ff0055'
    }).setOrigin(0.5);
    this._statTexts.push(headerA, headerR);
    this.ui.add(headerA);
    this.ui.add(headerR);

    // Single source of truth: the statsTracker snapshot passed from FightScene.
    const pStats = this.matchData.stats.player;
    const oStats = this.matchData.stats.opponent;
    const pAcc = ResultScene.accuracy(pStats); // clamped to <= 100%
    const oAcc = ResultScene.accuracy(oStats);

    const rows = [
      ['PUNCHES LANDED', pStats.landed, oStats.landed],
      ['PUNCHES THROWN', pStats.thrown, oStats.thrown],
      ['ACCURACY %', `${pAcc}%`, `${oAcc}%`],
      ['JABS', pStats.jabs, oStats.jabs],
      ['HOOKS', pStats.hooks, oStats.hooks],
      ['UPPERCUTS', pStats.uppercuts, oStats.uppercuts],
      ['BLOCKS HELD', pStats.blocks, oStats.blocks],
      ['SLIP DODGES', pStats.dodges, oStats.dodges]
    ];

    rows.forEach((row, i) => {
      const y = panelY + 80 + i * 26;
      const label = this.add.text(panelX + 20, y, row[0], {
        fontFamily: '"Outfit"', fontSize: '13px', color: '#c5c6c7', fontWeight: 'bold'
      }).setOrigin(0, 0.5);

      const pv = this.add.text(width / 2 - 80, y, String(row[1]), {
        fontFamily: '"Outfit"', fontSize: '14px', color: '#ffffff', fontWeight: '800'
      }).setOrigin(0.5);

      const ov = this.add.text(width / 2 + 80, y, String(row[2]), {
        fontFamily: '"Outfit"', fontSize: '14px', color: '#ffffff', fontWeight: '800'
      }).setOrigin(0.5);

      this._statTexts.push(label, pv, ov);
      this.ui.add(label);
      this.ui.add(pv);
      this.ui.add(ov);
    });
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
    return parts.join('    •    ');
  }

  // Celebratory victory bounce for the winner's portrait (2D stand-in for a
  // 3D victory animation).
  animateVictory(image) {
    const baseY = image.y;
    image.setScale(image.scaleX * 0.9);
    this.tweens.add({
      targets: image,
      y: baseY - 26,
      scaleX: image.scaleX * 1.06,
      scaleY: image.scaleY * 1.06,
      duration: 300,
      ease: 'Quad.easeOut',
      yoyo: true,
      onComplete: () => {
        this.tweens.add({
          targets: image,
          y: baseY - 10,
          duration: 460,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
    });
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
      fontFamily: '"Press Start 2P"', fontSize: '11px', color: textColor, fontWeight: 'bold'
    }).setOrigin(0.5);
    this.ui.add(btnText);

    const zone = this.add.zone(cx, cy, w, h).setOrigin(0.5);
    zone.setInteractive({ useHandCursor: true });
    this.ui.add(zone);

    const draw = (c, s) => {
      btnBg.clear();
      btnBg.fillStyle(c, 1);
      if (strokeColor !== undefined) {
        btnBg.lineStyle(2, strokeColor, 1);
        btnBg.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 8);
      }
      btnBg.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 8);
    };

    zone.on('pointerover', () => { draw(0x22ff99, 1); btnText.setScale(1.05); audio.playPunch('light'); });
    zone.on('pointerout', () => { draw(fill, 1); btnText.setScale(1.0); });
    zone.on('pointerdown', onClick);
  }
}
