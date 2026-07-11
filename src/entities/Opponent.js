import Fighter from './Fighter.js';
import Phaser from 'phaser';

export default class Opponent extends Fighter {
  constructor(scene, x, y, texture, stats) {
    super(scene, x, y, texture, 'Ryuga', stats);

    // Face left (towards player Akira)
    this.setFlipX(true);

    // Set opponent depth
    this.setDepth(10);
  }

  // AI-controlled movement
  move(vx, vy) {
    if (this.isKnockedOut || this.isStaggered || this.isBlocking || this.isAttacking || this.isDodging || this.isClinching) {
      return;
    }

    // Normalize if diagonal
    let dx = vx;
    let dy = vy;
    if (dx !== 0 && dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy);
      dx /= len;
      dy /= len;
    }

    // Set speed (reduced slightly when walking back/side to feel more realistic)
    let speedMult = 1.0;
    
    // Check if moving away from player
    const distToPlayerBefore = Phaser.Math.Distance.Between(
      this.x, this.y,
      this.scene.player.x, this.scene.player.y
    );
    const nextX = this.x + dx * this.speed * 0.016;
    const nextY = this.y + dy * this.speed * 0.016;
    const distToPlayerAfter = Phaser.Math.Distance.Between(
      nextX, nextY,
      this.scene.player.x, this.scene.player.y
    );
    
    if (distToPlayerAfter > distToPlayerBefore) {
      speedMult = 0.8; // Move backwards slightly slower
    }

    this.setVelocity(dx * this.speed * speedMult, dy * this.speed * speedMult);
  }

  stopMovement() {
    if (this.isKnockedOut) return;
    this.setVelocity(0, 0);
  }

  update(time, delta) {
    super.updateFighter(time, delta);
  }
}
