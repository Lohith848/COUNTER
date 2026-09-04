/**
 * HUD — 90s Retro Arcade Fighting Game HUD.
 * Features:
 * - Segmented glowing health bars with animated damage trail.
 * - Stamina gauges and glowing Super Meter bars ("SUPER READY!" pulse).
 * - Central 90s arcade round timer and round victory star pips.
 * - Dynamic combo counters with bouncy scaling.
 */

import Phaser from 'phaser';

const AKIRA_COLOR = 0x00ff88;
const RYUGA_COLOR = 0xff0055;
const STAMINA_COLOR = 0x2f9bff;
const SUPER_COLOR = 0x00ffff;
const SUPER_FULL_COLOR = 0xffcc00;

const BAR_W = 440;
const BAR_H = 22;
const STAM_H = 7;
const SUPER_W = 280;
const SUPER_H = 10;
const SEGMENTS = 22;
const SEG_GAP = 2;
const R_OFFSET = 5;

function lerpColor(a, b, t) {
  const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
  const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | bl;
}

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
    const height = scene.cameras.main.height;

    this.graphics = scene.add.graphics();
    this.graphics.setScrollFactor(0);
    this.graphics.setDepth(50);

    // --- FIGHTER LABELS ---
    this.playerLabel = scene.add.text(40, 16, 'AKIRA', {
      fontFamily: '"Press Start 2P"',
      fontSize: '15px',
      color: '#00ff88',
      stroke: '#000000',
      strokeThickness: 5,
      shadow: { color: '#00ff88', blur: 8, fill: true, stroke: true }
    }).setScrollFactor(0).setDepth(51);

    this.opponentLabel = scene.add.text(width - 40, 16, 'RYUGA', {
      fontFamily: '"Press Start 2P"',
      fontSize: '15px',
      color: '#ff0055',
      stroke: '#000000',
      strokeThickness: 5,
      shadow: { color: '#ff0055', blur: 8, fill: true, stroke: true }
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(51);

    // --- TIMER & ROUND BANNER ---
    this.timerText = scene.add.text(width / 2, 28, '90', {
      fontFamily: '"Press Start 2P"',
      fontSize: '32px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51);

    this.roundText = scene.add.text(width / 2, 72, 'ROUND 1', {
      fontFamily: '"Press Start 2P"',
      fontSize: '11px',
      color: '#66fcf1',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51);

    // --- SUPER METER LABELS ---
    this.superLabelPlayer = scene.add.text(40, height - 32, 'SUPER [U]', {
      fontFamily: '"Press Start 2P"',
      fontSize: '10px',
      color: '#66fcf1'
    }).setScrollFactor(0).setDepth(51);

    this.superLabelOpponent = scene.add.text(width - 40, height - 32, 'SUPER AI', {
      fontFamily: '"Press Start 2P"',
      fontSize: '10px',
      color: '#ff0055'
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(51);

    // --- COMBO POPUPS ---
    this.comboPlayer = scene.add.text(40, 106, '', {
      fontFamily: '"Press Start 2P"',
      fontSize: '18px',
      color: '#00ff88',
      stroke: '#000000',
      strokeThickness: 5
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(52).setAlpha(0);

    this.comboOpponent = scene.add.text(width - 40, 106, '', {
      fontFamily: '"Press Start 2P"',
      fontSize: '18px',
      color: '#ff0055',
      stroke: '#000000',
      strokeThickness: 5
    }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(52).setAlpha(0);

    this.roundResults = [];
    this.playerTrail = 100;
    this.opponentTrail = 100;
    this.animTick = 0;

    this.draw();
  }

  setRoundText(round) {
    const text = round === 3 ? 'FINAL ROUND' : `ROUND ${round}`;
    this.roundText.setText(text);
  }

  updateRoundPips(results = []) {
    this.roundResults = results.slice();
    this.draw();
  }

  showCombo(fighterKey, count) {
    const textObj = fighterKey === 'player' ? this.comboPlayer : this.comboOpponent;
    textObj.setText(`COMBO x${count}`);
    textObj.setAlpha(1);
    textObj.setScale(1.4);

    this.scene.tweens.killTweensOf(textObj);
    this.scene.tweens.add({
      targets: textObj,
      scale: 1.0,
      duration: 180,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.time.delayedCall(900, () => {
          this.scene.tweens.add({
            targets: textObj,
            alpha: 0,
            duration: 300
          });
        });
      }
    });
  }

  update(player, opponent, timeRemaining, delta = 16) {
    this.animTick += delta * 0.006;
    const drain = (70 * delta) / 1000;

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
      this.timerText.setColor('#ff2200');
      this.timerText.setScale(1 + Math.sin(Date.now() * 0.015) * 0.1);
    } else {
      this.timerText.setColor('#ffffff');
      this.timerText.setScale(1);
    }

    // Super Meter full pulsing indicator
    if (player.superMeter >= 100) {
      const pulse = Math.sin(this.animTick * 8) > 0;
      this.superLabelPlayer.setText(pulse ? '★ MAX READY! ★' : 'SUPER [U]');
      this.superLabelPlayer.setColor(pulse ? '#ffff00' : '#00ffff');
    } else {
      this.superLabelPlayer.setText(`SUPER ${Math.round(player.superMeter)}%`);
      this.superLabelPlayer.setColor('#66fcf1');
    }

    if (opponent.superMeter >= 100) {
      this.superLabelOpponent.setText('★ AI MAX! ★');
      this.superLabelOpponent.setColor('#ffcc00');
    } else {
      this.superLabelOpponent.setText(`AI ${Math.round(opponent.superMeter)}%`);
      this.superLabelOpponent.setColor('#ff0055');
    }

    this.draw(player, opponent);
  }

  draw(player = { health: 100, stamina: 100, superMeter: 0, maxHealth: 100 },
       opponent = { health: 100, stamina: 100, superMeter: 0, maxHealth: 100 }) {
    this.graphics.clear();
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    const pFrac = Phaser.Math.Clamp(player.health / player.maxHealth, 0, 1);
    const oFrac = Phaser.Math.Clamp(opponent.health / opponent.maxHealth, 0, 1);
    const pStam = Phaser.Math.Clamp(player.stamina / 100, 0, 1);
    const oStam = Phaser.Math.Clamp(opponent.stamina / 100, 0, 1);
    const pSuper = Phaser.Math.Clamp(player.superMeter / 100, 0, 1);
    const oSuper = Phaser.Math.Clamp(opponent.superMeter / 100, 0, 1);

    // --- PLAYER HEALTH & STAMINA (Top Left) ---
    this.drawBarShell(40, 42, BAR_W, BAR_H, R_OFFSET);
    this.drawDamageTrail(40, 42, BAR_W, BAR_H, pFrac, this.playerTrail / 100);
    this.drawHealthBar(40, 42, pFrac, healthColor(pFrac));

    this.drawBarShell(40, 68, BAR_W, STAM_H, 2);
    this.drawPlainBar(40, 68, BAR_W, STAM_H, pStam, STAMINA_COLOR, 'left');

    // --- OPPONENT HEALTH & STAMINA (Top Right) ---
    const oppX = width - 40 - BAR_W;
    this.drawBarShell(oppX, 42, BAR_W, BAR_H, R_OFFSET);
    this.drawDamageTrail(oppX, 42, BAR_W, BAR_H, oFrac, this.opponentTrail / 100);
    this.drawHealthBar(oppX, 42, oFrac, healthColor(oFrac));

    this.drawBarShell(oppX, 68, BAR_W, STAM_H, 2);
    this.drawPlainBar(oppX, 68, BAR_W, STAM_H, oStam, STAMINA_COLOR, 'right');

    // --- SUPER METERS (Bottom Corners) ---
    this.drawBarShell(40, height - 18, SUPER_W, SUPER_H, 3);
    this.drawPlainBar(40, height - 18, SUPER_W, SUPER_H, pSuper, pSuper >= 1.0 ? SUPER_FULL_COLOR : SUPER_COLOR, 'left');

    const oppSuperX = width - 40 - SUPER_W;
    this.drawBarShell(oppSuperX, height - 18, SUPER_W, SUPER_H, 3);
    this.drawPlainBar(oppSuperX, height - 18, SUPER_W, SUPER_H, oSuper, oSuper >= 1.0 ? SUPER_FULL_COLOR : 0xff3366, 'right');

    // --- ROUND VICTORY STARS / PIPS ---
    this.drawRoundPips(width / 2, 92);
  }

  drawBarShell(x, y, w, h, skew = 4) {
    const g = this.graphics;
    g.fillStyle(0x0a0e14, 0.88);
    g.beginPath();
    g.moveTo(x - skew, y);
    g.lineTo(x + w + skew, y);
    g.lineTo(x + w, y + h);
    g.lineTo(x, y + h);
    g.closePath();
    g.fill();

    g.lineStyle(2, 0xffffff, 0.25);
    g.strokePath();
  }

  drawDamageTrail(x, y, w, h, currentFrac, trailFrac) {
    if (trailFrac <= currentFrac) return;
    const g = this.graphics;
    const trailW = (trailFrac - currentFrac) * w;
    const startX = x + currentFrac * w;

    g.fillStyle(0xff3300, 0.85);
    g.fillRect(startX, y + 2, trailW, h - 4);
  }

  drawHealthBar(x, y, frac, color) {
    const g = this.graphics;
    const activeSegs = Math.ceil(frac * SEGMENTS);
    const segW = (BAR_W - (SEGMENTS - 1) * SEG_GAP) / SEGMENTS;

    for (let i = 0; i < activeSegs; i++) {
      const sx = x + i * (segW + SEG_GAP);
      g.fillStyle(color, 0.95);
      g.fillRect(sx, y + 2, segW, BAR_H - 4);

      // Top glossy highlight
      g.fillStyle(0xffffff, 0.3);
      g.fillRect(sx, y + 2, segW, 3);
    }
  }

  drawPlainBar(x, y, w, h, frac, color, align = 'left') {
    const g = this.graphics;
    const fillW = Math.max(0, w * frac);
    const startX = align === 'left' ? x : x + (w - fillW);

    g.fillStyle(color, 0.9);
    g.fillRect(startX, y + 1, fillW, h - 2);

    g.fillStyle(0xffffff, 0.25);
    g.fillRect(startX, y + 1, fillW, 2);
  }

  drawRoundPips(centerX, y) {
    const g = this.graphics;
    const pipSpacing = 28;

    // 3 round indicator stars (Left for Akira, Right for Ryuga)
    for (let i = 0; i < 3; i++) {
      const px = centerX - pipSpacing + i * pipSpacing;
      const res = this.roundResults[i];

      g.fillStyle(0x1a222e, 0.8);
      g.fillCircle(px, y, 6);

      if (res) {
        const isPlayer = res.winner === 'Akira';
        g.fillStyle(isPlayer ? AKIRA_COLOR : RYUGA_COLOR, 1);
        g.fillCircle(px, y, 5);

        // Glow ring
        g.lineStyle(2, isPlayer ? 0x00ff88 : 0xff0055, 0.7);
        g.strokeCircle(px, y, 7);
      } else {
        g.lineStyle(1, 0x445566, 0.5);
        g.strokeCircle(px, y, 6);
      }
    }
  }

  destroy() {
    this.graphics.destroy();
    this.playerLabel.destroy();
    this.opponentLabel.destroy();
    this.timerText.destroy();
    this.roundText.destroy();
    this.superLabelPlayer.destroy();
    this.superLabelOpponent.destroy();
    this.comboPlayer.destroy();
    this.comboOpponent.destroy();
  }
}
