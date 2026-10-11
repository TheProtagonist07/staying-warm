import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { EndScene } from './scenes/EndScene';
import { GameScene } from './scenes/GameScene';
import { HearthScene } from './scenes/HearthScene';
import { PauseScene } from './scenes/PauseScene';
import { TitleScene } from './scenes/TitleScene';

// Fixed logical size, scaled to fit any screen. pixelArt keeps the scaled-up sprites crisp.
const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  width: 960,
  height: 540,
  backgroundColor: '#05070d',
  pixelArt: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 1300 } } },
  input: { activePointers: 3 },
  scene: [BootScene, TitleScene, GameScene, HearthScene, EndScene, PauseScene],
});

// Dev-only handle for poking the running game from the browser console.
if (import.meta.env.DEV) (window as unknown as { __game: Phaser.Game }).__game = game;
