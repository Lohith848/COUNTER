/**
 * RyugaAI — Adaptive AI Controller for Ryuga.
 * Evaluates distances, player attack history, defensive turtling, and super meter status.
 * Dynamically reacts to jabs, hooks, and uppercuts with blocks, slip dodges, counter-strikes,
 * and AI super moves in higher difficulty rounds.
 */

import Phaser from 'phaser';

export default class RyugaAI {
  constructor(opponent, player) {
    this.opponent = opponent;
    this.player = player;
    this.playerHistory = [];
    this.maxHistorySize = 15;

    this.lastDecisionTime = 0;
    this.decisionInterval = 500;
    this.state = 'IDLE';

    this.adaptation = {
      blockJabRate: 0.2,
      dodgeHookRate: 0.2,
      blockUppercutRate: 0.2,
      clinchOnBlockRate: 0.15,
      aggression: 0.45,
      specialRate: 0.7
    };

    this.difficultyFactor = 1.0;
  }

  setDifficulty(round) {
    if (round === 1) {
      this.decisionInterval = 580;
      this.difficultyFactor = 0.85;
      this.adaptation.specialRate = 0.5;
    } else if (round === 2) {
      this.decisionInterval = 380;
      this.difficultyFactor = 1.25;
      this.adaptation.specialRate = 0.8;
    } else {
      // Round 3: Champion beast mode
      this.decisionInterval = 240;
      this.difficultyFactor = 1.65;
      this.adaptation.specialRate = 0.95;
    }
  }

  recordPlayerAction(action) {
    this.playerHistory.push(action);
    if (this.playerHistory.length > this.maxHistorySize) {
      this.playerHistory.shift();
    }
    this.adaptToPatterns();
  }

  adaptToPatterns() {
    if (this.playerHistory.length < 4) return;

    let jabCount = 0, hookCount = 0, uppercutCount = 0, blockCount = 0, dodgeCount = 0;
    this.playerHistory.forEach(act => {
      if (act === 'jab') jabCount++;
      else if (act === 'hook') hookCount++;
      else if (act === 'uppercut') uppercutCount++;
      else if (act === 'block') blockCount++;
      else if (act === 'dodge') dodgeCount++;
    });

    const total = this.playerHistory.length;
    const jabRatio = jabCount / total;
    const hookRatio = hookCount / total;
    const uppercutRatio = uppercutCount / total;
    const blockRatio = blockCount / total;
    const dodgeRatio = dodgeCount / total;

    this.adaptation.blockJabRate = 0.15 + (jabRatio * 0.7 * this.difficultyFactor);
    this.adaptation.dodgeHookRate = 0.15 + (hookRatio * 0.7 * this.difficultyFactor);
    this.adaptation.blockUppercutRate = 0.15 + (uppercutRatio * 0.7 * this.difficultyFactor);
    this.adaptation.clinchOnBlockRate = 0.10 + (blockRatio * 0.75 * this.difficultyFactor);

    if (dodgeRatio > 0.35) {
      this.adaptation.aggression = 0.3; // Patient counter-punching
    } else {
      this.adaptation.aggression = 0.45 + (this.difficultyFactor * 0.15);
    }
  }

  update(time, delta) {
    if (this.opponent.isKnockedOut || this.player.isKnockedOut) return;
    if (this.opponent.isStaggered || this.opponent.isSpecialActive) return;

    if (time - this.lastDecisionTime < this.decisionInterval) return;
    this.lastDecisionTime = time;

    this.makeDecision();
  }

  makeDecision() {
    const dist = Phaser.Math.Distance.Between(
      this.opponent.x, this.opponent.y,
      this.player.x, this.player.y
    );

    const playerIsAttacking = this.player.isAttacking;
    const playerAttackType = this.player.currentAttackType;
    const playerIsBlocking = this.player.isBlocking;

    // 1. AI Super Special Attack Trigger
    if (this.opponent.superMeter >= 100 && dist < 320 && Math.random() < this.adaptation.specialRate) {
      this.opponent.specialAttack();
      this.state = 'SPECIAL';
      return;
    }

    // 2. Reactive Defenses against incoming punches
    if (playerIsAttacking && dist < 300) {
      const rand = Math.random();

      if (playerAttackType === 'jab' && rand < this.adaptation.blockJabRate) {
        this.opponent.block();
        this.state = 'BLOCK';
        this.opponent.scene.time.delayedCall(450, () => this.opponent.unblock());
        return;
      }
      if (playerAttackType === 'hook' && rand < this.adaptation.dodgeHookRate) {
        this.opponent.dodge();
        this.state = 'DODGE';
        return;
      }
      if (playerAttackType === 'uppercut' && rand < this.adaptation.blockUppercutRate) {
        this.opponent.block();
        this.state = 'BLOCK';
        this.opponent.scene.time.delayedCall(600, () => this.opponent.unblock());
        return;
      }
    }

    // 3. Clinch if player is holding block
    if (playerIsBlocking && dist < 250 && Math.random() < this.adaptation.clinchOnBlockRate) {
      this.opponent.clinch();
      this.state = 'CLINCH';
      return;
    }

    // 4. Combat Range Navigation & Attacks
    if (dist > 300) {
      this.state = 'APPROACH';
      this.approachPlayer();
    } else if (dist > 100) {
      const roll = Math.random();

      if (roll < this.adaptation.aggression) {
        this.state = 'ATTACK';
        const attackRoll = Math.random();
        if (attackRoll < 0.45) {
          this.opponent.punch('jab');
        } else if (attackRoll < 0.8) {
          this.opponent.punch('hook');
        } else {
          this.opponent.punch('uppercut');
        }
      } else if (roll < this.adaptation.aggression + 0.22) {
        this.state = 'RETREAT';
        this.retreatFromPlayer();
      } else if (roll < this.adaptation.aggression + 0.38) {
        this.state = 'BLOCK';
        this.opponent.block();
        this.opponent.scene.time.delayedCall(500, () => this.opponent.unblock());
      } else {
        this.state = 'IDLE';
        this.opponent.setVelocity(0, 0);
      }
    } else {
      this.state = 'RETREAT';
      this.retreatFromPlayer();
    }
  }

  approachPlayer() {
    const angle = Phaser.Math.Angle.Between(
      this.opponent.x, this.opponent.y,
      this.player.x, this.player.y
    );
    const vx = Math.cos(angle);
    const vy = Math.sin(angle);
    this.opponent.move(vx, vy);
  }

  retreatFromPlayer() {
    const angle = Phaser.Math.Angle.Between(
      this.opponent.x, this.opponent.y,
      this.player.x, this.player.y
    );
    const vx = -Math.cos(angle);
    const vy = -Math.sin(angle);
    this.opponent.move(vx, vy);
  }
}
