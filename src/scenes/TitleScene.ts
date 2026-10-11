import Phaser from 'phaser';
import { makeGlow, makeGrain, makeSky, makeVignette, rng } from '../lib/atmosphere';
import { makeDot, makeDisc, makePines, makeRibbon, makeRidge } from '../lib/scenery';
import { FONT_BODY, FONT_TITLE } from '../lib/ui';

const W = 960, H = 540;

// The welcome page: a still night above Emberfall, the story in two lines, and a way in.
export class TitleScene extends Phaser.Scene {
  private far!: Phaser.GameObjects.TileSprite;
  private near!: Phaser.GameObjects.TileSprite;
  private pines!: Phaser.GameObjects.TileSprite;
  private grain!: Phaser.GameObjects.TileSprite;
  private ribbons: { img: Phaser.GameObjects.Image; phase: number; x: number }[] = [];
  private help!: Phaser.GameObjects.Container;
  private starting = false;

  constructor() { super('Title'); }

  create(): void {
    this.starting = false; this.ribbons = [];
    makeDot(this); makeGlow(this, 'glow', 256); makeVignette(this, 'vignette', W, H); makeGrain(this, 'grain');
    makeSky(this, 'sky-title', W, H, '#080c26', '#1d2a5a');
    makeDisc(this, 'moon', 26, '#e6ecff', '#c3cdf0');
    makeRidge(this, 'ridge-title-far', W, H, { base: 230, amp: 160, body: '#3a5090', snow: '#8aa0dc', waves: [[2, 1, 0.3], [3, 0.7, 1.9], [5, 0.4, 4.1]] });
    makeRidge(this, 'ridge-title-near', W, H, { base: 120, amp: 130, body: '#0b1230', snow: '#2b3d74', waves: [[3, 1, 2.2], [4, 0.6, 0.7], [7, 0.35, 3.3]] });
    makePines(this, 'pines-title', W, H, '#060a1c', 21);
    makeRibbon(this, 'ribbon', 140, 380);

    this.add.image(0, 0, 'sky-title').setOrigin(0, 0);
    const r = rng(3);
    for (let i = 0; i < 110; i++) {
      const s = this.add.image(r() * W, r() * H * 0.62, 'dot').setAlpha(0.2 + r() * 0.7).setScale(0.5 + r() * 0.7);
      this.tweens.add({ targets: s, alpha: 0.1, yoyo: true, repeat: -1, duration: 900 + r() * 1800, delay: r() * 1500 });
    }
    // aurora: a few tall ribbons that sway slowly
    for (const [x, tint, a] of [[180, 0x4fe0b0, 0.22], [420, 0x8f7aff, 0.2], [700, 0x4fd0e8, 0.22], [880, 0x70f0a0, 0.16]] as const) {
      const img = this.add.image(x, 130, 'ribbon').setTint(tint).setAlpha(a).setScale(2.2, 1.4).setBlendMode(Phaser.BlendModes.ADD);
      this.ribbons.push({ img, phase: r() * 10, x });
    }
    this.add.image(W * 0.78, 100, 'glow').setScale(3.4).setTint(0x4a62b8).setAlpha(0.3).setBlendMode(Phaser.BlendModes.ADD);
    this.add.image(W * 0.78, 100, 'moon');
    this.far = this.add.tileSprite(0, 0, W, H, 'ridge-title-far').setOrigin(0, 0);
    this.near = this.add.tileSprite(0, 0, W, H, 'ridge-title-near').setOrigin(0, 0);
    this.pines = this.add.tileSprite(0, 0, W, H, 'pines-title').setOrigin(0, 0).setAlpha(0.95);

    // A snowy ledge with a lit lantern and the hero standing next to it.
    for (let x = 0; x < W; x += 36) this.add.image(x, H - 54, 'tiles', 81 + ((x / 36) % 2)).setOrigin(0, 0).setScale(2);
    for (let x = 0; x < W; x += 36) for (let y = H - 18; y < H; y += 36) this.add.image(x, y, 'tiles', 4).setOrigin(0, 0).setScale(2).setTint(0x7080a8);
    this.add.image(250, H - 54, 'glow').setScale(4).setTint(0xffc46a).setAlpha(0.6).setBlendMode(Phaser.BlendModes.ADD);
    this.add.image(250, H - 54, 'tiles', 129).setOrigin(0.5, 1).setScale(2.5).setTint(0xffe9b0);
    const hero = this.add.sprite(190, H - 54, 'chars', 6).setOrigin(0.5, 1).setScale(3).play('hero-idle');
    this.tweens.add({ targets: hero, y: H - 57, yoyo: true, repeat: -1, duration: 900, ease: 'Sine.easeInOut' });
    this.add.image(190, H - 90, 'glow').setScale(1.5).setTint(0xffd9a8).setAlpha(0.35).setBlendMode(Phaser.BlendModes.ADD);
    this.add.rectangle(0, 0, W, H, 0x6a7ab0).setOrigin(0, 0).setBlendMode(Phaser.BlendModes.MULTIPLY).setAlpha(0.5);

    this.add.particles(0, 0, 'dot', {
      x: { min: 0, max: W }, y: -10, lifespan: 8000, speedY: { min: 30, max: 80 }, speedX: { min: -30, max: -8 },
      scale: { min: 1, max: 2.4 }, alpha: { min: 0.4, max: 0.9 }, frequency: 60,
    });

    this.add.image(0, 0, 'vignette').setOrigin(0, 0);
    this.grain = this.add.tileSprite(0, 0, W, H, 'grain').setOrigin(0, 0).setAlpha(0.25);

    // Title and story.
    this.add.text(W / 2 + 2, 82, 'STAYING WARM', { fontFamily: FONT_TITLE, fontSize: '54px', color: '#2a1608' }).setOrigin(0.5);
    const title = this.add.text(W / 2, 80, 'STAYING WARM', { fontFamily: FONT_TITLE, fontSize: '54px', color: '#ffd27a' }).setOrigin(0.5);
    this.tweens.add({ targets: title, alpha: 0.82, yoyo: true, repeat: -1, duration: 1400, ease: 'Sine.easeInOut' });
    this.add.text(W / 2, 134, 'A lamplighter\'s climb', { fontFamily: FONT_BODY, fontSize: '28px', color: '#b9c6ee', fontStyle: 'italic' }).setOrigin(0.5);
    this.add.text(W / 2, 192, 'The frost came early to Emberfall, and the Great Hearth went out.\nClimb Mount Hollow, light every lantern on the way,\nand carry a spark of warmth to the top.', {
      fontFamily: FONT_BODY, fontSize: '25px', color: '#dfe8ff', align: 'center', lineSpacing: 6,
    }).setOrigin(0.5, 0);

    const begin = this.add.text(W / 2, 330, '[ Begin ]', { fontFamily: FONT_TITLE, fontSize: '29px', color: '#ffffff' })
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.tweens.add({ targets: begin, scale: 1.06, yoyo: true, repeat: -1, duration: 700, ease: 'Sine.easeInOut' });
    begin.on('pointerover', () => begin.setColor('#ffd27a')).on('pointerout', () => begin.setColor('#ffffff'));
    begin.on('pointerdown', () => this.start());
    const how = this.add.text(W / 2, 384, 'how to play', { fontFamily: FONT_BODY, fontSize: '28px', color: '#9db8ff' })
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    how.on('pointerdown', () => this.help.setVisible(!this.help.visible));
    this.add.text(W / 2, 414, 'press Enter or Space to begin   M to mute', { fontFamily: FONT_BODY, fontSize: '19px', color: '#6f7fae' }).setOrigin(0.5);

    const panel = this.add.rectangle(W / 2, 270, 560, 230, 0x080d1c, 0.95).setStrokeStyle(2, 0x4a5c99);
    const text = this.add.text(W / 2, 270,
      'A / D or arrow keys   walk\nSpace, W or Z   jump (hold for higher)\n\nYour warmth drains all the time, and fast in cold wind.\nStand near a lit lantern to warm up.\nWalk a spark up to a lantern to light it.\nLight every lantern to open the door.\nLand on slugs. Avoid spikes and bats.\n\nPhone or tablet: use the on-screen buttons.',
      { fontFamily: FONT_BODY, fontSize: '23px', color: '#e8eefc', align: 'center', lineSpacing: 4 }).setOrigin(0.5);
    const close = this.add.text(W / 2 + 255, 168, 'x', { fontFamily: FONT_BODY, fontSize: '31px', color: '#ffd27a' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    close.on('pointerdown', () => this.help.setVisible(false));
    this.help = this.add.container(0, 0, [panel, text, close]).setDepth(20).setVisible(false);

    this.add.text(W / 2, H - 14,
      'Art, fonts & sound: Kenney (CC0)   Music: "Snow Theme" by CleytonKauffman (CC0)   Wind: gerardogc2378 (CC0)', {
        fontFamily: FONT_BODY, fontSize: '17px', color: '#7f8fc0',
      }).setOrigin(0.5);

    const kb = this.input.keyboard!;
    kb.once('keydown-ENTER', () => this.start());
    kb.once('keydown-SPACE', () => this.start());
    kb.on('keydown-M', () => { this.sound.mute = !this.sound.mute; });
    this.cameras.main.fadeIn(900, 0, 0, 0);
  }

  private start(): void {
    if (this.starting) return;
    this.starting = true;
    this.sound.play('powerUp3', { volume: 0.3 });
    this.cameras.main.fadeOut(700, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Game', { level: 0, prologue: true }));
  }

  update(time: number, dt: number): void {
    this.far.tilePositionX += dt * 0.006;
    this.near.tilePositionX += dt * 0.012;
    this.pines.tilePositionX += dt * 0.02;
    for (const r of this.ribbons) {
      r.img.x = r.x + Math.sin(time * 0.0003 + r.phase) * 40;
      r.img.setScale(2.2 + Math.sin(time * 0.0006 + r.phase) * 0.5, 1.4 + Math.sin(time * 0.0004 + r.phase) * 0.2);
    }
    if (Math.floor(time / 50) !== Math.floor((time - dt) / 50)) {
      this.grain.tilePositionX = Math.floor(Math.random() * 128);
      this.grain.tilePositionY = Math.floor(Math.random() * 128);
    }
  }
}
