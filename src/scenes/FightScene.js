import Phaser from 'phaser';
import Player from '../entities/Player.js';
import Opponent from '../entities/Opponent.js';
import RyugaAI from '../ai/RyugaAI.js';
import HUD from '../ui/HUD.js';
import TouchControls from '../ui/TouchControls.js';
import MatchController from '../match/MatchController.js';
import StatsTracker from '../utils/statsTracker.js';
import { audio } from '../utils/SoundSynth.js';

export default class FightScene extends Phaser.Scene {
  constructor() {
    super('FightScene');
  }

  create() {
    audio.init();

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 1. Ring Background
    const bg = this.add.image(width / 2, height / 2, 'ring');
    bg.setDisplaySize(width, height);

    // 2. Physics World Bounds (Ring Floor Area)
    this.physics.world.setBounds(100, 445, 1080, 225);

    // 3. Single source of truth for statistics (shared by both fighters).
    this.stats = new StatsTracker();

    // 4. Match controller: best-of-3 round tracking & resets.
    this.match = new MatchController(this, {
      roundsToWin: 2,
      maxRounds: 3,
      roundStartHealthFraction: 1.0 // full reset each round (set 0.7 for "wear them down")
    });

    // 5. Instantiate Fighters (both reference the shared stats objects)
    this.player = new Player(this, 300, 560, 'akira_clean', this.stats.player);
    this.opponent = new Opponent(this, 980, 560, 'ryuga_clean', this.stats.opponent);

    // 6. Instantiate Adaptive AI
    this.aiBrain = new RyugaAI(this.opponent, this.player);

    // 7. Game State Parameters
    this.roundTimeMax = 90; // 90 seconds per round
    this.timeRemaining = this.roundTimeMax;
    this.isRoundActive = false;
    this.isMatchOver = false;

    // Combo tracking (per fighter, resets on time-window expiry)
    this.comboData = {
      player: { count: 0, lastTime: 0 },
      opponent: { count: 0, lastTime: 0 }
    };

    // 8. HUD Overlay
    this.hud = new HUD(this);
    this.hud.setRoundText(this.match.currentRound);
    this.hud.updateRoundPips(this.match.roundResults);

    // 9. Touch Controls Overlay (Mobile / Touch Devices)
    const isTouchDevice = this.sys.game.device.input.touch || window.innerWidth < 1024;
    if (isTouchDevice) {
      this.touchControls = new TouchControls(this, this.player);
    }

    // 10. Keyboard Pause Key (Esc)
    this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.isPaused = false;
    this.createPauseOverlay(width, height);

    // 11. Start the First Round
    this.startRound();
  }

  update(time, delta) {
    // Esc Key Pausing
    if (Phaser.Input.Keyboard.JustDown(this.pauseKey) && !this.isMatchOver) {
      this.togglePause();
    }

    if (this.isPaused || this.isMatchOver) return;

    // A. Dynamic Facing direction: fighters face each other
    if (this.player.x < this.opponent.x) {
      this.player.setFlipX(false);
      this.opponent.setFlipX(true);
    } else {
      this.player.setFlipX(true);
      this.opponent.setFlipX(false);
    }

    // B. Entity and AI updates (if round is active)
    if (this.isRoundActive) {
      this.player.update(time, delta);
      this.opponent.update(time, delta);
      this.aiBrain.update(time, delta);

      // Decrement Timer
      this.timeRemaining -= delta / 1000;
      if (this.timeRemaining <= 0) {
        this.timeRemaining = 0;
        this.handleTimeOut();
      }
    } else {
      // Hold velocities to 0 during countdowns
      this.player.setVelocity(0, 0);
      this.opponent.setVelocity(0, 0);
    }

    // C. HUD Refresh
    this.hud.update(this.player, this.opponent, this.timeRemaining, delta);
  }

  // --- ROUND LOOP MECHANICS ---

  startRound() {
    this.isRoundActive = false;
    this.timeRemaining = this.roundTimeMax;

    // Reset fighters positions and states
    this.player.resetFighter(300, 560);
    this.opponent.resetFighter(980, 560);
    this.opponent.setFlipX(true);

    // Apply round-start health/stamina (full or partial carry-over)
    this.match.resetFighterForRound(this.player);
    this.match.resetFighterForRound(this.opponent);

    // Reset damage-trail bars to full so they don't animate from the previous round
    this.hud.playerTrail = this.player.health;
    this.hud.opponentTrail = this.opponent.health;

    // Set AI difficulty based on round
    this.aiBrain.setDifficulty(this.match.currentRound);
    this.hud.setRoundText(this.match.currentRound);

    // Animated "ROUND N / 3..2..1..FIGHT!" card, then begin.
    this.showRoundCard(this.match.currentRound, () => {
      this.isRoundActive = true;
    });
  }

  // Animated round-intro title card with countdown.
  showRoundCard(round, onDone) {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const card = this.add.container(0, 0).setScrollFactor(0).setDepth(200);

    const dim = this.add.graphics();
    dim.fillStyle(0x000000, 0.55);
    dim.fillRect(0, 0, width, height);
    card.add(dim);

    const title = this.add.text(width / 2, height / 2 - 50, `ROUND ${round}`, {
      fontFamily: '"Press Start 2P"', fontSize: '42px',
      color: '#66fcf1', stroke: '#000000', strokeThickness: 8
    }).setOrigin(0.5);
    title.setScale(0.3);
    card.add(title);

    const count = this.add.text(width / 2, height / 2 + 30, '3', {
      fontFamily: '"Press Start 2P"', fontSize: '60px',
      color: '#ffffff', stroke: '#000000', strokeThickness: 8
    }).setOrigin(0.5);
    card.add(count);

    // Animate title in
    this.tweens.add({ targets: title, scale: 1, duration: 320, ease: 'Back.easeOut' });
    audio.playBell();

    const steps = ['3', '2', '1'];
    let i = 0;
    const tick = () => {
      count.setText(steps[i]);
      count.setScale(1.7);
      this.tweens.add({ targets: count, scale: 1, duration: 380, ease: 'Back.easeOut' });
      audio.playPunch('light');
      i++;
      if (i < steps.length) {
        this.time.delayedCall(700, tick);
      } else {
        count.setText('FIGHT!');
        count.setColor('#00ff88');
        audio.playPunch('heavy');
        this.cameras.main.flash(200, 0, 255, 120);
        this.tweens.add({
          targets: card, alpha: 0, delay: 320, duration: 400,
          onComplete: () => card.destroy()
        });
        this.time.delayedCall(640, () => onDone());
      }
    };
    this.time.delayedCall(620, tick);
  }

  handleTimeOut() {
    this.isRoundActive = false;
    this.player.setVelocity(0, 0);
    this.opponent.setVelocity(0, 0);

    audio.playBell();

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const banner = this.add.text(width / 2, height / 2 - 30, 'TIME OUT', {
      fontFamily: '"Press Start 2P"', fontSize: '36px',
      color: '#ff0055', stroke: '#000000', strokeThickness: 8
    }).setOrigin(0.5).setDepth(200);

    this.time.delayedCall(1300, () => {
      banner.destroy();

      // Round winner by higher health % (tie -> aggregate landed punches)
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
    this.player.setVelocity(0, 0);
    this.opponent.setVelocity(0, 0);

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const downBanner = this.add.text(width / 2, height / 2 - 50, 'DOWN!', {
      fontFamily: '"Press Start 2P"', fontSize: '44px',
      color: '#ffaa00', stroke: '#000000', strokeThickness: 8
    }).setOrigin(0.5).setDepth(200);

    // Dynamic 3-second count to KO
    let count = 1;
    const countText = this.add.text(width / 2, height / 2 + 30, '1', {
      fontFamily: '"Press Start 2P"', fontSize: '32px',
      color: '#ffffff', stroke: '#000000', strokeThickness: 6
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
          countText.setScale(1.2);
          downBanner.setText('OUT!');
          audio.playBell();
          this.cameras.main.shake(300, 0.015);

          countTimer.destroy();

          this.time.delayedCall(1300, () => {
            downBanner.destroy();
            countText.destroy();

            // A KO wins the ROUND for the fighter still standing.
            const winnerName = downedFighter === this.player ? 'Ryuga' : 'Akira';
            this.concludeRound(winnerName, 'KO');
          });
        }
      }
    });
  }

  // Single funnel for ending a round: records the result, then either
  // advances to the next round or ends the match.
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

    const data = {
      winner: winner,
      reason: method === 'KO' ? 'KO' : 'DECISION',
      roundResults: this.match.roundResults.slice(),
      stats: this.stats.snapshot()
    };

    if (this.touchControls) this.touchControls.destroy();
    this.hud.destroy();

    this.scene.start('ResultScene', data);
  }

  // --- COMBAT HITBOX CHECKS ---

  checkPunchHit(attacker, punchType, isExhausted) {
    const defender = (attacker === this.player) ? this.opponent : this.player;

    const dist = Phaser.Math.Distance.Between(attacker.x, attacker.y, defender.x, defender.y);

    let range = 140; // Jab
    let damage = 6;
    if (punchType === 'hook') {
      range = 160;
      damage = 12;
    } else if (punchType === 'uppercut') {
      range = 120;
      damage = 22;
    }

    if (isExhausted) {
      damage = Math.round(damage * 0.5); // 50% damage when out of stamina
    }

    const isFacing = (attacker.x < defender.x && !attacker.flipX) ||
                      (attacker.x > defender.x && attacker.flipX);

    if (dist <= range && isFacing) {
      const damageDealt = defender.takeDamage(damage, punchType);

      if (damageDealt > 0) {
        const key = (attacker === this.player) ? 'player' : 'opponent';
        this.stats.recordLanded(key, punchType); // single source of truth

        const sparkX = (attacker.x + defender.x) / 2;
        const sparkY = (attacker.y + defender.y) / 2 - 60;
        this.createHitSpark(sparkX, sparkY, punchType);

        this.registerCombo(attacker);
      }
    }
  }

  checkClinchHit(attacker) {
    const defender = (attacker === this.player) ? this.opponent : this.player;
    const dist = Phaser.Math.Distance.Between(attacker.x, attacker.y, defender.x, defender.y);

    if (dist <= 125) {
      defender.unblock();
      defender.stagger(600);

      const dir = (attacker.x < defender.x) ? 1 : -1;
      defender.setVelocity(dir * 500, -80);

      this.cameras.main.flash(100, 100, 255, 255, false);

      this.showFloatyText(defender.x, defender.y - 120, 'GUARD BROKEN', '#00ffff');
      this.createHitSpark((attacker.x + defender.x) / 2, (attacker.y + defender.y) / 2 - 50, 'clinch');
    }
  }

  // --- JUICE: SPARKS, FLOATING TEXT, COMBOS ---

  registerCombo(attacker) {
    const isPlayer = attacker === this.player;
    const key = isPlayer ? 'player' : 'opponent';
    const now = this.time.now;

    if (now - this.comboData[key].lastTime < 1500) {
      this.comboData[key].count++;
    } else {
      this.comboData[key].count = 1;
    }

    this.comboData[key].lastTime = now;

    if (this.comboData[key].count >= 2) {
      const color = isPlayer ? '#00ff88' : '#ff0055';
      this.showFloatyText(
        attacker.x,
        attacker.y - 180,
        `COMBO x${this.comboData[key].count}`,
        color,
        800,
        '16px',
        true
      );
      // HUD combo counter (bold number + scale-pop)
      this.hud.showCombo(key, this.comboData[key].count);
    }
  }

  createHitSpark(x, y, type) {
    const spark = this.add.graphics();
    spark.setDepth(15);

    let color = 0xffffff;
    let lines = 4;
    let radius = 25;

    if (type === 'hook') {
      color = 0xffaa00;
      lines = 6;
      radius = 40;
    } else if (type === 'uppercut') {
      color = 0xff0055;
      lines = 8;
      radius = 55;
    } else if (type === 'clinch') {
      color = 0x00ffff;
      lines = 5;
      radius = 35;
    }

    spark.lineStyle(2, color, 1);
    spark.strokeCircle(x, y, radius * 0.2);

    for (let i = 0; i < lines; i++) {
      const angle = (Math.PI * 2 / lines) * i;
      const x1 = x + Math.cos(angle) * (radius * 0.2);
      const y1 = y + Math.sin(angle) * (radius * 0.2);
      const x2 = x + Math.cos(angle) * radius;
      const y2 = y + Math.sin(angle) * radius;

      spark.lineBetween(x1, y1, x2, y2);
    }

    this.tweens.add({
      targets: spark,
      scaleX: 1.3,
      scaleY: 1.3,
      alpha: 0,
      duration: 180,
      ease: 'Quad.easeOut',
      onComplete: () => spark.destroy()
    });
  }

  showFloatyText(x, y, msg, color, duration = 800, fontSize = '14px', bounce = false) {
    const txt = this.add.text(x, y, msg, {
      fontFamily: '"Press Start 2P"',
      fontSize: fontSize,
      color: color,
      stroke: '#000000',
      strokeThickness: 5
    }).setOrigin(0.5).setDepth(40);

    const tweenConfig = {
      targets: txt,
      alpha: 0,
      duration: duration,
      onComplete: () => txt.destroy()
    };

    if (bounce) {
      tweenConfig.y = y - 60;
      this.tweens.add({
        targets: txt,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 100,
        yoyo: true
      });
    } else {
      tweenConfig.y = y - 40;
    }

    this.tweens.add(tweenConfig);
  }

  // --- PAUSE MENU SYSTEM ---

  createPauseOverlay(width, height) {
    this.pauseContainer = this.add.container(0, 0);
    this.pauseContainer.setScrollFactor(0);
    this.pauseContainer.setDepth(200);
    this.pauseContainer.setVisible(false);

    const mask = this.add.graphics();
    mask.fillStyle(0x000000, 0.7);
    mask.fillRect(0, 0, width, height);
    this.pauseContainer.add(mask);

    const box = this.add.graphics();
    box.fillStyle(0x0b0c10, 0.9);
    box.lineStyle(3, 0x66fcf1, 0.8);
    box.fillRoundedRect(width / 2 - 160, height / 2 - 170, 320, 320, 12);
    box.strokeRoundedRect(width / 2 - 160, height / 2 - 170, 320, 320, 12);
    this.pauseContainer.add(box);

    const headText = this.add.text(width / 2, height / 2 - 130, 'PAUSED', {
      fontFamily: '"Press Start 2P"', fontSize: '22px',
      color: '#66fcf1'
    }).setOrigin(0.5);
    this.pauseContainer.add(headText);

    const btns = [
      { text: 'RESUME', y: height / 2 - 60, action: () => this.togglePause() },
      {
        text: 'RESTART', y: height / 2, action: () => {
          this.togglePause();
          this.scene.restart();
        }
      },
      {
        text: 'MAIN MENU', y: height / 2 + 60, action: () => {
          this.togglePause();
          this.scene.start('MenuScene');
        }
      }
    ];

    btns.forEach(btn => {
      const btnBg = this.add.graphics();
      btnBg.fillStyle(0x1f2833, 1);
      btnBg.fillRoundedRect(width / 2 - 110, btn.y - 22, 220, 44, 6);
      this.pauseContainer.add(btnBg);

      const btnTxt = this.add.text(width / 2, btn.y, btn.text, {
        fontFamily: '"Press Start 2P"', fontSize: '12px',
        color: '#ffffff', fontWeight: 'bold'
      }).setOrigin(0.5);
      this.pauseContainer.add(btnTxt);

      const zone = this.add.zone(width / 2, btn.y, 220, 44).setOrigin(0.5);
      zone.setInteractive({ useHandCursor: true });

      zone.on('pointerover', () => {
        btnBg.clear();
        btnBg.fillStyle(0x2c3540, 1);
        btnBg.fillRoundedRect(width / 2 - 110, btn.y - 22, 220, 44, 6);
        btnTxt.setScale(1.05);
        audio.playPunch('light');
      });

      zone.on('pointerout', () => {
        btnBg.clear();
        btnBg.fillStyle(0x1f2833, 1);
        btnBg.fillRoundedRect(width / 2 - 110, btn.y - 22, 220, 44, 6);
        btnTxt.setScale(1.0);
      });

      zone.on('pointerdown', btn.action);

      this.pauseContainer.add(zone);
    });
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    this.pauseContainer.setVisible(this.isPaused);

    if (this.isPaused) {
      this.physics.pause();
      if (this.touchControls) this.touchControls.setVisible(false);
    } else {
      this.physics.resume();
      if (this.touchControls) this.touchControls.setVisible(true);
    }
    audio.playPunch('medium');
  }
}
