import Fighter3D from './Fighter3D.js';

/**
 * Opponent3D — the AI-controlled fighter. All behaviour (move / stop /
 * punch / block / dodge / clinch) is driven by the RyugaAI brain through the
 * base Fighter3D API, exactly like the original 2D Opponent sprite.
 */
export default class Opponent3D extends Fighter3D {
  constructor(scene, x, y, texture, stats) {
    super(scene, x, y, texture, stats);
    this.setFacing(-1);
  }

  update(time, delta) {
    super.update(time, delta);
  }
}
