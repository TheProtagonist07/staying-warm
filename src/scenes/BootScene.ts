import Phaser from 'phaser';
import { makeHero } from '../lib/hero';
import { C, hex } from '../lib/palette';
import { sfx } from '../lib/sfx';

// Title screen. A click/tap is required anyway to unlock browser audio.
export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  create(): void {
    const { width, height } = this.scale;
    makeHero(this);
    this.add.sprite(width / 2, height / 2 - 90, 'hero', 0).setOrigin(0.5, 1).setScale(8).play('hero-idle');
    this.add.text(width / 2, height / 2 - 40, 'LOOK PROTOTYPE', {
      fontFamily: 'monospace', fontSize: '48px', color: hex(C.gold),
    }).setOrigin(0.5);
    this.add.text(width / 2, height / 2 + 30, 'click / tap to start', {
      fontFamily: 'monospace', fontSize: '20px', color: hex(C.cream),
    }).setOrigin(0.5);
    this.input.once('pointerdown', () => { sfx.pickup(); this.scene.start('Game'); });
  }
}
