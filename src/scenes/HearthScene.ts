import Phaser from 'phaser';
import { makeGlow, makeGrain, makeVignette, rng } from '../lib/atmosphere';
import { Dialog } from '../lib/dialog';
import { makeDot } from '../lib/scenery';
import { HEARTH_FINALE } from '../lib/story';
import { FONT_BODY, FONT_TITLE } from '../lib/ui';

const W = 960, H = 540;
const NEED = 18;            // embers to catch
const FLOOR = H - 70;       // where the hero stands

interface Faller { s: Phaser.GameObjects.Image; glow?: Phaser.GameObjects.Image; vy: number; kind: 'ember' | 'ice'; x: number; y: number }

/**
 * The last stage: a small catching game inside the summit chamber. The light of every lantern Wren lit
 * drifts down as embers. Catch enough to relight the Great Hearth, and dodge the falling ice.
 */
export class HearthScene extends Phaser.Scene {
  private hero!: Phaser.GameObjects.Sprite;
  private fallers: Faller[] = [];
  private caught = 0;
  private stun = 0;
  private spawnE = 0;
  private spawnI = 1500;
  private elapsed = 0;
  private done = false;
  private started = false;
  private hearthGlow!: Phaser.GameObjects.Image;
  private hearthFill!: Phaser.GameObjects.Image;
  private flame!: Phaser.GameObjects.Particles.ParticleEmitter;
  private bar!: Phaser.GameObjects.Graphics;
  private hint!: Phaser.GameObjects.Text;
  private dialog!: Dialog;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private touch = { left: false, right: false };
  private burstE!: Phaser.GameObjects.Particles.ParticleEmitter;
  private grain!: Phaser.GameObjects.TileSprite;
  private rand = Math.random;

  constructor() { super('Hearth'); }

  create(): void {
    this.fallers = []; this.caught = 0; this.stun = 0; this.spawnE = 0; this.spawnI = 1500; this.elapsed = 0;
    this.done = false; this.started = false; this.rand = rng(Date.now() & 0xffff);
    makeDot(this); makeGlow(this, 'glow', 256); makeVignette(this, 'vignette', W, H); makeGrain(this, 'grain');

    // The chamber: a dark stone wall and floor, with the Hearth set into it.
    this.add.rectangle(0, 0, W, H, 0x10142a).setOrigin(0, 0);
    for (let x = 0; x < W; x += 36) for (let y = 0; y < FLOOR; y += 36) {
      this.add.image(x, y, 'tiles', 4 + ((x / 36 + y / 36) % 2)).setOrigin(0, 0).setScale(2).setTint(0x4c5686);
    }
    for (let x = 0; x < W; x += 36) {
      this.add.image(x, FLOOR, 'tiles', 81 + ((x / 36) % 2)).setOrigin(0, 0).setScale(2).setTint(0xb0b8e0);
      this.add.image(x, FLOOR + 36, 'tiles', 4).setOrigin(0, 0).setScale(2).setTint(0x606890);
    }
    const g = this.add.graphics();
    g.fillStyle(0x5a6490, 1).fillRect(W / 2 - 170, 70, 340, 250);          // stone surround
    g.fillStyle(0x434c78, 1).fillRect(W / 2 - 190, 300, 380, 30);           // hearth stone
    g.fillStyle(0x07090f, 1).fillRect(W / 2 - 110, 130, 220, 170);          // the opening
    g.lineStyle(4, 0x59699f, 1).strokeRect(W / 2 - 170, 70, 340, 250);
    // The opening fills with warm light as the Hearth catches.
    if (!this.textures.exists('hearth-fill')) {
      const t = this.textures.createCanvas('hearth-fill', 220, 170)!;
      const c = t.getContext();
      const gr = c.createRadialGradient(110, 150, 6, 110, 150, 150);
      gr.addColorStop(0, 'rgba(255,210,120,1)'); gr.addColorStop(0.5, 'rgba(255,130,40,0.7)'); gr.addColorStop(1, 'rgba(120,30,10,0)');
      c.fillStyle = gr; c.fillRect(0, 0, 220, 170);
      t.refresh();
    }
    this.hearthFill = this.add.image(W / 2, 215, 'hearth-fill').setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
    this.hearthGlow = this.add.image(W / 2, 250, 'glow').setTint(0xffa040).setBlendMode(Phaser.BlendModes.ADD).setScale(0.3).setAlpha(0.1);
    this.flame = this.add.particles(W / 2, 285, 'dot', {
      x: { min: -60, max: 60 }, lifespan: { min: 500, max: 1100 }, speedY: { min: -120, max: -40 }, speedX: { min: -14, max: 14 },
      scale: { start: 5, end: 0 }, alpha: { start: 0.9, end: 0 }, tint: [0xffd27a, 0xff9a3c, 0xff6a2a], blendMode: 'ADD',
      frequency: 60, emitting: false,
    });

    this.hero = this.add.sprite(W / 2, FLOOR, 'chars', 6).setOrigin(0.5, 1).setScale(2).setDepth(5).play('hero-idle');
    this.burstE = this.add.particles(0, 0, 'dot', {
      lifespan: { min: 400, max: 900 }, speed: { min: 40, max: 150 }, angle: { min: 0, max: 360 },
      scale: { start: 3, end: 0 }, alpha: { start: 1, end: 0 }, blendMode: 'ADD', emitting: false,
    }).setDepth(9);

    // A little snow drifts in through the roof, as in the chapters before.
    this.add.particles(0, 0, 'dot', {
      x: { min: 0, max: W }, y: -10, lifespan: 7000, speedY: { min: 35, max: 85 }, speedX: { min: -25, max: -5 },
      scale: { min: 1, max: 2.2 }, alpha: { min: 0.3, max: 0.7 }, frequency: 120,
    }).setDepth(8);

    this.add.rectangle(0, 0, W, H, 0xa090c8).setOrigin(0, 0).setBlendMode(Phaser.BlendModes.MULTIPLY).setDepth(40);
    this.add.image(0, 0, 'vignette').setOrigin(0, 0).setDepth(50);
    this.grain = this.add.tileSprite(0, 0, W, H, 'grain').setOrigin(0, 0).setDepth(51).setAlpha(0.25);

    this.bar = this.add.graphics().setDepth(60);
    this.add.text(W / 2, 14, 'THE GREAT HEARTH', { fontFamily: FONT_TITLE, fontSize: '20px', color: '#ffd27a' }).setOrigin(0.5, 0).setDepth(60);
    this.hint = this.add.text(W / 2, 62, 'Catch the drifting light.  Dodge the ice.', {
      fontFamily: FONT_BODY, fontSize: '26px', color: '#ffffff', backgroundColor: '#0a1020cc', padding: { x: 10, y: 4 },
    }).setOrigin(0.5, 0).setDepth(60);

    this.keys = this.input.keyboard!.addKeys('A,D,LEFT,RIGHT,M') as typeof this.keys;
    if (this.sys.game.device.input.touch) {
      const btn = (x: number, label: string, key: 'left' | 'right') => {
        const b = this.add.rectangle(x, H - 70, 110, 96, 0xffffff, 0.14).setStrokeStyle(2, 0xffffff, 0.4).setDepth(70).setInteractive();
        this.add.text(x, H - 70, label, { fontFamily: FONT_TITLE, fontSize: '34px', color: '#ffffff' }).setOrigin(0.5).setDepth(71).setAlpha(0.8);
        b.on('pointerdown', () => { this.touch[key] = true; });
        const up = () => { this.touch[key] = false; };
        b.on('pointerup', up); b.on('pointerout', up);
      };
      btn(90, '<', 'left'); btn(220, '>', 'right');
    }

    this.dialog = new Dialog(this);
    this.cameras.main.fadeIn(1200, 255, 240, 210);
    this.time.delayedCall(900, () => { this.started = true; });
    this.time.delayedCall(6500, () => this.hint.setAlpha(0));
  }

  private spawn(kind: 'ember' | 'ice'): void {
    const x = 70 + this.rand() * (W - 140);
    if (kind === 'ember') {
      const glow = this.add.image(x, -20, 'glow').setScale(0.5).setTint(0xffc46a).setBlendMode(Phaser.BlendModes.ADD).setDepth(6);
      const s = this.add.image(x, -20, 'tiles', 151).setScale(2).setDepth(6);
      this.fallers.push({ s, glow, vy: 120 + this.rand() * 70 + Math.min(60, this.elapsed * 0.002), kind, x, y: -20 });
    } else {
      // Icicles are the spike tile, upside down and pale.
      const s = this.add.image(x, -20, 'tiles', 68).setScale(2).setFlipY(true).setTint(0xbfe8ff).setDepth(6);
      this.fallers.push({ s, vy: 170 + this.rand() * 80, kind, x, y: -20 });
    }
  }

  update(time: number, dt: number): void {
    if (Phaser.Input.Keyboard.JustDown(this.keys.M!)) this.sound.mute = !this.sound.mute;
    this.dialog.update(dt);
    if (Math.floor(time / 45) !== Math.floor((time - dt) / 45)) {
      this.grain.tilePositionX = Math.floor(Math.random() * 128);
      this.grain.tilePositionY = Math.floor(Math.random() * 128);
    }
    const s = dt / 1000;

    if (this.started && !this.done && !this.dialog.active) {
      this.elapsed += dt;
      // Movement. Stunned (by ice) means you stand still for a moment.
      this.stun = Math.max(0, this.stun - dt);
      const dir = ((this.keys.D!.isDown || this.keys.RIGHT!.isDown || this.touch.right) ? 1 : 0) - ((this.keys.A!.isDown || this.keys.LEFT!.isDown || this.touch.left) ? 1 : 0);
      if (this.stun === 0) {
        this.hero.x = Phaser.Math.Clamp(this.hero.x + dir * 330 * s, 40, W - 40);
        if (dir !== 0) this.hero.setFlipX(dir < 0);
        this.hero.play(dir !== 0 ? 'hero-walk' : 'hero-idle', true);
        this.hero.setTint(0xffffff);
      } else this.hero.setTint(0x9fc8ff);

      this.spawnE -= dt; this.spawnI -= dt;
      if (this.spawnE <= 0) { this.spawn('ember'); this.spawnE = 520 + this.rand() * 380; }
      if (this.spawnI <= 0) { this.spawn('ice'); this.spawnI = 1100 + this.rand() * 900; }
    }

    for (const f of [...this.fallers]) {
      if (!this.done) f.y += f.vy * s;
      f.s.setPosition(f.x, f.y); f.glow?.setPosition(f.x, f.y);
      if (f.kind === 'ice') f.s.setRotation(Math.sin(time * 0.01 + f.x) * 0.15);
      const near = Math.abs(f.x - this.hero.x) < 34 && f.y > FLOOR - 70 && f.y < FLOOR + 6;
      if (this.done) continue;
      if (near && f.kind === 'ember') {
        this.caught++;
        this.burstE.setParticleTint(0xffc46a);
        this.burstE.emitParticleAt(f.x, f.y, 10);
        this.sound.play('powerUp3', { volume: 0.3, rate: 0.9 + this.caught * 0.03 });
        this.remove(f);
      } else if (near && f.kind === 'ice' && this.stun === 0) {
        this.stun = 800;
        this.spawnI = Math.max(this.spawnI, 2600); // a breather after a hit
        this.caught = Math.max(0, this.caught - 2);
        this.burstE.setParticleTint(0xbfe8ff);
        this.burstE.emitParticleAt(f.x, f.y, 12);
        this.cameras.main.shake(100, 0.006);
        this.sound.play('lowDown', { volume: 0.35 });
        this.remove(f);
      } else if (f.y > FLOOR + 24) {
        if (f.kind === 'ember') this.burstE.setParticleTint(0xffa040), this.burstE.emitParticleAt(f.x, FLOOR, 4);
        this.remove(f);
      }
    }

    // The Hearth fills with light as you catch embers.
    const p = this.caught / NEED;
    this.hearthGlow.setScale(0.4 + p * 2.0).setAlpha(0.1 + p * 0.35 + Math.sin(time * 0.01) * 0.03);
    this.hearthFill.setAlpha(Math.min(1, p) * (this.done ? 1 : 0.7) + Math.sin(time * 0.012) * 0.04 * p);
    this.flame.emitting = this.caught >= 3;
    this.flame.setParticleScale(3 + p * 3);
    this.bar.clear();
    this.bar.fillStyle(0x0a1020, 0.8).fillRect(W / 2 - 160, 40, 320, 14);
    this.bar.fillStyle(0xffb040, 1).fillRect(W / 2 - 158, 42, 316 * Math.min(1, p), 10);
    this.bar.lineStyle(2, 0xffd27a, 0.9).strokeRect(W / 2 - 160, 40, 320, 14);

    if (this.caught >= NEED && !this.done) this.finish();
  }

  private remove(f: Faller): void {
    f.s.destroy(); f.glow?.destroy();
    this.fallers.splice(this.fallers.indexOf(f), 1);
  }

  private finish(): void {
    this.done = true;
    this.hint.setAlpha(0);
    for (const f of [...this.fallers]) this.remove(f);
    this.hero.play('hero-idle', true).setTint(0xffffff);
    this.cameras.main.flash(1100, 255, 220, 150);
    this.burstE.setParticleTint(0xffd27a);
    this.burstE.emitParticleAt(W / 2, 250, 60);
    this.sound.play('impactBell_heavy_000', { volume: 0.7 });
    this.sound.play('pepSound2', { volume: 0.5 });
    this.flame.emitting = true;
    this.time.delayedCall(1400, () => {
      this.dialog.show(HEARTH_FINALE, () => {
        this.cameras.main.fadeOut(1400, 255, 240, 210);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('End'));
      });
    });
  }
}
