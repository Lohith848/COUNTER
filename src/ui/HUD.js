import Phaser from 'phaser';

const AKIRA_COLOR = 0x00ff88;
const RYUGA_COLOR = 0xff0055;
const STAMINA_COLOR = 0x2f9bff;
const BAR_W = 440;
const BAR_H = 22;
const STAM_H = 8;
const SEGMENTS = 22;
const SEG_GAP = 2;
const R_OFFSET = 5;

// Linear interpolate between two 0xRRGGBB colors.
function lerpColor(a, b, t) {
  const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
  const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | bl;
}

// Health color: green -> yellow (50%) -> red (0%).
function healthColor(frac) {
  if (frac > 0.5) {
    return lerpColor(0xffcc00, AKIRA_COLOR, (frac - 0.5) / 0.5);
  }
  return lerpColor(RYUGA_COLOR, 0xffcc00, frac / 0.5);
}

export default class HUD {
  constructor(scene) {
    this.scene = scene;
    const width = scene.cameras.main.width;

    this.graphics = scene.add.graphics();
    this.graphics.setScrollFactor(0);
    this.graphics.setDepth(50);

    // --- NAME PLATES (always upright, never flipped with the sprite) ---
    this.playerLabel = scene.add.text(40, 18, 'AKIRA', {
      fontFamily: '"Press Start 2P"', fontSize: '14px',
      color: '#00ff88', stroke: '#000000', strokeThickness: 4
    }).setScrollFactor(0).setDepth(51);

    this.opponentLabel = scene.add.text(width - 40, 18, 'RYUGA', {
      fontFamily: '"Press Start 2P"', fontSize: '14px',
      color: '#ff0055', stroke: '#000000', strokeThickness: 4
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(51);

    // --- TIMER + ROUND LABEL (center top) ---
    this.timerText = scene.add.text(width / 2, 26, '90', {
      fontFamily: '"Press Start 2P"', fontSize: '30px',
      color: '#ffffff', stroke: '#000000', strokeThickness: 6
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51);

    this.roundText = scene.add.text(width / 2, 70, 'ROUND 1', {
      fontFamily: '"Outfit"', fontSize: '15px', fontWeight: 'bold',
      color: '#66fcf1', letterSpacing: '2px'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51);

    // --- COMBO COUNTERS (bold number + scale-pop) ---
    this.comboPlayer = scene.add.text(40, 100, '', {
      fontFamily: '"Outfit"', fontSize: '30px', fontWeight: '900',
      color: '#00ff88', stroke: '#000000', strokeThickness: 5
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(52).setAlpha(0);

    this.comboOpponent = scene.add.text(width - 40, 100, '', {
      fontFamily: '"Outfit"', fontSize: '30px', fontWeight: '900',
      color: '#ff0055', stroke: '#000000', strokeThickness: 5
    }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(52).setAlpha(0);

    // --- ROUND RESULT PIPS ---
    this.roundResults = [];

    // Damage-trail values (in health units) that drain down to current health.
    this.playerTrail = 100;
    this.opponentTrail = 100;
    this.comboTimers = { player: null, opponent: null };

    this.draw();
  }

  // --- PER-FRAME UPDATE ---
  update(player, opponent, timeRemaining, delta = 16) {
    const drain = (80 * delta) / 1000;
    if (this.playerTrail > player.health) {
      this.playerTrail = Math.max(player.health, this.playerTrail - drain);
    } else {
      this.playerTrail = player.health;
    }
    if (this.opponentTrail > opponent.health) {
      this.opponentTrail = Math.max(opponent.health, this.opponentTrail - drain);
    } else {
      this.opponentTrail = opponent.health;
    }

    const t = Math.ceil(timeRemaining);
    this.timerText.setText(t.toString());
    if (timeRemaining <= 10) {
      this.timerText.setColor('#ff4444');
      this.timerText.setScale(1 + Math.sin(Date.now() * 0.012) * 0.08);
    } else {
      this.timerText.setColor('#ffffff');
      this.timerText.setScale(1);
    }

    this.draw(player, opponent);
  }

  // --- DRAW ALL BARS / PIPS ---
  draw(player = { health: 100, stamina: 100, maxHealth: 100 },
       opponent = { health: 100, stamina: 100, maxHealth: 100 }) {
    this.graphics.clear();
    const width = this.scene.cameras.main.width;

    const pFrac = Phaser.Math.Clamp(player.health / player.maxHealth, 0, 1);
    const oFrac = Phaser.Math.Clamp(opponent.health / opponent.maxHealth, 0, 1);
    const pStam = Phaser.Math.Clamp(player.stamina / 100, 0, 1);
    const oStam = Phaser.Math.Clamp(opponent.stamina / 100, 0, 1);
    this._curPlayerFrac = pFrac;
    this._curOppFrac = oFrac;

    // PLAYER (left side) — both bars use the SAME drawHealthBar() so colors/fill match.
    this.drawBarShell(40, 44, BAR_W, BAR_H, R_OFFSET);
    this.drawDamageTrail(40, 44, BAR_W, BAR_H, pFrac, this.playerTrail / 100);
    this.drawHealthBar(this, 40, 44, pFrac, healthColor(pFrac));

    this.drawBarShell(40, 70, BAR_W, STAM_H, 3);
    this.drawPlainBar(40, 70, BAR_W, STAM_H, pStam, STAMINA_COLOR, 'left');

    // OPPONENT (right side) — same shared function, mirrored position only.
    const oppX = width - 40 - BAR_W;
    this.drawBarShell(oppX, 44, BAR_W, BAR_H, R_OFFSET);
    this.drawDamageTrail(oppX, 44, BAR_W, BAR_H, oFrac, this.opponentTrail / 100);
    this.drawHealthBar(this, oppX, 44, oFrac, healthColor(oFrac));

    this.drawBarShell(oppX, 70, BAR_W, STAM_H, 3);
    this.drawPlainBar(oppX, 70, BAR_W, STAM_H, oStam, STAMINA_COLOR, 'right');

    this.drawPips(width);
  }

  // Dark shell behind a bar.
  drawBarShell(x, y, w, h, r) {
    this.graphics.fillStyle(0x05060a, 0.75);
    this.graphics.fillRoundedRect(x, y, w, h, r);
    this.graphics.lineStyle(2, 0xffffff, 0.12);
    this.graphics.strokeRoundedRect(x, y, w, h, r);
  }

  // White "damage trail": briefly shows where health just was, draining to new health.
  // Left-anchored (fill grows rightward) so it matches drawHealthBar() for both fighters.
  drawDamageTrail(x, y, w, h, curFrac, trailFrac) {
    curFrac = Phaser.Math.Clamp(curFrac, 0, 1);
    trailFrac = Phaser.Math.Clamp(trailFrac, 0, 1);
    const top = Math.max(curFrac, trailFrac);
    const bot = Math.min(curFrac, trailFrac);
    if (top - bot <= 0.001) return;
    this.graphics.fillStyle(0xffffff, 0.55);
    const sx = x + w * bot;
    this.graphics.fillRoundedRect(sx, y, w * (top - bot), h, R_OFFSET);
  }

  // Shared health-bar renderer used for BOTH fighters (consistent colors/fill).
  // Draws a segmented boxing-meter bar of standard size at (x, y) filling
  // left-to-right by `pct` using the provided `color`.
  drawHealthBar(scene, x, y, pct, color) {
    pct = Phaser.Math.Clamp(pct, 0, 1);
    const segW = (BAR_W - SEG_GAP * (SEGMENTS - 1)) / SEGMENTS;
    scene.graphics.fillStyle(color, 1);

    for (let i = 0; i < SEGMENTS; i++) {
      const fill = Phaser.Math.Clamp(pct * SEGMENTS - i, 0, 1);
      if (fill <= 0) break;
      const segX = x + i * (segW + SEG_GAP);
      scene.graphics.fillRoundedRect(segX, y, segW * fill, BAR_H, 2);
    }
  }

  // Plain (stamina) bar.
  drawPlainBar(x, y, w, h, frac, color, align) {
    frac = Phaser.Math.Clamp(frac, 0, 1);
    if (frac <= 0) return;
    const fillW = w * frac;
    this.graphics.fillStyle(color, 1);
    if (align === 'left') {
      this.graphics.fillRoundedRect(x, y, fillW, h, 3);
    } else {
      this.graphics.fillRoundedRect(x + w - fillW, y, fillW, h, 3);
    }
  }

  // Three round pips at top-center, filled with the winner color of each round.
  drawPips(width) {
    const pipR = 9;
    const gap = 34;
    const startX = width / 2 - gap;
    const y = 104;

    for (let i = 0; i < 3; i++) {
      const cx = startX + i * gap;
      this.graphics.fillStyle(0x05060a, 0.85);
      this.graphics.fillCircle(cx, y, pipR + 2);
      this.graphics.lineStyle(2, 0x445566, 0.9);
      this.graphics.strokeCircle(cx, y, pipR + 2);

      const res = this.roundResults[i];
      if (res) {
        const color = res.winner === 'Akira' ? AKIRA_COLOR : RYUGA_COLOR;
        this.graphics.fillStyle(color, 1);
        this.graphics.fillCircle(cx, y, pipR);
        this.graphics.lineStyle(2, 0xffffff, 0.5);
        this.graphics.strokeCircle(cx, y, pipR);
      }
    }
  }

  updateRoundPips(roundResults) {
    this.roundResults = roundResults || [];
  }

  // Pop a bold combo number; auto-fades shortly after.
  showCombo(side, count) {
    if (count < 2) return;
    const txt = side === 'player' ? this.comboPlayer : this.comboOpponent;
    txt.setText('x' + count);
    txt.setAlpha(1);
    txt.setScale(0.6);
    this.scene.tweens.add({
      targets: txt, scale: 1.25, duration: 120, yoyo: true, ease: 'Back.easeOut'
    });

    if (this.comboTimers[side]) this.comboTimers[side].remove();
    this.comboTimers[side] = this.scene.time.delayedCall(900, () => {
      this.scene.tweens.add({ targets: txt, alpha: 0, duration: 300 });
    });
  }

  setRoundText(round) {
    let modeText = 'APPRENTICE';
    if (round === 2) modeText = 'ADAPTIVE';
    if (round === 3) modeText = 'CHAMPION';
    this.roundText.setText(`ROUND ${round} - ${modeText}`);
  }

  destroy() {
    this.graphics.destroy();
    this.playerLabel.destroy();
    this.opponentLabel.destroy();
    this.timerText.destroy();
    this.roundText.destroy();
    this.comboPlayer.destroy();
    this.comboOpponent.destroy();
    if (this.comboTimers.player) this.comboTimers.player.remove();
    if (this.comboTimers.opponent) this.comboTimers.opponent.remove();
  }
}
