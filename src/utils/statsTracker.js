/**
 * StatsTracker — Single source of truth for fight statistics.
 * Tracks punches thrown, landed (jabs, hooks, uppercuts, specials), blocks, and dodges.
 */

function blankStats() {
  return {
    thrown: 0,
    landed: 0,
    jabs: 0,
    hooks: 0,
    uppercuts: 0,
    specials: 0,
    blocks: 0,
    dodges: 0
  };
}

export default class StatsTracker {
  constructor() {
    this.player = blankStats();
    this.opponent = blankStats();
  }

  recordThrown(fighterKey) {
    this[fighterKey].thrown++;
  }

  recordLanded(fighterKey, type) {
    this[fighterKey].landed++;
    if (type === 'jab') this[fighterKey].jabs++;
    else if (type === 'hook') this[fighterKey].hooks++;
    else if (type === 'uppercut') this[fighterKey].uppercuts++;
    else if (type === 'special') this[fighterKey].specials++;
  }

  recordBlock(fighterKey) {
    this[fighterKey].blocks++;
  }

  recordDodge(fighterKey) {
    this[fighterKey].dodges++;
  }

  accuracy(fighterKey) {
    const s = this[fighterKey];
    if (s.thrown <= 0) return 0;
    const pct = (s.landed / s.thrown) * 100;
    return Math.max(0, Math.min(100, Math.round(pct)));
  }

  snapshot() {
    return {
      player: { ...this.player },
      opponent: { ...this.opponent }
    };
  }
}
