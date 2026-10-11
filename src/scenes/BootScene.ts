import Phaser from 'phaser';
import { loadFonts } from '../lib/ui';

const A = 'assets/audio/';

// Loads everything, then shows the title. A click or tap is needed anyway to unlock browser audio.
export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload(): void {
    const { width, height } = this.scale;
    const bar = this.add.rectangle(width / 2 - 120, height / 2, 0, 8, 0xffd27a).setOrigin(0, 0.5);
    this.add.rectangle(width / 2, height / 2, 244, 12).setStrokeStyle(1, 0x4a5c99);
    this.load.on('progress', (p: number) => { bar.width = 240 * p; });

    this.load.spritesheet('tiles', 'assets/art/tiles.png', { frameWidth: 18, frameHeight: 18 });
    this.load.spritesheet('chars', 'assets/art/characters.png', { frameWidth: 24, frameHeight: 24 });
    for (const k of ['phaseJump1', 'powerUp3', 'powerUp7', 'lowDown', 'phaserDown2', 'pepSound2',
      'footstep_snow_000', 'footstep_snow_001', 'footstep_snow_002', 'impactBell_heavy_000',
      'impactSoft_medium_000', 'impactSoft_medium_001', 'impactMetal_light_000']) this.load.audio(k, `${A}${k}.ogg`);
    this.load.audio('music', `${A}music-snow.ogg`);
    this.load.audio('wind', `${A}wind.mp3`);
  }

  create(): void {
    const a = this.anims;
    a.create({ key: 'hero-idle', frames: [{ key: 'chars', frame: 6 }], frameRate: 1 });
    a.create({ key: 'hero-walk', frames: [{ key: 'chars', frame: 6 }, { key: 'chars', frame: 7 }], frameRate: 8, repeat: -1 });
    a.create({ key: 'hero-air', frames: [{ key: 'chars', frame: 7 }], frameRate: 1 });
    a.create({ key: 'spiker', frames: [15, 16, 17].map((frame) => ({ key: 'chars', frame })), frameRate: 6, repeat: -1 });
    a.create({ key: 'slug', frames: [18, 19, 20].map((frame) => ({ key: 'chars', frame })), frameRate: 5, repeat: -1 });
    a.create({ key: 'bat', frames: [24, 25, 26].map((frame) => ({ key: 'chars', frame })), frameRate: 8, repeat: -1 });

    // Text drawn before the fonts arrive would use the fallback, so wait for them.
    void loadFonts().then(() => this.scene.start('Title'));
  }
}
