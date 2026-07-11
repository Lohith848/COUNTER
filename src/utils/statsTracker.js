// Single source of truth for aggregate fight statistics.
// Both fighters reference the `player` / `opponent` sub-objects exposed here,
// so there is exactly one object describing punches thrown/landed/accuracy/etc.

function blankStats() {
  return {
    thrown: 0,
    landed: 0,
    jabs: 0,        // landed jabs
    hooks: 0,        // landed hooks
    uppercuts: 0,    // landed uppercuts
    blocks: 0,
    dodges: 0
  };
}

export default class StatsTracker {
  constructor() {
    this.player = blankStats();
    this.opponent = blankStats();
  }

  // Called from Fighter.punch when a punch is committed.
  recordThrown(fighterKey) {
    this[fighterKey].thrown++;
  }

  // Called from FightScene.checkPunchHit when a punch actually connects.
  recordLanded(fighterKey, type) {
    this[fighterKey].landed++;
    if (type === 'jab') this[fighterKey].jabs++;
    else if (type === 'hook') this[fighterKey].hooks++;
    else if (type === 'uppercut') this[fighterKey].uppercuts++;
  }

  recordBlock(fighterKey) {
    this[fighterKey].blocks++;
  }

  recordDodge(fighterKey) {
    this[fighterKey].dodges++;
  }

  // Accuracy is clamped to 100% so a partial-landed-punch rounding artifact
  // can never produce an "impossible" percentage on the result screen.
  accuracy(fighterKey) {
    const s = this[fighterKey];
    if (s.thrown <= 0) return 0;
    const pct = (s.landed / s.thrown) * 100;
    return Math.max(0, Math.min(100, Math.round(pct)));
  }

  // Plain snapshot for the result screen.
  snapshot() {
    return {
      player: { ...this.player },
      opponent: { ...this.opponent }
    };
  }
}
