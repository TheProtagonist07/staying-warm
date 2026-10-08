import Phaser from 'phaser';
import { FOES, MOTE_HOME, OWL, groundAt } from '../level';
import type { Fx } from './fx';
import { PX } from './pixel';
import { sfx } from './sfx';

export type FoeKind = 'gloom' | 'hedgehog' | 'bat' | 'spider';

/** What the creatures need to know about the fox each frame. */
export interface FoxBody { x: number; y: number; feet: number; vx: number; vy: number; grounded: boolean }

/** What happened to the fox this frame, if anything. The scene decides what it costs. */
export type FoxHit = { type: 'stomp' } | { type: 'hurt'; fromX: number };

interface Foe {
  kind: FoeKind; img: Phaser.GameObjects.Sprite; x0: number; y0: number; range: number;
  dir: number; alive: boolean; t: number;
  // spider only: it waits on its thread, drops when the fox walks under, then climbs back
  state: 'wait' | 'drop' | 'hold' | 'climb'; timer: number; vy: number; dropY: number;
  thread?: Phaser.GameObjects.Image; anchor: number;
}

const FOX_HALF_W = 7, FOX_H = 26;
const OWL_LINES = {
  alone: 'Hoo. A lost light hides\nup ahead. It likes foxes.',
  together: 'Gather every light, then\nfind the door. Hop on glooms,\nnever on thorns.',
};

/**
 * The cast: four enemies, a companion and a talking owl.
 *  - gloom: slow blob that patrols. Land on it to squash it; walk into it and it hurts.
 *  - hedgehog: patrols faster and is all spikes, so it always hurts. Jump over it.
 *  - bat: weaves through the air across a gap.
 *  - spider: hangs on a thread and drops when the fox walks underneath.
 *  - mote: a small light that joins the fox, trails behind it, and points at the nearest
 *    orb when the fox stands still for a moment.
 *  - owl: sits on the signpost and explains the rules when the fox is close.
 * Enemies move on their own simple rules and are tested against the fox's box by hand, so
 * none of them needs a physics body.
 */
export class Creatures {
  private foes: Foe[] = [];
  private mote: {
    img: Phaser.GameObjects.Sprite; glow: Phaser.GameObjects.Image;
    joined: boolean; x: number; y: number; vx: number; vy: number; face: number; idle: number; party: number;
  };
  private owl: { img: Phaser.GameObjects.Sprite; bubble: Phaser.GameObjects.Text; line: string };

  constructor(private scene: Phaser.Scene, private fx: Fx) {
    for (const [kind, x, range, y] of FOES) {
      const ground = groundAt(x) ?? 470;
      const base = { kind, x0: x, range, dir: 1, alive: true, t: x, state: 'wait' as const, timer: 0, vy: 0 };
      if (kind === 'gloom' || kind === 'hedgehog') {
        const img = scene.add.sprite(x, ground, kind, 0).setOrigin(0.5, 1).setScale(PX).setDepth(18).play(`${kind}-walk`);
        this.foes.push({ ...base, img, y0: ground, dropY: 0, anchor: 0 });
      } else if (kind === 'bat') {
        const fly = y ?? ground - 120;
        const img = scene.add.sprite(x, fly, 'bat', 0).setScale(PX).setDepth(18).play('bat-fly');
        this.foes.push({ ...base, img, y0: fly, dropY: 0, anchor: 0 });
      } else {
        const rest = y ?? ground - 130, anchor = rest - 44;
        const thread = scene.add.image(x, anchor, 'dot').setOrigin(0.5, 0).setTint(0x8a8fb0).setAlpha(0.7).setDepth(17);
        const img = scene.add.sprite(x, rest, 'spider', 0).setScale(PX).setDepth(18).play('spider-wiggle');
        this.foes.push({ ...base, img, y0: rest, dropY: ground - 16, thread, anchor });
      }
    }

    this.mote = {
      img: scene.add.sprite(MOTE_HOME.x, MOTE_HOME.y, 'mote', 0).setScale(PX).setDepth(22).play('mote-fly'),
      glow: scene.add.image(MOTE_HOME.x, MOTE_HOME.y, 'glow').setScale(0.5).setTint(0x8fd8ff)
        .setBlendMode(Phaser.BlendModes.ADD).setDepth(22),
      joined: false, x: MOTE_HOME.x, y: MOTE_HOME.y, vx: 0, vy: 0, face: 1, idle: 0, party: 0,
    };

    const perch = (groundAt(OWL.x) ?? 470) - 11 * PX; // on top of the signpost, which is 11 art-pixels tall
    this.owl = {
      img: scene.add.sprite(OWL.x, perch, 'owl', 0).setOrigin(0.5, 1).setScale(PX).setDepth(12.5).play('owl-idle'),
      bubble: scene.add.text(OWL.x, perch - 30, OWL_LINES.alone, {
        fontFamily: 'monospace', fontSize: '13px', color: '#0b0f1c', backgroundColor: '#e9e4d4',
        padding: { x: 7, y: 5 }, align: 'center',
      }).setOrigin(0.5, 1).setDepth(40).setAlpha(0),
      line: OWL_LINES.alone,
    };
  }

  get moteJoined(): boolean { return this.mote.joined; }

  /** The mote does a happy loop around the fox. Call it when something good happens. */
  celebrate(): void { if (this.mote.joined) this.mote.party = 700; }

  /** Moves everyone. Returns what happened to the fox this frame, or null. */
  update(time: number, dt: number, fox: FoxBody, orbsLeft: { x: number; y: number }[]): FoxHit | null {
    const s = Math.min(dt, 50) / 1000;
    let hit: FoxHit | null = null;
    for (const f of this.foes) {
      this.moveFoe(f, s, dt, fox);
      hit ??= this.touch(f, fox);
    }
    this.updateMote(time, s, dt, fox, orbsLeft);
    this.updateOwl(dt, fox);
    return hit;
  }

  private moveFoe(f: Foe, s: number, dt: number, fox: FoxBody): void {
    if (!f.alive) return;
    if (f.kind === 'gloom' || f.kind === 'hedgehog') {
      f.img.x += f.dir * (f.kind === 'gloom' ? 26 : 38) * s;
      if (f.img.x > f.x0 + f.range) { f.img.x = f.x0 + f.range; f.dir = -1; }
      else if (f.img.x < f.x0 - f.range) { f.img.x = f.x0 - f.range; f.dir = 1; }
      f.img.setFlipX(f.dir < 0);
    } else if (f.kind === 'bat') {
      f.t += dt;
      const before = f.img.x;
      f.img.setPosition(f.x0 + Math.sin(f.t * 0.0012) * f.range, f.y0 + Math.sin(f.t * 0.004) * 22);
      f.img.setFlipX(f.img.x < before);
    } else {
      f.timer -= dt;
      if (f.state === 'wait') {
        if (f.timer <= 0 && Math.abs(fox.x - f.x0) < 46) { f.state = 'drop'; f.vy = 0; }
      } else if (f.state === 'drop') {
        f.vy += 900 * s;
        f.img.y += f.vy * s;
        if (f.img.y >= f.dropY) { f.img.y = f.dropY; f.state = 'hold'; f.timer = 450; }
      } else if (f.state === 'hold') {
        if (f.timer <= 0) f.state = 'climb';
      } else {
        f.img.y -= 45 * s;
        if (f.img.y <= f.y0) { f.img.y = f.y0; f.state = 'wait'; f.timer = 700; }
      }
      f.thread?.setDisplaySize(PX, Math.max(1, f.img.y - f.anchor));
    }
  }

  /** Box test between one enemy and the fox. Boxes are a little smaller than the art, in the fox's favour. */
  private touch(f: Foe, fox: FoxBody): FoxHit | null {
    if (!f.alive) return null;
    const w = f.img.displayWidth, h = f.img.displayHeight, pad = 3;
    const bottom = f.img.originY === 1 ? f.img.y : f.img.y + h / 2;
    const top = bottom - h + pad;
    const apart = fox.x + FOX_HALF_W < f.img.x - w / 2 + pad || fox.x - FOX_HALF_W > f.img.x + w / 2 - pad
      || fox.feet < top || fox.feet - FOX_H > bottom;
    if (apart) return null;

    if (f.kind === 'gloom' && fox.vy > 60 && fox.feet <= top + 14) { // came down on top of it
      f.alive = false;
      f.img.stop().setFrame(2);
      this.scene.tweens.add({ targets: f.img, alpha: 0, delay: 500, duration: 300, onComplete: () => f.img.destroy() });
      this.fx.sparks(f.img.x, f.img.y - 8, 10, 0x9a7ad6);
      sfx.boing();
      return { type: 'stomp' };
    }
    return { type: 'hurt', fromX: f.img.x };
  }

  private updateMote(time: number, s: number, dt: number, fox: FoxBody, orbsLeft: { x: number; y: number }[]): void {
    const m = this.mote;
    if (fox.vx > 20) m.face = 1; else if (fox.vx < -20) m.face = -1;
    m.idle = Math.abs(fox.vx) < 10 && fox.grounded ? m.idle + dt : 0;

    let tx: number, ty: number, pointing = false;
    if (!m.joined) { // waiting to be found
      tx = MOTE_HOME.x + Math.cos(time * 0.002) * 10;
      ty = MOTE_HOME.y + Math.sin(time * 0.003) * 6;
      if (Math.hypot(fox.x - m.x, fox.y - m.y) < 56) {
        m.joined = true;
        m.party = 700;
        this.fx.sparks(m.x, m.y, 12, 0x8fd8ff);
        sfx.chime();
      }
    } else if (m.party > 0) { // happy loop around the fox
      m.party -= dt;
      tx = fox.x + Math.cos(time * 0.02) * 26;
      ty = fox.y - 10 + Math.sin(time * 0.02) * 20;
    } else if (m.idle > 1200 && orbsLeft.length) { // fox is standing still: drift toward the nearest orb
      const o = orbsLeft.reduce((a, b) => (Math.hypot(a.x - fox.x, a.y - fox.y) < Math.hypot(b.x - fox.x, b.y - fox.y) ? a : b));
      const dx = o.x - fox.x, dy = o.y - fox.y, d = Math.hypot(dx, dy) || 1, k = Math.min(d, 70) / d;
      tx = fox.x + dx * k;
      ty = fox.y - 12 + dy * k;
      pointing = true;
    } else { // normal: trail behind the fox's shoulder
      tx = fox.x - m.face * 20;
      ty = fox.y - 30 + Math.sin(time * 0.005) * 4;
    }
    m.vx = (m.vx + (tx - m.x) * 40 * s) * 0.86; // a soft spring, so it lags and overshoots a little
    m.vy = (m.vy + (ty - m.y) * 40 * s) * 0.86;
    m.x += m.vx * s; m.y += m.vy * s;
    m.img.setPosition(m.x, m.y);
    const pulse = pointing ? 0.5 + 0.4 * Math.abs(Math.sin(time * 0.012)) : 0.45 + 0.1 * Math.sin(time * 0.006);
    m.glow.setPosition(m.x, m.y).setAlpha(pulse);
  }

  private updateOwl(dt: number, fox: FoxBody): void {
    const o = this.owl;
    const line = this.mote.joined ? OWL_LINES.together : OWL_LINES.alone;
    if (line !== o.line) { o.line = line; o.bubble.setText(line); }
    const close = Math.abs(fox.x - o.img.x) < 84 && Math.abs(fox.y - o.img.y) < 120;
    o.bubble.setAlpha(Phaser.Math.Clamp(o.bubble.alpha + (close ? 1 : -1) * dt * 0.005, 0, 1));
  }
}
