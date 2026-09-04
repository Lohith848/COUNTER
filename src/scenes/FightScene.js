/**
 * FightScene — Core 90s Retro Arcade 3D Boxing Match Scene.
 * Features:
 * - 3-Round Championship Loop with round cards & countdowns.
 * - Procedural 3D Fighters (Akira vs Ryuga) with realistic kinematics.
 * - Special Moves, Counter Hits, Super Meter integration, and Combo Chains.
 * - Referee 10-count Knockdown sequence and timeout decisions.
 * - Retro arcade synth BGM and sound effects.
 */

import Phaser from 'phaser';
import Player3D from '../three3d/Player3D.js';
import Opponent3D from '../three3d/Opponent3D.js';
import Fight3D from '../three3d/Fight3D.js';
import RyugaAI from '../ai/RyugaAI.js';
import HUD from '../ui/HUD.js';
import TouchControls from '../ui/TouchControls.js';
import MatchController from '../match/MatchController.js';
import StatsTracker from '../utils/statsTracker.js';
import { audio } from '../utils/SoundSynth.js';

const PUNCH_RANGE = { jab: 285, hook: 265, uppercut: 245, special: 310 };

export default class FightScene extends Phaser.Scene {
  constructor() {
    super('FightScene');
  }

  create() {
    audio.init();

    // 1. Three.js Layer (Championship Ring + 3D Fighters + Lights)
    this.fight3d = new Fight3D(document.getElementById('three-layer'));
    this.events.once('shutdown', () => this.teardown3D());

    // 2. Statistics Tracker
    this.stats = new StatsTracker();

    // 3. Match Controller (Best of 3 Rounds)
    this.match = new MatchController(this, {
      roundsToWin: 2,
      maxRounds: 3,
      roundStartHealthFraction: 1.0
    });

    // 4. Instantiate 3D Fighters
    this.player = new Player3D(this, 300, 560, 'Akira', this.stats.player);
    this.opponent = new Opponent3D(this, 980, 560, 'Ryuga', this.stats.opponent);

    // 5. Adaptive AI Brain
    this.aiBrain = new RyugaAI(this.opponent, this.player);

    // 6. Match Flow States
    this.roundTimeMax = 90;
    this.timeRemaining = this.roundTimeMax;
    this.isRoundActive = false;
    this.isMatchOver = false;
    this.inputLocked = true;

    this.comboData = {
      player: { count: 0, lastTime: 0 },
      opponent: { count: 0, lastTime: 0 }
    };

    // 7. 90s Retro Arcade HUD
    this.hud = new HUD(this);
    this.hud.setRoundText(this.match.currentRound);
    this.hud.updateRoundPips(this.match.roundResults);

    // 8. Mobile / Touch Controls
    const isTouchDevice = this.sys.game.device.input.touch || window.innerWidth < 1024;
    if (isTouchDevice) {
      this.touchControls = new TouchControls(this, this.player);
    }

    // 9. Pause Key (ESC)
    this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.isPaused = false;
    this.createPauseOverlay(this.cameras.main.width, this.cameras.main.height);

    // 10. Start Round 1
    this.startRound();
  }

  update(time, delta) {
    if (Phaser.Input.Keyboard.JustDown(this.pauseKey) && !this.isMatchOver) {
      this.togglePause();
    }

    if (this.isPaused || this.isMatchOver) {
      if (this.isMatchOver && !this.isPaused) {
        this.player.update(time, delta);
        this.opponent.update(time, delta);
      }
      if (this.fight3d) this.fight3d.update(delta / 1000);
      return;
    }

    // Dynamic Facing: Boxers always face each other
    if (this.player.x < this.opponent.x) {
      this.player.setFacing(1);
      this.opponent.setFacing(-1);
    } else {
      this.player.setFacing(-1);
      this.opponent.setFacing(1);
    }

    // Entity & AI Updates
    if (this.isRoundActive) {
      this.inputLocked = false;
      this.player.update(time, delta);
      this.opponent.update(time, delta);
      this.aiBrain.update(time, delta);

      // Decrement match timer
      this.timeRemaining -= delta / 1000;
      if (this.timeRemaining <= 0) {
        this.timeRemaining = 0;
        this.handleTimeOut();
      }
    } else {
      this.inputLocked = true;
      this.player.setVelocity(0, 0);
      this.opponent.setVelocity(0, 0);
      this.player.update(time, delta);
      this.opponent.update(time, delta);
    }

    // HUD refresh & 3D render
    this.hud.update(this.player, this.opponent, this.timeRemaining, delta);
    this.fight3d.update(delta / 1000);
  }

  teardown3D() {
    audio.stopFightBGM();
    if (this.player) this.player.destroy();
    if (this.opponent) this.opponent.destroy();
    if (this.fight3d) {
      this.fight3d.destroy();
      this.fight3d = null;
    }
  }

  // ------------------------------------------------------------------
  // ROUND MANAGEMENT & CARDS
  // ------------------------------------------------------------------
  startRound() {
    this.isRoundActive = false;
    this.inputLocked = true;
    this.timeRemaining = this.roundTimeMax;

    this.player.resetFighter(300, 560);
    this.opponent.resetFighter(980, 560);

    this.match.resetFighterForRound(this.player);
    this.match.resetFighterForRound(this.opponent);

    this.hud.playerTrail = this.player.health;
    this.hud.opponentTrail = this.opponent.health;

    this.aiBrain.setDifficulty(this.match.currentRound);
    this.hud.setRoundText(this.match.currentRound);

    this.fight3d.shakeMag = 0;
    this.fight3d.setZoom(1.0);
    this.fight3d.camera.position.copy(this.fight3d.camHome);
    this.fight3d.camera.lookAt(this.fight3d.lookTarget);

    // Show 90s arcade round card (ROUND N -> 3..2..1.. FIGHT!)
    this.showRoundCard(this.match.currentRound, () => {
      this.isRoundActive = true;
      this.inputLocked = false;
      audio.startFightBGM();
    });
  }

  showRoundCard(round, onDone) {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const card = this.add.container(0, 0).setScrollFactor(0).setDepth(200);

    const dim = this.add.graphics();
    dim.fillStyle(0x000000, 0.65);
    dim.fillRect(0, 0, width, height);
    card.add(dim);

    const roundTitleText = round === 3 ? 'FINAL ROUND' : `ROUND ${round}`;
    const title = this.add.text(width / 2, height / 2 - 50, roundTitleText, {
      fontFamily: '"Press Start 2P"',
      fontSize: '38px',
      color: '#66fcf1',
      stroke: '#000000',
      strokeThickness: 8
    }).setOrigin(0.5);
    title.setScale(0.3);
    card.add(title);

    const count = this.add.text(width / 2, height / 2 + 30, '3', {
      fontFamily: '"Press Start 2P"',
      fontSize: '56px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 8
    }).setOrigin(0.5);
    card.add(count);

    this.tweens.add({ targets: title, scale: 1, duration: 300, ease: 'Back.easeOut' });
    audio.playAnnouncer(round === 3 ? 'round3' : round === 2 ? 'round2' : 'round1');

    const steps = ['3', '2', '1'];
    let i = 0;
    const tick = () => {
      count.setText(steps[i]);
      count.setScale(1.6);
      this.tweens.add({ targets: count, scale: 1, duration: 350, ease: 'Back.easeOut' });
      audio.playPunch('light');
      i++;
      if (i < steps.length) {
        this.time.delayedCall(700, tick);
      } else {
        count.setText('FIGHT!');
        count.setColor('#00ff88');
        audio.playAnnouncer('fight');
        this.cameras.main.flash(200, 0, 255, 120);

        this.tweens.add({
          targets: card,
          alpha: 0,
          delay: 350,
          duration: 350,
          onComplete: () => card.destroy()
        });
        this.time.delayedCall(600, () => onDone());
      }
    };
    this.time.delayedCall(600, tick);
  }

  handleTimeOut() {
    this.isRoundActive = false;
    this.inputLocked = true;
    audio.stopFightBGM();
    audio.playBell();

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const banner = this.add.text(width / 2, height / 2 - 30, 'TIME OUT', {
      fontFamily: '"Press Start 2P"',
      fontSize: '36px',
      color: '#ff0055',
      stroke: '#000000',
      strokeThickness: 8
    }).setOrigin(0.5).setDepth(200);

    this.time.delayedCall(1400, () => {
      banner.destroy();

      let winnerName, method = 'DECISION';
      if (this.player.health > this.opponent.health) {
        winnerName = 'Akira';
      } else if (this.opponent.health > this.player.health) {
        winnerName = 'Ryuga';
      } else {
        winnerName = this.stats.player.landed >= this.stats.opponent.landed ? 'Akira' : 'Ryuga';
      }

      const label = `ROUND TO ${winnerName.toUpperCase()}`;
      const color = winnerName === 'Akira' ? '#00ff88' : '#ff0055';
      this.showFloatyText(width / 2, height / 2, label, color, 1800, '18px');

      this.time.delayedCall(2000, () => {
        this.concludeRound(winnerName, method);
      });
    });
  }

  handleKnockout(downedFighter) {
    this.isRoundActive = false;
    this.inputLocked = true;
    audio.stopFightBGM();
    this.fight3d.shake(1.8);

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const downBanner = this.add.text(width / 2, height / 2 - 50, 'DOWN!', {
      fontFamily: '"Press Start 2P"',
      fontSize: '44px',
      color: '#ffaa00',
      stroke: '#000000',
      strokeThickness: 8
    }).setOrigin(0.5).setDepth(200);

    let count = 1;
    const countText = this.add.text(width / 2, height / 2 + 30, '1', {
      fontFamily: '"Press Start 2P"',
      fontSize: '36px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5).setDepth(200);

    const countTimer = this.time.addEvent({
      delay: 800,
      repeat: 3,
      callback: () => {
        count++;
        if (count <= 3) {
          countText.setText(count.toString());
          audio.playPunch('light');
        } else {
          countText.setText('KO!');
          countText.setColor('#ff0055');
          countText.setScale(1.3);
          downBanner.setText('KNOCKOUT!');
          audio.playAnnouncer('ko');
          this.cameras.main.shake(300, 0.02);
          this.fight3d.shake(1.2);

          countTimer.destroy();

          this.time.delayedCall(1400, () => {
            downBanner.destroy();
            countText.destroy();

            const winnerName = downedFighter === this.player ? 'Ryuga' : 'Akira';
            this.concludeRound(winnerName, 'KO');
          });
        }
      }
    });
  }

  concludeRound(winnerName, method) {
    const matchOver = this.match.recordRoundResult(winnerName, method);
    this.hud.updateRoundPips(this.match.roundResults);

    if (matchOver) {
      const winner = this.match.getMatchWinner();
      this.endMatch(winner, method);
    } else {
      this.match.advanceRound();
      this.startRound();
    }
  }

  endMatch(winner, method) {
    this.isMatchOver = true;
    this.inputLocked = true;
    audio.stopFightBGM();

    const winnerFighter = winner === 'Akira' ? this.player : this.opponent;
    if (winnerFighter) winnerFighter.victoryPose();

    const data = {
      winner: winner,
      reason: method === 'KO' ? 'KO' : 'DECISION',
      roundResults: this.match.roundResults.slice(),
      stats: this.stats.snapshot()
    };

    if (this.touchControls) this.touchControls.destroy();
    this.hud.destroy();

    this.time.delayedCall(1400, () => {
      this.scene.start('ResultScene', data);
    });
  }

  // ------------------------------------------------------------------
  // COMBAT HIT RESOLUTION
  // ------------------------------------------------------------------
  checkPunchHit(attacker, punchType, isExhausted) {
    const defender = (attacker === this.player) ? this.opponent : this.player;
    const dist = Phaser.Math.Distance.Between(attacker.x, attacker.y, defender.x, defender.y);
    const range = PUNCH_RANGE[punchType] ?? 260;

    let baseDamage = 8;
    if (punchType === 'hook') baseDamage = 16;
    else if (punchType === 'uppercut') baseDamage = 26;
    else if (punchType === 'special') baseDamage = 36;

    if (isExhausted) baseDamage = Math.round(baseDamage * 0.5);

    const isFacing = (attacker.x < defender.x && attacker.facing === 1) ||
                     (attacker.x > defender.x && attacker.facing === -1);

    if (dist <= range && isFacing) {
      // Counter-hit check: hitting while opponent is in attack windup
      const isCounter = defender.isAttacking;

      const damageDealt = defender.takeDamage(baseDamage, punchType, isCounter);

      if (damageDealt > 0) {
        const key = (attacker === this.player) ? 'player' : 'opponent';
        this.stats.recordLanded(key, punchType);
        attacker.addSuperMeter(15);

        if (isCounter) {
          const head = defender.boxer.getHeadWorldPos();
          const sp = this.fight3d.toScreen(head);
          this.showFloatyText(sp.x, sp.y - 65, 'COUNTER HIT!', '#ff0055', 800, '15px', true);
        }

        this.registerCombo(attacker);
      }
    }
  }

  checkClinchHit(attacker) {
    const defender = (attacker === this.player) ? this.opponent : this.player;
    const dist = Phaser.Math.Distance.Between(attacker.x, attacker.y, defender.x, defender.y);

    if (dist <= 250) {
      defender.unblock();
      defender.stagger(600);

      const head = defender.boxer.getHeadWorldPos();
      const sp = this.fight3d.toScreen(head);
      this.fight3d.shake(0.9);
      this.fight3d.hitSpark(this.fight3d.toWorld(defender.x, defender.y, 90), 0x00ffff, 1.2, 12);
      this.showFloatyText(sp.x, sp.y - 30, 'GUARD BROKEN!', '#00ffff', 700, '13px');
    }
  }

  registerCombo(attacker) {
    const isPlayer = attacker === this.player;
    const key = isPlayer ? 'player' : 'opponent';
    const now = this.time.now;

    if (now - this.comboData[key].lastTime < 1400) {
      this.comboData[key].count++;
    } else {
      this.comboData[key].count = 1;
    }
    this.comboData[key].lastTime = now;

    if (this.comboData[key].count >= 2) {
      const color = isPlayer ? '#00ff88' : '#ff0055';
      const head = attacker.boxer.getHeadWorldPos();
      const sp = this.fight3d.toScreen(head);
      this.showFloatyText(
        sp.x,
        sp.y - 75,
        `COMBO x${this.comboData[key].count}!`,
        color,
        800,
        '16px',
        true
      );
      this.hud.showCombo(key, this.comboData[key].count);
    }
  }

  showFloatyText(x, y, msg, color, duration = 800, fontSize = '13px', bounce = false) {
    const txt = this.add.text(x, y, msg, {
      fontFamily: '"Press Start 2P"',
      fontSize: fontSize,
      color: color,
      stroke: '#000000',
      strokeThickness: 5
    }).setOrigin(0.5).setDepth(60);

    const tweenConfig = {
      targets: txt,
      alpha: 0,
      duration: duration,
      onComplete: () => txt.destroy()
    };

    if (bounce) {
      tweenConfig.y = y - 55;
      this.tweens.add({
        targets: txt,
        scaleX: 1.25,
        scaleY: 1.25,
        duration: 120,
        yoyo: true
      });
    } else {
      tweenConfig.y = y - 35;
    }

    this.tweens.add(tweenConfig);
  }

  // ------------------------------------------------------------------
  // PAUSE MENU
  // ------------------------------------------------------------------
  createPauseOverlay(width, height) {
    this.pauseContainer = this.add.container(0, 0);
    this.pauseContainer.setScrollFactor(0);
    this.pauseContainer.setDepth(200);
    this.pauseContainer.setVisible(false);

    const mask = this.add.graphics();
    mask.fillStyle(0x000000, 0.75);
    mask.fillRect(0, 0, width, height);
    this.pauseContainer.add(mask);

    const box = this.add.graphics();
    box.fillStyle(0x0b0e16, 0.95);
    box.lineStyle(3, 0x66fcf1, 0.85);
    box.fillRoundedRect(width / 2 - 170, height / 2 - 170, 340, 340, 12);
    box.strokeRoundedRect(width / 2 - 170, height / 2 - 170, 340, 340, 12);
    this.pauseContainer.add(box);

    const headText = this.add.text(width / 2, height / 2 - 130, 'PAUSED', {
      fontFamily: '"Press Start 2P"',
      fontSize: '22px',
      color: '#66fcf1'
    }).setOrigin(0.5);
    this.pauseContainer.add(headText);

    const btns = [
      { text: 'RESUME', y: height / 2 - 50, action: () => this.togglePause() },
      {
        text: 'RESTART', y: height / 2 + 10, action: () => {
          this.togglePause();
          this.scene.restart();
        }
      },
      {
        text: 'MAIN MENU', y: height / 2 + 70, action: () => {
          this.togglePause();
          this.scene.start('MenuScene');
        }
      }
    ];

    btns.forEach(btn => {
      const btnBg = this.add.graphics();
      btnBg.fillStyle(0x19212d, 1);
      btnBg.fillRoundedRect(width / 2 - 120, btn.y - 22, 240, 44, 6);
      this.pauseContainer.add(btnBg);

      const btnTxt = this.add.text(width / 2, btn.y, btn.text, {
        fontFamily: '"Press Start 2P"',
        fontSize: '11px',
        color: '#ffffff'
      }).setOrigin(0.5);
      this.pauseContainer.add(btnTxt);

      const zone = this.add.zone(width / 2, btn.y, 240, 44).setOrigin(0.5);
      zone.setInteractive({ useHandCursor: true });

      zone.on('pointerover', () => {
        btnBg.clear();
        btnBg.fillStyle(0x2a3648, 1);
        btnBg.fillRoundedRect(width / 2 - 120, btn.y - 22, 240, 44, 6);
        btnTxt.setScale(1.05);
        audio.playPunch('light');
      });

      zone.on('pointerout', () => {
        btnBg.clear();
        btnBg.fillStyle(0x19212d, 1);
        btnBg.fillRoundedRect(width / 2 - 120, btn.y - 22, 240, 44, 6);
        btnTxt.setScale(1.0);
      });

      zone.on('pointerdown', btn.action);
      this.pauseContainer.add(zone);
    });
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    this.pauseContainer.setVisible(this.isPaused);
    this.inputLocked = this.isPaused;

    if (this.isPaused) {
      audio.stopFightBGM();
      if (this.touchControls) this.touchControls.setVisible(false);
    } else {
      if (this.isRoundActive) audio.startFightBGM();
      if (this.touchControls) this.touchControls.setVisible(true);
    }
  }
}
