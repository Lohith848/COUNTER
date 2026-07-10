import Phaser from 'phaser';

export default class RyugaAI {
  constructor(opponent, player) {
    this.opponent = opponent; // Ryuga entity
    this.player = player;     // Akira entity
    this.playerHistory = [];  // Rolling buffer of player's last 15 actions
    this.maxHistorySize = 15;
    
    // AI decision tick control
    this.lastDecisionTime = 0;
    this.decisionInterval = 600; // ms between decisions (will scale by round)
    
    this.state = 'IDLE'; // IDLE, APPROACH, RETREAT, BLOCK, DODGE, ATTACK, CLINCH
    
    // Adaptive weights (modifiers to Ryuga's behavior)
    this.adaptation = {
      blockJabRate: 0.15,      // Base block rate vs Jab
      dodgeHookRate: 0.15,     // Base dodge rate vs Hook
      blockUppercutRate: 0.15, // Base block rate vs Uppercut
      clinchOnBlockRate: 0.1,  // Base clinch rate if player is blocking
      aggression: 0.4          // Probability of approaching & attacking
    };
    
    this.difficultyFactor = 1.0; // Scales reaction speed/stats based on round
  }

  setDifficulty(round) {
    // Round 1: Apprentice - slow reaction, low adaptation
    // Round 2: Adaptive - moderate reaction, high adaptation
    // Round 3: Champion - fast reaction, aggressive adaptation
    if (round === 1) {
      this.decisionInterval = 650;
      this.difficultyFactor = 0.8;
    } else if (round === 2) {
      this.decisionInterval = 400;
      this.difficultyFactor = 1.2;
    } else {
      this.decisionInterval = 250;
      this.difficultyFactor = 1.6;
    }
  }

  recordPlayerAction(action) {
    // Record player actions (jab, hook, uppercut, block, dodge, clinch, move)
    this.playerHistory.push(action);
    if (this.playerHistory.length > this.maxHistorySize) {
      this.playerHistory.shift();
    }
    
    this.adaptToPatterns();
  }

  adaptToPatterns() {
    if (this.playerHistory.length < 5) return; // Need a small sample size first

    // Count action frequencies in history
    let jabCount = 0;
    let hookCount = 0;
    let uppercutCount = 0;
    let blockCount = 0;
    let dodgeCount = 0;

    this.playerHistory.forEach(act => {
      if (act === 'jab') jabCount++;
      else if (act === 'hook') hookCount++;
      else if (act === 'uppercut') uppercutCount++;
      else if (act === 'block') blockCount++;
      else if (act === 'dodge') dodgeCount++;
    });

    const totalActions = this.playerHistory.length;
    const jabRatio = jabCount / totalActions;
    const hookRatio = hookCount / totalActions;
    const uppercutRatio = uppercutCount / totalActions;
    const blockRatio = blockCount / totalActions;
    const dodgeRatio = dodgeCount / totalActions;

    // Reset base rates, then apply modifiers
    this.adaptation.blockJabRate = 0.15 + (jabRatio * 0.65 * this.difficultyFactor);
    this.adaptation.dodgeHookRate = 0.15 + (hookRatio * 0.65 * this.difficultyFactor);
    this.adaptation.blockUppercutRate = 0.15 + (uppercutRatio * 0.65 * this.difficultyFactor);
    this.adaptation.clinchOnBlockRate = 0.10 + (blockRatio * 0.70 * this.difficultyFactor);
    
    // If player dodges too much, Ryuga becomes more patient (drops aggression)
    if (dodgeRatio > 0.35) {
      this.adaptation.aggression = 0.25; // Play patient, wait for player dodge recovery
    } else {
      this.adaptation.aggression = 0.4 + (this.difficultyFactor * 0.15); // Pressure the player
    }
  }

  update(time, delta) {
    if (this.opponent.isKnockedOut || this.player.isKnockedOut) return;
    if (this.opponent.isStaggered) return;

    // Check if it's time for a new decision
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

    // 1. Reactive defenses (if player is currently initiating an attack)
    if (playerIsAttacking && dist < 160) {
      const rand = Math.random();
      
      if (playerAttackType === 'jab' && rand < this.adaptation.blockJabRate) {
        this.opponent.block(500); // Block for 500ms
        this.state = 'BLOCK';
        return;
      }
      if (playerAttackType === 'hook' && rand < this.adaptation.dodgeHookRate) {
        this.opponent.dodge();
        this.state = 'DODGE';
        return;
      }
      if (playerAttackType === 'uppercut' && rand < this.adaptation.blockUppercutRate) {
        this.opponent.block(700);
        this.state = 'BLOCK';
        return;
      }
    }

    // 2. Tackle / Clinch if player is turtling
    if (playerIsBlocking && dist < 140 && Math.random() < this.adaptation.clinchOnBlockRate) {
      this.opponent.clinch();
      this.state = 'CLINCH';
      return;
    }

    // 3. Proactive actions based on distance
    const reach = 130; // Attack range
    
    if (dist > reach + 50) {
      // Too far: Approach player
      this.state = 'APPROACH';
      this.approachPlayer();
    } else if (dist <= reach && dist > 50) {
      // In range: Choose to attack, block, or retreat
      const roll = Math.random();

      if (roll < this.adaptation.aggression) {
        // Choose attack type
        const attackRoll = Math.random();
        this.state = 'ATTACK';
        if (attackRoll < 0.5) {
          this.opponent.punch('jab');
        } else if (attackRoll < 0.8) {
          this.opponent.punch('hook');
        } else {
          this.opponent.punch('uppercut');
        }
      } else if (roll < this.adaptation.aggression + 0.2) {
        // Back off to recover stamina
        this.state = 'RETREAT';
        this.retreatFromPlayer();
      } else if (roll < this.adaptation.aggression + 0.35) {
        // Defensive pose
        this.state = 'BLOCK';
        this.opponent.block(600);
      } else {
        // Idle bobbing
        this.state = 'IDLE';
        this.opponent.stopMovement();
      }
    } else {
      // Too close (e.g. clinching or overlapping): step back
      this.state = 'RETREAT';
      this.retreatFromPlayer();
    }
  }

  approachPlayer() {
    const angle = Phaser.Math.Angle.Between(
      this.opponent.x, this.opponent.y,
      this.player.x, this.player.y
    );
    // Move towards player with some variance
    const vx = Math.cos(angle);
    const vy = Math.sin(angle);
    this.opponent.move(vx, vy);
  }

  retreatFromPlayer() {
    const angle = Phaser.Math.Angle.Between(
      this.opponent.x, this.opponent.y,
      this.player.x, this.player.y
    );
    // Move away from player
    const vx = -Math.cos(angle);
    const vy = -Math.sin(angle);
    this.opponent.move(vx, vy);
  }
}
