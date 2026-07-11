// Tracks the Best-of-3 match structure:
//   - each round is won by KO or by higher health % at time-out
//   - first fighter to win 2 rounds wins the match (2-0, or full 3 rounds 2-1)
//   - between rounds, health/stamina are reset (with optional carry-over)
//   - records a round-by-round result log for the result screen

export default class MatchController {
  constructor(scene, options = {}) {
    this.scene = scene;

    this.roundsToWin = options.roundsToWin ?? 2;   // best-of-3
    this.maxRounds = options.maxRounds ?? 3;

    // Fraction of max health a fighter starts each round with.
    // 1.0 = full reset (rounds independent). Use e.g. 0.7 to "wear them down".
    this.roundStartHealthFraction = options.roundStartHealthFraction ?? 1.0;

    this.currentRound = 1;
    this.roundWins = { player: 0, opponent: 0 };
    this.roundResults = []; // [{ round, winner:'Akira'|'Ryuga', method:'KO'|'DECISION' }]
  }

  // Award the just-finished round to a fighter and record the winning method.
  // Returns true if this result ends the match.
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

  // Advance to the next round. Returns the new round number.
  advanceRound() {
    this.currentRound++;
    return this.currentRound;
  }

  // Final match winner ('Akira' | 'Ryuga'). Resolves a 1-1-1 finish by round wins.
  getMatchWinner() {
    if (this.roundWins.player > this.roundWins.opponent) return 'Akira';
    if (this.roundWins.opponent > this.roundWins.player) return 'Ryuga';
    // Tie (e.g. 1-1 with a draw third) — fall back to aggregate landed punches.
    const stats = this.scene.stats;
    if (stats) {
      return stats.player.landed >= stats.opponent.landed ? 'Akira' : 'Ryuga';
    }
    return 'Akira';
  }

  // Reset a fighter's health/stamina for the start of a new round.
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
    fighter.angle = 0;
    fighter.alpha = 1;
    fighter.clearTint();
  }
}
