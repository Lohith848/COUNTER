import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import FightScene from './scenes/FightScene.js';
import ResultScene from './scenes/ResultScene.js';

const config = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: 'app',
  // Transparent canvas: the FightScene renders its 3D ring with Three.js in a
  // layer below this canvas (see index.html #three-layer), while menus, HUD,
  // floating texts and 2D effects paint on top of it.
  transparent: true,
  backgroundColor: 'rgba(0, 0, 0, 0)',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false // Set to true to inspect hitboxes if debugging
    }
  },
  scene: [BootScene, MenuScene, FightScene, ResultScene]
};

// Create the game instance
const game = new Phaser.Game(config);

// Debug/automation hook (harmless in production)
if (typeof window !== 'undefined') {
  window.__game = game;
}
