import Phaser from 'phaser';
import { C } from '../lib/palette';

// Placeholder: a square you move with arrows/WASD. Replace once the limitation drops.
export class GameScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;

  constructor() { super('Game'); }

  create(): void {
    const { width, height } = this.scale;
    this.player = this.add.rectangle(width / 2, height / 2, 32, 32, C.leaf);
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT') as typeof this.keys;
  }

  update(_t: number, dt: number): void {
    const k = this.keys, s = 0.3 * dt;
    if (k.A.isDown || k.LEFT.isDown) this.player.x -= s;
    if (k.D.isDown || k.RIGHT.isDown) this.player.x += s;
    if (k.W.isDown || k.UP.isDown) this.player.y -= s;
    if (k.S.isDown || k.DOWN.isDown) this.player.y += s;
  }
}
