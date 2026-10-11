import Phaser from 'phaser';
import { makeGlow, makeGrain, makeSky, makeVignette, rng } from '../lib/atmosphere';
import { makeDot, makeRibbon } from '../lib/scenery';
import { THANKS } from '../lib/story';

const W = 960, H = 540;

// The last page: dawn over Emberfall, the numbers, and the thanks.
export class EndScene extends Phaser.Scene {
  private ribbons: { img: Phaser.GameObjects.Image; phase: number; x: number }[] = [];
  private grain!: Phaser.GameObjects.TileSprite;
  private canLeave = false;

  constructor() { super('End'); }

  create(): void {
    this.ribbons = []; this.canLeave = false;
    makeDot(this); makeGlow(this, 'glow', 256); makeVignette(this, 'vignette', W, H); makeGrain(this, 'grain'); makeRibbon(this, 'ribbon', 140, 380);
    makeSky(this, 'sky-end', W, H, '#1a1440', '#e8884a');
    this.add.image(0, 0, 'sky-end').setOrigin(0, 0);
    const r = rng(9);
    for (let i = 0; i < 70; i++) this.add.image(r() * W, r() * H * 0.45, 'dot').setAlpha(0.15 + r() * 0.5).setScale(0.5 + r() * 0.6);
    for (const [x, tint] of [[200, 0xffb070], [480, 0xff9ac0], [760, 0xffd27a]] as const) {
      this.ribbons.push({ img: this.add.image(x, 160, 'ribbon').setTint(tint).setAlpha(0.2).setScale(2.4, 1.3).setBlendMode(Phaser.BlendModes.ADD), phase: r() * 10, x });
    }
    this.add.image(W / 2, H - 60, 'glow').setScale(9).setTint(0xffc46a).setAlpha(0.5).setBlendMode(Phaser.BlendModes.ADD);

    // The valley below: rows of little houses and a lantern line climbing the hill.
    for (let x = 0; x < W; x += 36) this.add.image(x, H - 36, 'tiles', 81 + ((x / 36) % 2)).setOrigin(0, 0).setScale(2).setTint(0xffe0c0);
    for (let x = 0; x < W; x += 36) this.add.image(x, H - 4, 'tiles', 4).setOrigin(0, 0).setScale(2).setTint(0x8a6a60);
    for (let i = 0; i < 12; i++) {
      const x = 60 + i * 76, y = H - 36 - (i % 3) * 3;
      this.add.image(x, y, 'glow').setScale(1.4).setTint(0xffc46a).setAlpha(0.55).setBlendMode(Phaser.BlendModes.ADD);
      this.add.image(x, y, 'tiles', 129).setOrigin(0.5, 1).setScale(2).setTint(0xffe9b0);
    }
    this.add.particles(0, 0, 'dot', {
      x: { min: 0, max: W }, y: H - 40, lifespan: 2400, speedY: { min: -50, max: -20 }, speedX: { min: -12, max: 12 },
      scale: { min: 1, max: 2.2 }, alpha: { start: 0.9, end: 0 }, frequency: 90, tint: 0xffd27a, blendMode: 'ADD',
    });
    this.add.image(0, 0, 'vignette').setOrigin(0, 0);
    this.grain = this.add.tileSprite(0, 0, W, H, 'grain').setOrigin(0, 0).setAlpha(0.2);

    const s = (this.registry.get('stats') ?? { time: 0, gems: 0, freezes: 0, gemsTotal: 0 }) as
      { time: number; gems: number; freezes: number; gemsTotal: number };
    const secs = Math.round(s.time / 1000);
    this.add.text(W / 2, 90, 'THE END', { fontFamily: 'monospace', fontSize: '60px', color: '#fff1d6' }).setOrigin(0.5);
    this.add.text(W / 2, 150, 'Emberfall is warm again.', { fontFamily: 'monospace', fontSize: '22px', color: '#ffe0b0', fontStyle: 'italic' }).setOrigin(0.5);
    this.add.text(W / 2, 214,
      `time  ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}      star shards  ${s.gems} / ${s.gemsTotal}      times frozen  ${s.freezes}`, {
        fontFamily: 'monospace', fontSize: '17px', color: '#ffffff',
      }).setOrigin(0.5);
    this.add.text(W / 2, 262, `${THANKS}\n\nArt and sound effects: Kenney (CC0)\nMusic: "Snow Theme" by CleytonKauffman (CC0)\nWind: "Winter Wind" by gerardogc2378 (CC0)\nMade with Phaser 3. Mini Jam 221: Staying Warm.`, {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffe9d0', align: 'center', lineSpacing: 5,
    }).setOrigin(0.5, 0);
    const again = this.add.text(W / 2, H - 120, '[ play again ]', { fontFamily: 'monospace', fontSize: '24px', color: '#ffffff' })
      .setOrigin(0.5).setInteractive({ useHandCursor: true }).setAlpha(0);
    this.tweens.add({ targets: again, alpha: 1, delay: 1800, duration: 600, onComplete: () => { this.canLeave = true; } });
    again.on('pointerdown', () => this.leave());
    this.input.keyboard!.on('keydown-SPACE', () => this.leave());
    this.input.keyboard!.on('keydown-ENTER', () => this.leave());
    this.cameras.main.fadeIn(1500, 255, 240, 220);
  }

  private leave(): void {
    if (!this.canLeave) return;
    this.canLeave = false;
    this.sound.stopAll();
    this.cameras.main.fadeOut(600, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => { this.registry.remove('stats'); this.scene.start('Title'); });
  }

  update(time: number, dt: number): void {
    for (const r of this.ribbons) r.img.x = r.x + Math.sin(time * 0.0003 + r.phase) * 36;
    if (Math.floor(time / 50) !== Math.floor((time - dt) / 50)) {
      this.grain.tilePositionX = Math.floor(Math.random() * 128);
      this.grain.tilePositionY = Math.floor(Math.random() * 128);
    }
  }
}
