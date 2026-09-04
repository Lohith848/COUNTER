/**
 * MatchController — Tracks the Best-of-3 match structure:
 * - Each round is won by KO or higher health % at time-out.
 * - First fighter to win 2 rounds wins the match.
 * - Resets health/stamina and fighter states between rounds.
 * - Records round result history.
 */

export default class MatchController {
  constructor(scene, options = {}) {
    this.scene = scene;

    this.roundsToWin = options.roundsToWin ?? 2;
    this.maxRounds = options.maxRounds ?? 3;
    this.roundStartHealthFraction = options.roundStartHealthFraction ?? 1.0;

    this.currentRound = 1;
    this.roundWins = { player: 0, opponent: 0 };
    this.roundResults = [];
  }

  recordRoundResult(winner, method) {
    const key = winner === 'Akira' ? 'player' : 'opponent';
    this.roundWins[key]++;
    this.roundResults.push({ round: this.currentRound, winner, method });
    return this.isMatchOver();
  }

  isMatchOver() {
    if (this.roundWins.player >= this.roundsToWin) return true;
    if (this.roundWins.opponent >= this.roundsToWin) return true;
    if (this.currentRound >= this.maxRounds) return true;
    return false;
  }

  advanceRound() {
    this.currentRound++;
    return this.currentRound;
  }

  getMatchWinner() {
    if (this.roundWins.player > this.roundWins.opponent) return 'Akira';
    if (this.roundWins.opponent > this.roundWins.player) return 'Ryuga';
    const stats = this.scene.stats;
    if (stats) {
      return stats.player.landed >= stats.opponent.landed ? 'Akira' : 'Ryuga';
    }
    return 'Akira';
  }

  resetFighterForRound(fighter) {
    fighter.health = Math.round(fighter.maxHealth * this.roundStartHealthFraction);
    fighter.stamina = fighter.maxStamina;
    fighter.isAttacking = false;
    fighter.currentAttackType = null;
    fighter.isBlocking = false;
    fighter.isDodging = false;
    fighter.isStaggered = false;
    fighter.isKnockedOut = false;
    fighter.isClinching = false;
    fighter.isSpecialActive = false;

    if (fighter.boxer) {
      fighter.boxer.clearFlash();
      fighter.boxer.setOpacity(1);
    }
    if (typeof fighter.clearTint === 'function') {
      fighter.clearTint();
    }
  }
}
