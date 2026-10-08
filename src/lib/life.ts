import Phaser from 'phaser';
import { LAMPS, PLATFORMS, PROPS, WORLD_W, groundAt } from '../level';
import { rng } from './atmosphere';
import type { Fx } from './fx';
import { PX } from './pixel';
import { sfx } from './sfx';

/** What the world needs to know about the fox each frame. */
export interface FoxState {
  x: number; y: number;      // centre
  feet: number;              // y of the feet
  vx: number;
  grounded: boolean;
  landed: boolean;           // true only on the frame it touches down
}

interface Lantern {
  x: number; len: number; angle: number; vel: number; phase: number; lit: boolean; power: number;
  chain: Phaser.GameObjects.Rectangle; body: Phaser.GameObjects.Image;
  glow: Phaser.GameObjects.Image; shaft: Phaser.GameObjects.Image;
}
interface Blade { img: Phaser.GameObjects.Image; x: number; top: number; bend: number; vel: number; phase: number; cool: number }
interface Squishy { img: Phaser.GameObjects.Image; x: number; top: number; cool: number }
interface Pumpkin extends Squishy { lit: boolean; glow: Phaser.GameObjects.Image }
interface Bird { img: Phaser.GameObjects.Image; state: 'perched' | 'flying'; vx: number; vy: number; t: number; hop: number }
interface Firefly {
  core: Phaser.GameObjects.Image; glow: Phaser.GameObjects.Image;
  x: number; y: number; hx: number; hy: number; vx: number; vy: number; phase: number;
}

const near = (a: number, b: number, d: number) => Math.abs(a - b) < d;

/**
 * Everything in the world that reacts to the fox: lanterns that light as it passes, grass that
 * bends, leaf piles that burst, mushrooms that squish, pumpkins that wake up, birds that take
 * off and fireflies that scatter. None of it has collision; it is all for feel.
 */
export class Life {
  private lanterns: Lantern[] = [];
  private blades: Blade[] = [];
  private piles: Squishy[] = [];
  private shrooms: Squishy[] = [];
  private pumpkins: Pumpkin[] = [];
  private birds: Bird[] = [];
  private flies: Firefly[] = [];
  private accent = 0xffffff;

  constructor(private scene: Phaser.Scene, private fx: Fx) {
    const r = rng(77);
    this.buildLanterns(r);
    this.buildProps();
    this.buildGrass(r);
    this.buildBirds(r);
    this.buildFireflies(r);
  }

  /** How many lanterns the fox has woken up so far, and how many there are. */
  get lanternsLit(): number { return this.lanterns.filter((l) => l.lit).length; }
  get lanternCount(): number { return this.lanterns.length; }

  private buildLanterns(r: () => number): void {
    const add = Phaser.BlendModes.ADD;
    for (const [x, len] of LAMPS) {
      this.lanterns.push({
        x, len, angle: 0, vel: 0, phase: r() * 10, lit: false, power: 0,
        chain: this.scene.add.rectangle(x, 0, 2, len, 0x1a2138).setOrigin(0.5, 0).setDepth(9),
        body: this.scene.add.image(x, len, 'lantern-off').setOrigin(0.5, 0).setScale(PX).setDepth(12),
        glow: this.scene.add.image(x, len + 36, 'glow').setScale(1.9).setBlendMode(add).setDepth(13),
        shaft: this.scene.add.image(x, len + 16, 'shaft').setOrigin(0.5, 0).setBlendMode(add).setDepth(13),
      });
    }
  }

  private buildProps(): void {
    for (const [kind, x] of PROPS) {
      const top = groundAt(x);
      if (top === null) continue;
      const tree = kind.startsWith('tree');
      const img = this.scene.add.image(x, top + (tree ? 2 : 0), kind).setOrigin(0.5, 1).setScale(PX)
        .setDepth(tree || kind === 'fence' ? 9 : 12);
      if (kind.startsWith('pile')) this.piles.push({ img, x, top, cool: 0 });
      else if (kind === 'mushroom') this.shrooms.push({ img, x, top, cool: 0 });
      else if (kind === 'pumpkin') {
        const glow = this.scene.add.image(x, top - 8, 'glow').setScale(0.9).setBlendMode(Phaser.BlendModes.ADD)
          .setTint(0xffb45a).setAlpha(0).setDepth(13);
        this.pumpkins.push({ img, x, top, cool: 0, lit: false, glow });
      }
    }
  }

  /** Tufts scattered along every platform. Some sit in front of the fox so it wades through them. */
  private buildGrass(r: () => number): void {
    for (const [px, top, w] of PLATFORMS) {
      const n = Math.floor(w / 46);
      for (let i = 0; i < n; i++) {
        const x = px + 8 + r() * (w - 16);
        if (groundAt(x) !== top) continue; // a taller block is standing here
        const roll = r();
        const kind = roll < 0.16 ? 'reed' : roll < 0.6 ? 'grass1' : 'grass2';
        const img = this.scene.add.image(x, top + 1, kind).setOrigin(0.5, 1).setScale(PX)
          .setFlipX(r() < 0.5).setDepth(r() < 0.4 ? 23 : 12);
        this.blades.push({ img, x, top, bend: 0, vel: 0, phase: r() * 10, cool: 0 });
      }
    }
  }

  private buildBirds(r: () => number): void {
    for (let i = 0; i < 9; i++) {
      const p = PLATFORMS[Math.floor(r() * PLATFORMS.length)]!;
      const x = p[0] + 14 + r() * (p[2] - 28);
      if (x < 220 || groundAt(x) !== p[1]) continue; // none on the spawn, none buried in a block
      const img = this.scene.add.image(x, p[1], 'bird').setOrigin(0.5, 1).setScale(PX).setFlipX(r() < 0.5).setDepth(12);
      this.birds.push({ img, state: 'perched', vx: 0, vy: 0, t: 0, hop: 1500 + r() * 3000 });
    }
  }

  private buildFireflies(r: () => number): void {
    for (let i = 0; i < 18; i++) {
      const hx = 150 + r() * (WORLD_W - 300);
      const hy = (groundAt(hx) ?? 470) - 26 - r() * 90;
      const core = this.scene.add.image(hx, hy, 'dot').setScale(PX).setTint(0xfff3b0).setDepth(22);
      const glow = this.scene.add.image(hx, hy, 'dust').setScale(1.6).setTint(0xffe27a)
        .setBlendMode(Phaser.BlendModes.ADD).setDepth(22);
      this.flies.push({ core, glow, x: hx, y: hy, hx, hy, vx: 0, vy: 0, phase: r() * 10 });
    }
  }

  /** Lantern light follows the room's accent colour. */
  setAccent(colour: number): void {
    this.accent = colour;
    for (const l of this.lanterns) { l.glow.setTint(colour); l.shaft.setTint(colour); }
  }

  update(time: number, dt: number, fox: FoxState): void {
    const s = Math.min(dt, 50) / 1000; // seconds, capped so a long frame can't fling things
    this.updateLanterns(time, s, fox);
    this.updateGrass(time, s, dt, fox);
    this.updateSquishies(dt, fox);
    this.updateBirds(time, s, dt, fox);
    this.updateFireflies(time, s, fox);
  }

  private updateLanterns(time: number, s: number, fox: FoxState): void {
    for (const l of this.lanterns) {
      if (!l.lit && near(fox.x, l.x, 56)) {
        l.lit = true;
        l.body.setTexture('lantern');
        l.vel += (fox.vx < 0 ? -1 : 1) * 0.32; // a nudge, so it swings as it wakes
        this.fx.sparks(l.x, l.len + 10, 8, this.accent);
        sfx.chime();
      }
      if (l.lit) l.power = Math.min(1, l.power + s * 2.2); // fades up over about half a second
      // a damped pendulum with a little wind
      l.vel += (-6 * l.angle - 0.6 * l.vel + 0.08 * Math.sin(time * 0.0009 + l.phase)) * s;
      l.angle += l.vel * s;
      const sin = Math.sin(l.angle), cos = Math.cos(l.angle);
      const bx = l.x - sin * l.len, by = cos * l.len;
      l.chain.setRotation(l.angle);
      l.body.setPosition(bx, by).setRotation(l.angle);
      const flicker = 1 + Math.sin(time * 0.003 + l.phase) * 0.1 - (l.lit && Math.random() < 0.008 ? 0.5 : 0);
      l.glow.setPosition(bx - sin * 36, by + cos * 36).setAlpha((0.13 + 0.34 * l.power) * flicker);
      l.shaft.setPosition(bx - sin * 16, by + cos * 16).setRotation(l.angle).setAlpha((0.035 + 0.15 * l.power) * flicker);
    }
  }

  private updateGrass(time: number, s: number, dt: number, fox: FoxState): void {
    for (const b of this.blades) {
      b.cool -= dt;
      if (b.cool <= 0 && near(fox.x, b.x, 12) && near(fox.feet, b.top, 8) && Math.abs(fox.vx) > 20) {
        b.vel += Math.sign(fox.vx) * 420; // brushed aside, in the direction the fox is going
        b.cool = 280;
      }
      const rest = Math.sin(time * 0.002 + b.phase) * 4; // idle breeze, in degrees
      b.vel += (-120 * (b.bend - rest) - 9 * b.vel) * s;  // a spring pulls it back upright
      b.bend = Phaser.Math.Clamp(b.bend + b.vel * s, -55, 55);
      b.img.setAngle(b.bend);
    }
  }

  private squish(img: Phaser.GameObjects.Image, sx: number, sy: number): void {
    this.scene.tweens.killTweensOf(img);
    img.setScale(PX * sx, PX * sy);
    this.scene.tweens.add({ targets: img, scaleX: PX, scaleY: PX, duration: 420, ease: 'Elastic.easeOut' });
  }

  private updateSquishies(dt: number, fox: FoxState): void {
    for (const p of this.piles) {
      p.cool -= dt;
      if (p.cool <= 0 && near(fox.x, p.x, 16) && near(fox.feet, p.top, 8) && (Math.abs(fox.vx) > 40 || fox.landed)) {
        p.cool = 900;
        this.fx.leaves(p.x, p.top - 4, fox.landed ? 15 : 9);
        this.squish(p.img, 1.25, 0.55);
        sfx.rustle();
      }
    }
    for (const m of this.shrooms) {
      m.cool -= dt;
      if (m.cool <= 0 && near(fox.x, m.x, 9) && near(fox.feet, m.top, 8) && (Math.abs(fox.vx) > 20 || fox.landed)) {
        m.cool = 500;
        this.squish(m.img, 1.35, 0.5);
        this.fx.sparks(m.x, m.top - 8, 3, 0xffd9a8);
        sfx.boing();
      }
    }
    for (const p of this.pumpkins) {
      if (!p.lit && near(fox.x, p.x, 64) && near(fox.feet, p.top, 110)) {
        p.lit = true;
        p.img.setTexture('pumpkin-on');
        this.squish(p.img, 0.8, 1.3);
        this.fx.embers(p.x, p.top - 12, 5);
        sfx.pop();
      }
      if (p.lit) p.glow.setAlpha(Math.min(0.5, p.glow.alpha + dt * 0.0015)); // candle catching
    }
  }

  private updateBirds(time: number, s: number, dt: number, fox: FoxState): void {
    for (const b of this.birds) {
      if (b.state === 'perched') {
        b.hop -= dt;
        if (b.hop <= 0) { b.img.toggleFlipX(); b.hop = 1500 + Math.random() * 3500; } // looks around
        if (near(fox.x, b.img.x, 84) && near(fox.y, b.img.y, 80)) {
          b.state = 'flying';
          const away = b.img.x >= fox.x ? 1 : -1;
          b.vx = away * (80 + Math.random() * 50);
          b.vy = -110 - Math.random() * 40;
          b.img.setFlipX(away < 0).setOrigin(0.5, 0.5).setDepth(24);
          sfx.chirp();
        }
      } else if (b.img.active) {
        b.t += dt;
        b.img.x += b.vx * s;
        b.img.y += b.vy * s;
        b.img.setTexture(Math.floor(time / 90) % 2 ? 'bird-up' : 'bird-down');
        if (b.t > 1400) b.img.setAlpha(Math.max(0, 1 - (b.t - 1400) / 500));
        if (b.t > 1900 || b.img.y < -20) b.img.destroy();
      }
    }
  }

  private updateFireflies(time: number, s: number, fox: FoxState): void {
    for (const f of this.flies) {
      // each one loops lazily around its own home spot
      const tx = f.hx + Math.cos(time * 0.0007 + f.phase) * 22;
      const ty = f.hy + Math.sin(time * 0.0011 + f.phase * 1.7) * 12;
      let ax = (tx - f.x) * 3, ay = (ty - f.y) * 3;
      const dx = f.x - fox.x, dy = f.y - fox.y, d = Math.hypot(dx, dy);
      if (d < 70 && d > 0.01) { // too close: dart away, harder the closer it is
        const push = (70 - d) * 22;
        ax += (dx / d) * push; ay += (dy / d) * push;
      }
      f.vx = (f.vx + ax * s) * 0.94;
      f.vy = (f.vy + ay * s) * 0.94;
      f.x += f.vx * s; f.y += f.vy * s;
      const blink = 0.35 + 0.65 * Math.max(0, Math.sin(time * 0.004 + f.phase * 3));
      f.core.setPosition(f.x, f.y).setAlpha(0.4 + 0.6 * blink);
      f.glow.setPosition(f.x, f.y).setAlpha(0.7 * blink);
    }
  }
}
