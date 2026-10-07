import Phaser from 'phaser';
import { C, hex } from '../lib/palette';
import { sfx } from '../lib/sfx';

// Title screen. A click/tap is required anyway to unlock browser audio.
export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  create(): void {
    const { width, height } = this.scale;
    this.add.text(width / 2, height / 2 - 40, 'TITLE GOES HERE', {
      fontFamily: 'monospace', fontSize: '48px', color: hex(C.gold),
    }).setOrigin(0.5);
    this.add.text(width / 2, height / 2 + 30, 'click / tap to start', {
      fontFamily: 'monospace', fontSize: '20px', color: hex(C.cream),
    }).setOrigin(0.5);
    this.input.once('pointerdown', () => { sfx.pickup(); this.scene.start('Game'); });
  }
}
