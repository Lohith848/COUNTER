import Phaser from 'phaser';

export default class HUD {
  constructor(scene) {
    this.scene = scene;
    const width = scene.cameras.main.width;

    // Create HUD container/graphics
    this.graphics = scene.add.graphics();
    this.graphics.setScrollFactor(0);
    this.graphics.setDepth(50);

    // 1. Akira (Player) HUD Layout (Top-Left)
    this.playerLabel = scene.add.text(40, 20, 'AKIRA', {
      fontFamily: '"Press Start 2P"',
      fontSize: '14px',
      color: '#00ff88',
      stroke: '#000000',
      strokeThickness: 4
    }).setScrollFactor(0).setDepth(50);

    // 2. Ryuga (Opponent) HUD Layout (Top-Right)
    this.opponentLabel = scene.add.text(width - 40, 20, 'RYUGA', {
      fontFamily: '"Press Start 2P"',
      fontSize: '14px',
      color: '#ff0055',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(50);

    // 3. Round & Timer Layout (Center Top)
    this.timerText = scene.add.text(width / 2, 35, '90', {
      fontFamily: '"Press Start 2P"',
      fontSize: '32px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5).setScrollFactor(0).setDepth(50);

    this.roundText = scene.add.text(width / 2, 75, 'ROUND 1', {
      fontFamily: '"Outfit"',
      fontSize: '16px',
      color: '#66fcf1',
      fontWeight: 'bold',
      letterSpacing: '2px'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(50);

    // Catch-up health values for smooth visual draining
    this.playerCatchUpHealth = 100;
    this.opponentCatchUpHealth = 100;

    // Initial draw
    this.draw();
  }

  update(player, opponent, timeRemaining) {
    // Smoothly drain the catch-up health bar behind the actual health
    if (this.playerCatchUpHealth > player.health) {
      this.playerCatchUpHealth -= 0.4;
      if (this.playerCatchUpHealth < player.health) this.playerCatchUpHealth = player.health;
    } else {
      this.playerCatchUpHealth = player.health;
    }

    if (this.opponentCatchUpHealth > opponent.health) {
      this.opponentCatchUpHealth -= 0.4;
      if (this.opponentCatchUpHealth < opponent.health) this.opponentCatchUpHealth = opponent.health;
    } else {
      this.opponentCatchUpHealth = opponent.health;
    }

    // Update Timer Text
    this.timerText.setText(Math.ceil(timeRemaining).toString());
    
    // Alert color for low time
    if (timeRemaining <= 10) {
      this.timerText.setColor('#ff3333');
      // Subtle pulse
      const scale = 1 + Math.sin(Date.now() * 0.01) * 0.08;
      this.timerText.setScale(scale);
    } else {
      this.timerText.setColor('#ffffff');
      this.timerText.setScale(1.0);
    }

    // Redraw bars
    this.draw(player, opponent);
  }

  draw(player = { health: 100, stamina: 100 }, opponent = { health: 100, stamina: 100 }) {
    this.graphics.clear();
    const width = this.scene.cameras.main.width;

    const barW = 380;
    const barH = 20;
    const stamH = 8;
    const rOffset = 10; // Corner roundness

    // --- PLAYER BARS (Left) ---
    // Health Background
    this.graphics.fillStyle(0x1a1a1a, 0.7);
    this.graphics.fillRoundedRect(40, 45, barW, barH, rOffset);
    this.graphics.lineStyle(2, 0xffffff, 0.15);
    this.graphics.strokeRoundedRect(40, 45, barW, barH, rOffset);

    // Health Catch-up (Yellow damage bar)
    if (this.playerCatchUpHealth > 0) {
      const catchW = barW * (this.playerCatchUpHealth / 100);
      this.graphics.fillStyle(0xffaa00, 0.85);
      this.graphics.fillRoundedRect(40, 45, catchW, barH, rOffset);
    }

    // Health Actual (Green bar)
    if (player.health > 0) {
      const hpW = barW * (player.health / 100);
      // Blend green to orange for low health
      const hpColor = player.health > 35 ? 0x00ff88 : 0xff3300;
      this.graphics.fillStyle(hpColor, 1);
      this.graphics.fillRoundedRect(40, 45, hpW, barH, rOffset);
    }

    // Stamina Background
    this.graphics.fillStyle(0x1a1a1a, 0.7);
    this.graphics.fillRoundedRect(40, 70, barW, stamH, 4);
    
    // Stamina Actual (Gold bar)
    if (player.stamina > 0) {
      const stamW = barW * (player.stamina / 100);
      // Less stamina turns orange/yellow
      const stamColor = player.stamina > 25 ? 0xffcc00 : 0xff5500;
      this.graphics.fillStyle(stamColor, 1);
      this.graphics.fillRoundedRect(40, 70, stamW, stamH, 4);
    }

    // --- OPPONENT BARS (Right - Flipped layout) ---
    const opponentX = width - 40 - barW;
    
    // Health Background
    this.graphics.fillStyle(0x1a1a1a, 0.7);
    this.graphics.fillRoundedRect(opponentX, 45, barW, barH, rOffset);
    this.graphics.strokeRoundedRect(opponentX, 45, barW, barH, rOffset);

    // Health Catch-up (Yellow damage bar) - drains right to left
    if (this.opponentCatchUpHealth > 0) {
      const catchW = barW * (this.opponentCatchUpHealth / 100);
      const startX = opponentX + (barW - catchW);
      this.graphics.fillStyle(0xffaa00, 0.85);
      this.graphics.fillRoundedRect(startX, 45, catchW, barH, rOffset);
    }

    // Health Actual (Red bar) - drains right to left
    if (opponent.health > 0) {
      const hpW = barW * (opponent.health / 100);
      const startX = opponentX + (barW - hpW);
      const hpColor = opponent.health > 35 ? 0xff0055 : 0xff3300;
      this.graphics.fillStyle(hpColor, 1);
      this.graphics.fillRoundedRect(startX, 45, hpW, barH, rOffset);
    }

    // Stamina Background
    this.graphics.fillStyle(0x1a1a1a, 0.7);
    this.graphics.fillRoundedRect(opponentX, 70, barW, stamH, 4);

    // Stamina Actual (Gold bar) - drains right to left
    if (opponent.stamina > 0) {
      const stamW = barW * (opponent.stamina / 100);
      const startX = opponentX + (barW - stamW);
      const stamColor = opponent.stamina > 25 ? 0xffcc00 : 0xff5500;
      this.graphics.fillStyle(stamColor, 1);
      this.graphics.fillRoundedRect(startX, 70, stamW, stamH, 4);
    }
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
  }
}
