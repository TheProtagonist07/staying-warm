import Phaser from 'phaser';
import { makeGlow, makeGrain, makeSky, makeVignette, rng } from '../lib/atmosphere';
import { Dialog } from '../lib/dialog';
import { loadSave, writeSave } from '../lib/save';
import { makeDisc, makeDot, makeFrost, makePines, makeRibbon, makeRidge } from '../lib/scenery';
import { CHAPTER_INTRO, CHAPTER_OUTRO, NPC_SCENES, PROLOGUE } from '../lib/story';
import { LEVELS, S, T, WARMTH, buildLevel } from '../level';
import type { BuiltLevel } from '../level';
import { FONT_BODY, FONT_TITLE } from '../lib/ui';

const W = 960, H = 540;
const HERO_FRAME = 24;            // size of one character frame in the art
const DEPTH = { sky: 0, far: 2, near: 4, tiles: 10, props: 12, items: 14, mob: 18, hero: 20, fx: 24, dark: 40, light: 41 };

// How each chapter's mountains and aurora look. Chapter 1 is dusk-purple, chapter 3 deep night.
const LOOK = [
  { far: ['#5a4aa0', '#b8a8f0'], near: ['#241d56', '#5a4aa0'], pines: '#120f2c', aurora: [[0x9a6adf, 0.1], [0xdf8ad0, 0.08]] },
  { far: ['#3a5090', '#8aa0dc'], near: ['#0b1230', '#2b3d74'], pines: '#070b1e', aurora: [[0x4fe0b0, 0.16], [0x4fd0e8, 0.12]] },
  { far: ['#38388a', '#9fa0f0'], near: ['#080a24', '#242a70'], pines: '#05061a', aurora: [[0x70f0a0, 0.22], [0x8f7aff, 0.2], [0x4fe0e0, 0.14]] },
] as const;

interface Mob {
  kind: 'slug' | 'spiker' | 'bat'; sprite: Phaser.GameObjects.Sprite;
  x0: number; y0: number; minX: number; maxX: number; dir: number; alive: boolean; t: number;
}
interface Lantern {
  x: number; top: number; lit: boolean; power: number; sprite: Phaser.GameObjects.Image; glow: Phaser.GameObjects.Image;
}
interface Pickup { x: number; y: number; got: boolean; sprite: Phaser.GameObjects.Image; glow: Phaser.GameObjects.Image }
interface Stats { time: number; gems: number; gemsTotal: number; freezes: number }

export class GameScene extends Phaser.Scene {
  private idx = 0;
  private lv!: BuiltLevel;
  private prologue = false;
  private dialog!: Dialog;

  private hero!: Phaser.Physics.Arcade.Sprite;
  private heroGlow!: Phaser.GameObjects.Image;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private touch = { left: false, right: false, jump: false };
  private jumpWas = false;

  private warmth = WARMTH.max;
  private sparks = 0;
  private gemsGot = 0;
  private freezes = 0;
  private elapsed = 0;
  private finished = false;
  private invuln = 0;
  private stun = 0;
  private coyote = 0;
  private buffer = 0;
  private stepT = 0;
  private spawn = { x: 0, y: 0 };
  private inWind = false;
  private wasGrounded = true;
  private launched = false;   // true while a spring is carrying you up
  private lookAhead = 0;       // camera leans the way you are running
  private lowWarned = false;   // the low-warmth warning plays once per dip
  private musicVol = 0.32;
  private hudIcons: Phaser.GameObjects.Image[] = [];
  private hudTxt: Phaser.GameObjects.Text[] = [];
  private card!: Phaser.GameObjects.Container;

  private lanterns: Lantern[] = [];
  private sparkItems: Pickup[] = [];
  private gemItems: Pickup[] = [];
  private mobs: Mob[] = [];
  private springs: { x: number; top: number; sprite: Phaser.GameObjects.Image; cool: number }[] = [];
  private npcs: { x: number; top: number; id: string; sprite: Phaser.GameObjects.Sprite; mark: Phaser.GameObjects.Text; done: boolean }[] = [];
  private doorSprite!: Phaser.GameObjects.Image;
  private doorGlow!: Phaser.GameObjects.Image;
  private flags: Phaser.GameObjects.Image[] = [];
  private signText: { x: number; top: number; text: Phaser.GameObjects.Text }[] = [];

  private far!: Phaser.GameObjects.TileSprite;
  private near!: Phaser.GameObjects.TileSprite;
  private pines!: Phaser.GameObjects.TileSprite;
  private grain!: Phaser.GameObjects.TileSprite;
  private frost!: Phaser.GameObjects.Image;
  private stars: { s: Phaser.GameObjects.Image; phase: number }[] = [];
  private ribbons: { img: Phaser.GameObjects.Image; phase: number; x: number }[] = [];
  private flies: { s: Phaser.GameObjects.Image; hx: number; hy: number; phase: number }[] = [];
  private burstE!: Phaser.GameObjects.Particles.ParticleEmitter;
  private dustE!: Phaser.GameObjects.Particles.ParticleEmitter;
  private music?: Phaser.Sound.BaseSound;
  private windSnd?: Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound;

  private bar!: Phaser.GameObjects.Graphics;
  private toast!: Phaser.GameObjects.Text;
  private toastT = 0;

  constructor() { super('Game'); }

  init(data: { level?: number; prologue?: boolean }): void {
    this.idx = data.level ?? 0;
    this.prologue = !!data.prologue;
  }

  create(): void {
    this.lv = buildLevel(LEVELS[this.idx]!);
    this.warmth = WARMTH.max; this.sparks = 0; this.gemsGot = 0; this.freezes = 0; this.elapsed = 0;
    this.finished = false; this.invuln = 0; this.stun = 0; this.spawn = { ...this.lv.spawn }; this.inWind = false;
    this.lanterns = []; this.sparkItems = []; this.gemItems = []; this.mobs = []; this.flags = []; this.springs = [];
    this.npcs = []; this.signText = []; this.stars = []; this.ribbons = []; this.flies = [];
    this.wasGrounded = true; this.launched = false; this.toastT = 0; this.jumpWas = false;
    this.lookAhead = 0; this.lowWarned = false; this.musicVol = 0.32;
    writeSave({ chapter: Math.max(loadSave().chapter, this.idx) }); // remember how far you got
    if (this.idx === 0 && this.prologue) this.registry.set('stats', { time: 0, gems: 0, gemsTotal: 0, freezes: 0 } as Stats);

    this.buildTextures();
    this.buildBackdrop();
    const solids = this.buildWorld();
    this.buildItems();
    this.buildMobs();
    this.buildHero(solids);
    this.buildAtmosphere();
    this.buildHud();
    this.buildInput();
    this.dialog = new Dialog(this);

    this.physics.world.setBounds(0, -400, this.lv.worldW, this.lv.worldH + 800);
    this.cameras.main.setBounds(0, 0, this.lv.worldW, this.lv.worldH).startFollow(this.hero, true, 0.1, 0.1);
    this.cameras.main.setDeadzone(60, 80);
    this.cameras.main.fadeIn(900, 0, 0, 0);

    // Music and wind carry on across chapters instead of restarting.
    this.music = this.sound.get('music') ?? this.sound.add('music', { loop: true, volume: 0.32 });
    if (!this.music.isPlaying) this.music.play();
    this.windSnd = (this.sound.get('wind') ?? this.sound.add('wind', { loop: true, volume: 0.05 })) as Phaser.Sound.WebAudioSound;
    if (!this.windSnd.isPlaying) this.windSnd.play();

    this.time.delayedCall(700, () => {
      const intro = this.prologue ? [...PROLOGUE, ...CHAPTER_INTRO[this.idx]!] : CHAPTER_INTRO[this.idx]!;
      this.dialog.show(intro, () => this.showCard(`CHAPTER ${this.idx + 1}`, this.lv.def.name));
    });
  }

  // ---------- building the scene ----------

  private buildTextures(): void {
    const look = LOOK[this.idx]!;
    const def = this.lv.def;
    makeDot(this);
    makeSky(this, `sky${this.idx}`, W, H, def.sky[0], def.sky[1]);
    makeGlow(this, 'glow', 256);
    makeVignette(this, 'vignette', W, H);
    makeGrain(this, 'grain');
    makeFrost(this, 'frost', W, H);
    makeRibbon(this, 'ribbon', 140, 380);
    makeDisc(this, 'moon', 26, '#e6ecff', '#c3cdf0');
    makeRidge(this, `rf${this.idx}`, W, H, { base: 220, amp: 160, body: look.far[0], snow: look.far[1], waves: [[2, 1, 0.3], [3, 0.7, 1.9], [5, 0.4, 4.1]] });
    makeRidge(this, `rn${this.idx}`, W, H, { base: 110, amp: 120, body: look.near[0], snow: look.near[1], waves: [[3, 1, 2.2], [4, 0.6, 0.7], [7, 0.35, 3.3]] });
    makePines(this, `pn${this.idx}`, W, H, look.pines, 11 + this.idx * 7);
  }

  private buildBackdrop(): void {
    const look = LOOK[this.idx]!;
    const fixed = <O extends Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.ScrollFactor>(o: O) => o.setScrollFactor(0) as O;
    fixed(this.add.image(0, 0, `sky${this.idx}`).setOrigin(0, 0).setDepth(DEPTH.sky));
    const r = rng(5 + this.idx);
    for (let i = 0; i < 90; i++) {
      const s = fixed(this.add.image(r() * W, r() * H * 0.6, 'dot').setDepth(DEPTH.sky + 0.5)
        .setAlpha(0.2 + r() * 0.6).setScale(0.5 + r() * 0.6));
      this.stars.push({ s, phase: r() * 10 });
    }
    // aurora: tall soft ribbons high in the sky
    look.aurora.forEach(([tint, a], n) => {
      const x = 140 + n * 300 + r() * 80;
      this.ribbons.push({
        img: fixed(this.add.image(x, 110, 'ribbon').setTint(tint).setAlpha(a).setScale(2.4, 1.3)
          .setBlendMode(Phaser.BlendModes.ADD).setDepth(DEPTH.sky + 0.55)), phase: r() * 10, x,
      });
    });
    fixed(this.add.image(W * 0.78, 96, 'glow').setScale(3.4).setTint(0x4a62b8).setAlpha(0.3)
      .setBlendMode(Phaser.BlendModes.ADD).setDepth(DEPTH.sky + 0.6));
    fixed(this.add.image(W * 0.78, 96, 'moon').setDepth(DEPTH.sky + 0.7));
    this.far = fixed(this.add.tileSprite(0, 0, W, H, `rf${this.idx}`).setOrigin(0, 0).setDepth(DEPTH.far));
    this.near = fixed(this.add.tileSprite(0, 0, W, H, `rn${this.idx}`).setOrigin(0, 0).setDepth(DEPTH.far + 1));
    this.pines = fixed(this.add.tileSprite(0, 0, W, H, `pn${this.idx}`).setOrigin(0, 0).setDepth(DEPTH.far + 1.5));
  }

  /** Tiles, scenery and the invisible collision boxes. Returns the solid group. */
  private buildWorld(): Phaser.Physics.Arcade.StaticGroup {
    const lv = this.lv, def = lv.def;
    const solids = this.physics.add.staticGroup();
    const r = rng(11 + this.idx);
    lv.platforms.forEach((p, n) => {
      const snowy = p.row <= def.snowRow;
      const left = p.col * T, top = p.row * T, width = p.w * T;
      // One collision box per platform. The tiles are only paint.
      solids.add(this.add.rectangle(left + width / 2, top + (lv.worldH - top) / 2 + 200, width, lv.worldH - top + 400).setVisible(false));
      // Dark mass under the visible tile rows, so the cliff reads against the sky.
      this.add.rectangle(left + width / 2, top + 4 * T + (lv.worldH - top) / 2, width, lv.worldH - top, 0x0e1428).setDepth(DEPTH.tiles - 1);
      for (let c = 0; c < p.w; c++) {
        const first = c === 0, last = c === p.w - 1;
        const topTile = snowy ? (first ? 80 : last ? 83 : 81 + (c % 2)) : (first ? 0 : last ? 3 : 1 + (c % 2));
        const t = this.tile(left + c * T, top, topTile, DEPTH.tiles);
        if (!snowy) t.setTint(def.grass); // autumn orange in chapter 1
        for (let k = 1; k <= 3; k++) this.tile(left + c * T, top + k * T, [4, 5, 24, 25][Math.floor(r() * 4)]!, DEPTH.tiles);
      }
      // A few plain props so the ground isn't bare: pines, sprouts and mushrooms.
      if (p.w >= 5 && n > 0) {
        for (let i = 0; i < Math.floor(p.w / 3); i++) {
          const pool = [126, 126, 128, 124, 125];
          const kind = pool[Math.floor(r() * pool.length)]!;
          this.add.image(left + (1 + r() * (p.w - 2)) * T, top, 'tiles', kind).setOrigin(0.5, 1).setScale(S).setDepth(DEPTH.props - 1);
        }
      }
    });

    for (const sgn of lv.signs) {
      this.add.image(sgn.x, sgn.top, 'tiles', 86).setOrigin(0.5, 1).setScale(S).setDepth(DEPTH.props);
      const text = this.add.text(sgn.x, sgn.top - 2 * T - 10, sgn.text, {
        fontFamily: FONT_BODY, fontSize: '20px', color: '#101624', backgroundColor: '#e8e2cf',
        padding: { x: 6, y: 4 }, align: 'center',
      }).setOrigin(0.5, 1).setDepth(DEPTH.fx).setAlpha(0);
      this.signText.push({ x: sgn.x, top: sgn.top, text });
    }

    for (const wz of lv.wind) {
      this.add.rectangle(wz.x + wz.w / 2, wz.y + wz.h / 2, wz.w, wz.h, 0x9db8ff, 0.07).setDepth(DEPTH.dark - 1);
      this.add.particles(0, 0, 'dot', {
        emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(wz.x, wz.y + wz.h * 0.25, wz.w, wz.h * 0.5), quantity: 1 },
        lifespan: 700, speedX: { min: -330, max: -240 }, speedY: { min: -10, max: 14 },
        scaleX: { start: 7, end: 2 }, scaleY: 0.6, alpha: { start: 0.55, end: 0 }, frequency: 45, blendMode: 'ADD',
      } as Phaser.Types.GameObjects.Particles.ParticleEmitterConfig).setDepth(DEPTH.light);
    }
    return solids;
  }

  private tile(x: number, y: number, frame: number, depth: number): Phaser.GameObjects.Image {
    return this.add.image(x, y, 'tiles', frame).setOrigin(0, 0).setScale(S).setDepth(depth);
  }

  private buildItems(): void {
    const lv = this.lv;
    for (const f of lv.flags) {
      this.flags.push(this.add.image(f.x, f.top, 'tiles', 111).setOrigin(0.5, 1).setScale(S).setDepth(DEPTH.props));
    }
    this.tweens.addCounter({
      from: 0, to: 1, duration: 450, yoyo: true, repeat: -1,
      onUpdate: (c) => this.flags.forEach((f) => f.setFrame(c.getValue()! > 0.5 ? 112 : 111)),
    });

    // The door is two tiles tall: 130 on top of 150.
    const d = lv.door;
    this.add.image(d.x, d.top, 'tiles', 150).setOrigin(0.5, 1).setScale(S).setDepth(DEPTH.props);
    this.doorSprite = this.add.image(d.x, d.top - T, 'tiles', 130).setOrigin(0.5, 1).setScale(S).setDepth(DEPTH.props);
    this.doorGlow = this.add.image(d.x, d.top - T, 'glow').setScale(2.6).setTint(0xffd27a)
      .setBlendMode(Phaser.BlendModes.ADD).setDepth(DEPTH.light).setAlpha(0);

    for (const l of lv.lanterns) {
      const sprite = this.add.image(l.x, l.top, 'tiles', 129).setOrigin(0.5, 1).setScale(S).setDepth(DEPTH.props).setTint(0x4a5578);
      const glow = this.add.image(l.x, l.top - T, 'glow').setScale(2.6).setTint(0xffc46a)
        .setBlendMode(Phaser.BlendModes.ADD).setDepth(DEPTH.light).setAlpha(0);
      this.lanterns.push({ x: l.x, top: l.top, lit: false, power: 0, sprite, glow });
    }

    const pickup = (p: { x: number; y: number }, frame: number, tint: number, big: number): Pickup => {
      const sprite = this.add.image(p.x, p.y, 'tiles', frame).setScale(S).setDepth(DEPTH.items);
      const glow = this.add.image(p.x, p.y, 'glow').setScale(big).setTint(tint)
        .setBlendMode(Phaser.BlendModes.ADD).setDepth(DEPTH.light).setAlpha(0.6);
      this.tweens.add({ targets: [sprite, glow], y: p.y - 6, duration: 900 + Math.random() * 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      return { x: p.x, y: p.y, got: false, sprite, glow };
    };
    for (const p of lv.sparks) this.sparkItems.push(pickup(p, 151, 0xffc46a, 0.55));
    for (const p of lv.gems) this.gemItems.push(pickup(p, 67, 0x6ad0ff, 0.5));

    for (const sp of lv.springs) {
      this.springs.push({ x: sp.x, top: sp.top, cool: 0, sprite: this.add.image(sp.x, sp.top, 'tiles', 107).setOrigin(0.5, 1).setScale(S).setDepth(DEPTH.props) });
    }

    // People on the road. A "!" floats above them until you have spoken.
    const frames: Record<string, number> = { pip: 0, moth: 4, brann: 9 };
    for (const n of lv.npcs) {
      const sprite = this.add.sprite(n.x, n.top, 'chars', frames[n.id] ?? 0).setOrigin(0.5, 1).setScale(S).setDepth(DEPTH.mob - 1);
      this.tweens.add({ targets: sprite, y: n.top - 3, yoyo: true, repeat: -1, duration: 800, ease: 'Sine.easeInOut' });
      const mark = this.add.text(n.x, n.top - 66, '!', { fontFamily: FONT_BODY, fontSize: '34px', color: '#ffd27a', fontStyle: 'bold' })
        .setOrigin(0.5).setDepth(DEPTH.fx);
      this.tweens.add({ targets: mark, y: n.top - 74, yoyo: true, repeat: -1, duration: 500 });
      this.npcs.push({ x: n.x, top: n.top, id: n.id, sprite, mark, done: false });
    }
  }

  private buildMobs(): void {
    for (const w of this.lv.walkers) {
      const sprite = this.add.sprite(w.x, w.top, 'chars', 0).setOrigin(0.5, 1).setScale(S).setDepth(DEPTH.mob).play(w.kind);
      this.mobs.push({ kind: w.kind, sprite, x0: w.x, y0: w.top, minX: w.minX, maxX: w.maxX, dir: 1, alive: true, t: 0 });
    }
    for (const b of this.lv.bats) {
      const sprite = this.add.sprite(b.x, b.y, 'chars', 24).setScale(S).setDepth(DEPTH.mob).play('bat');
      this.mobs.push({ kind: 'bat', sprite, x0: b.x, y0: b.y, minX: 0, maxX: 0, dir: 1, alive: true, t: Math.random() * 6 });
    }
  }

  private buildHero(solids: Phaser.Physics.Arcade.StaticGroup): void {
    const sp = this.lv.spawn;
    this.heroGlow = this.add.image(sp.x, sp.y, 'glow').setTint(0xffd9a8).setBlendMode(Phaser.BlendModes.ADD).setDepth(DEPTH.light);
    this.hero = this.physics.add.sprite(sp.x, sp.y, 'chars', 6).setScale(S).setDepth(DEPTH.hero);
    this.hero.body!.setSize(12, 20).setOffset((HERO_FRAME - 12) / 2, 3);
    this.hero.setCollideWorldBounds(true);
    this.hero.play('hero-idle');
    this.physics.add.collider(this.hero, solids);
  }

  private buildAtmosphere(): void {
    const def = this.lv.def;
    // Everything is multiplied by a cold colour so the bright art sits in the night; lights are added on top.
    this.add.rectangle(0, 0, W, H, def.tint).setOrigin(0, 0).setScrollFactor(0).setDepth(DEPTH.dark)
      .setBlendMode(Phaser.BlendModes.MULTIPLY);
    this.add.image(0, 0, 'vignette').setOrigin(0, 0).setScrollFactor(0).setDepth(50);
    this.frost = this.add.image(0, 0, 'frost').setOrigin(0, 0).setScrollFactor(0).setDepth(52).setAlpha(0);
    this.grain = this.add.tileSprite(0, 0, W, H, 'grain').setOrigin(0, 0).setScrollFactor(0).setDepth(51).setAlpha(0.28);

    if (def.weather === 'snow') {
      this.add.particles(0, 0, 'dot', {
        x: { min: 0, max: W }, y: -10, lifespan: 7000, speedY: { min: 35, max: 85 }, speedX: { min: -35, max: -10 },
        scale: { min: 1, max: 2.4 }, alpha: { min: 0.4, max: 0.9 }, frequency: this.idx === 2 ? 38 : 70,
      }).setScrollFactor(0).setDepth(DEPTH.fx);
    } else {
      // Autumn: drifting leaves in a few warm colours, with a little spin.
      for (const tint of [0xe8742a, 0xd9531e, 0xe8a33d]) {
        this.add.particles(0, 0, 'dot', {
          x: { min: 0, max: W }, y: -10, lifespan: 9000, speedY: { min: 30, max: 60 }, speedX: { min: -40, max: 10 },
          scaleX: { min: 2.4, max: 3.6 }, scaleY: { min: 1.6, max: 2.4 }, rotate: { min: 0, max: 360 }, alpha: { min: 0.7, max: 1 },
          frequency: 420, tint,
        }).setScrollFactor(0).setDepth(DEPTH.fx);
      }
      // Fireflies wandering above the grass.
      const r = rng(77);
      for (let i = 0; i < 16; i++) {
        const hx = 200 + r() * (this.lv.worldW - 400), hy = this.lv.worldH * 0.35 + r() * this.lv.worldH * 0.5;
        const s = this.add.image(hx, hy, 'dot').setTint(0xfff3b0).setBlendMode(Phaser.BlendModes.ADD).setScale(1.6).setDepth(DEPTH.fx);
        this.flies.push({ s, hx, hy, phase: r() * 10 });
      }
    }

    this.burstE = this.add.particles(0, 0, 'dot', {
      lifespan: { min: 400, max: 900 }, speed: { min: 40, max: 150 }, angle: { min: 0, max: 360 },
      scale: { start: 3, end: 0 }, alpha: { start: 1, end: 0 }, blendMode: 'ADD', emitting: false,
    }).setDepth(DEPTH.fx);
    this.dustE = this.add.particles(0, 0, 'dot', {
      lifespan: { min: 200, max: 400 }, speed: { min: 8, max: 35 }, angle: { min: 200, max: 340 },
      scale: { start: 3, end: 0 }, alpha: { start: 0.55, end: 0 }, tint: 0xcfdcff, emitting: false,
    }).setDepth(DEPTH.fx);
  }

  private buildHud(): void {
    this.bar = this.add.graphics().setScrollFactor(0).setDepth(60);
    this.add.text(16, 8, 'WARMTH', { fontFamily: FONT_BODY, fontSize: '20px', color: '#ffd27a' }).setScrollFactor(0).setDepth(60);
    this.add.text(16, 48, `${this.idx + 1}/3  ${this.lv.def.name}`, { fontFamily: FONT_BODY, fontSize: '19px', color: '#9db8ff' }).setScrollFactor(0).setDepth(60);
    // Counters along the top right, each with its own little picture: sparks, lanterns, star shards.
    this.hudIcons = []; this.hudTxt = [];
    [[151, W - 330], [129, W - 215], [67, W - 100]].forEach(([frame, x]) => {
      const ic = this.add.image(x!, 24, 'tiles', frame!).setScale(1.7).setScrollFactor(0).setDepth(60);
      if (frame === 129) ic.setTint(0xffe9b0); // the lantern, glowing
      this.hudIcons.push(ic);
      this.hudTxt.push(this.add.text(x! + 22, 11, '', { fontFamily: FONT_BODY, fontSize: '26px', color: '#ffffff' }).setScrollFactor(0).setDepth(60));
    });
    // Pause button for mouse and touch (Esc or P also work).
    const pb = this.add.rectangle(W - 28, 74, 36, 36, 0x0a1020, 0.6).setStrokeStyle(2, 0x7f8fc0).setScrollFactor(0).setDepth(60).setInteractive({ useHandCursor: true });
    this.add.text(W - 28, 74, 'II', { fontFamily: FONT_TITLE, fontSize: '16px', color: '#dfe8ff' }).setOrigin(0.5).setScrollFactor(0).setDepth(61);
    pb.on('pointerdown', () => this.openPause());
    this.toast = this.add.text(W / 2, 90, '', {
      fontFamily: FONT_BODY, fontSize: '26px', color: '#ffffff', align: 'center', backgroundColor: '#0a1020cc', padding: { x: 10, y: 6 },
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(60).setAlpha(0);
    // Chapter title card: big name that fades in, holds, and fades out.
    const t1 = this.add.text(0, -28, '', { fontFamily: FONT_BODY, fontSize: '30px', color: '#ffd27a' }).setOrigin(0.5);
    const t2 = this.add.text(0, 18, '', { fontFamily: FONT_TITLE, fontSize: '46px', color: '#ffffff' }).setOrigin(0.5);
    this.card = this.add.container(W / 2, 200, [t1, t2]).setScrollFactor(0).setDepth(65).setAlpha(0);
  }

  private showCard(small: string, big: string): void {
    (this.card.list[0] as Phaser.GameObjects.Text).setText(small);
    (this.card.list[1] as Phaser.GameObjects.Text).setText(big);
    this.tweens.killTweensOf(this.card);
    this.card.setAlpha(0);
    this.tweens.add({ targets: this.card, alpha: 1, duration: 600, hold: 1800, yoyo: true });
  }

  private openPause(): void {
    if (this.finished || this.dialog.active || this.scene.isPaused()) return;
    this.scene.pause();
    this.scene.launch('Pause', { level: this.idx });
  }

  private buildInput(): void {
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,UP,LEFT,RIGHT,SPACE,Z,M,ESC,P') as typeof this.keys;
    if (!this.sys.game.device.input.touch) return;
    // On-screen buttons for phones and tablets: move on the left, jump on the right.
    const btn = (x: number, y: number, label: string, key: 'left' | 'right' | 'jump', w = 96) => {
      const g = this.add.rectangle(x, y, w, 96, 0xffffff, 0.14).setStrokeStyle(2, 0xffffff, 0.4)
        .setScrollFactor(0).setDepth(70).setInteractive();
      this.add.text(x, y, label, { fontFamily: FONT_TITLE, fontSize: '29px', color: '#ffffff' })
        .setOrigin(0.5).setScrollFactor(0).setDepth(71).setAlpha(0.8);
      g.on('pointerdown', () => { this.touch[key] = true; g.setFillStyle(0xffffff, 0.3); });
      const up = () => { this.touch[key] = false; g.setFillStyle(0xffffff, 0.14); };
      g.on('pointerup', up); g.on('pointerout', up);
    };
    btn(80, H - 70, '<', 'left');
    btn(190, H - 70, '>', 'right');
    btn(W - 90, H - 70, '^', 'jump', 130);
  }

  // ---------- messages ----------

  private say(msg: string, ms = 2200): void {
    this.toast.setText(msg).setAlpha(1);
    this.toastT = ms;
  }

  // ---------- per-frame ----------

  update(time: number, dt: number): void {
    if (Phaser.Input.Keyboard.JustDown(this.keys.M!)) this.sound.mute = !this.sound.mute; // M toggles all sound
    if (Phaser.Input.Keyboard.JustDown(this.keys.ESC!) || Phaser.Input.Keyboard.JustDown(this.keys.P!)) this.openPause();
    this.dialog.update(dt);

    if (this.dialog.active || this.finished) {
      // Talking or between chapters: the world holds still.
      const b = this.hero.body as Phaser.Physics.Arcade.Body;
      b.setVelocityX(0);
      this.pose(0, b.blocked.down);
      this.jumpWas = true;
    } else {
      this.elapsed += dt;
      this.moveHero(dt);
      this.updateWarmth(dt);
      this.updateMobs(time, dt);
      this.updatePickups();
      this.updateSprings(dt);
      this.updateNpcs();
    }
    this.updateLooks(time, dt);

    if (this.toastT > 0) {
      this.toastT -= dt;
      if (this.toastT < 400) this.toast.setAlpha(Math.max(0, this.toastT / 400));
    }
    if (!this.finished && this.hero.y > this.lv.worldH + 80) this.freeze(true);
  }

  private moveHero(dt: number): void {
    const k = this.keys;
    const body = this.hero.body as Phaser.Physics.Arcade.Body;
    const grounded = body.blocked.down;
    if (this.stun > 0) { this.stun -= dt; this.pose(0, grounded); return; }

    const dir = ((k.D!.isDown || k.RIGHT!.isDown || this.touch.right) ? 1 : 0) - ((k.A!.isDown || k.LEFT!.isDown || this.touch.left) ? 1 : 0);
    const jumpDown = k.SPACE!.isDown || k.W!.isDown || k.UP!.isDown || k.Z!.isDown || this.touch.jump;
    const jumpPressed = jumpDown && !this.jumpWas;
    this.jumpWas = jumpDown;

    // Cold slows you down a little: below a quarter warmth you move at 75% speed.
    const speed = 190 * (this.warmth < 25 ? 0.75 : 1);
    body.setVelocityX(body.velocity.x + (dir * speed - body.velocity.x) * Math.min(1, dt * 0.02));

    // Coyote time and a jump buffer: small forgiveness windows that make jumping feel fair.
    this.coyote = grounded ? 110 : this.coyote - dt;
    this.buffer = jumpPressed ? 120 : this.buffer - dt;
    if (this.buffer > 0 && this.coyote > 0) {
      body.setVelocityY(-470);
      this.buffer = 0; this.coyote = 0;
      this.sound.play('phaseJump1', { volume: 0.28, rate: 0.92 + Math.random() * 0.2 });
      this.dustE.emitParticleAt(this.hero.x, this.hero.y + 28, 4);
    }
    if (this.launched && (grounded || body.velocity.y > 0)) this.launched = false;
    // release early = short hop (but never cut a spring launch short)
    if (!this.launched && !jumpDown && body.velocity.y < -150) body.setVelocityY(body.velocity.y * 0.5);

    this.pose(dir, grounded);
    if (grounded && Math.abs(body.velocity.x) > 90) {
      this.stepT -= dt;
      if (this.stepT <= 0) {
        this.sound.play(`footstep_snow_00${Math.floor(Math.random() * 3)}`, { volume: 0.18 });
        this.stepT = 270;
      }
    }
    if (grounded && !this.wasGrounded) {
      this.sound.play('impactSoft_medium_001', { volume: 0.2 });
      this.dustE.emitParticleAt(this.hero.x, this.hero.y + 28, 5);
    }
    this.wasGrounded = grounded;
  }

  private pose(dir: number, grounded: boolean): void {
    const body = this.hero.body as Phaser.Physics.Arcade.Body;
    if (dir !== 0) this.hero.setFlipX(dir < 0);
    this.hero.play(!grounded ? 'hero-air' : Math.abs(body.velocity.x) > 30 ? 'hero-walk' : 'hero-idle', true);
  }

  private updateWarmth(dt: number): void {
    const s = dt / 1000;
    this.inWind = this.lv.wind.some((w) => this.hero.x > w.x && this.hero.x < w.x + w.w && this.hero.y > w.y && this.hero.y < w.y + w.h);
    let delta = -(this.inWind ? WARMTH.windDrain : WARMTH.drain);
    const near = this.lanterns.some((l) => l.lit && Phaser.Math.Distance.Between(this.hero.x, this.hero.y, l.x, l.top - T) < WARMTH.lanternRadius);
    if (near) delta = WARMTH.regen;
    this.warmth = Phaser.Math.Clamp(this.warmth + delta * s, 0, WARMTH.max);
    if (this.warmth <= 0) this.freeze(false);
  }

  /** Warmth ran out (or you fell): wake up at the last lit lantern. */
  private freeze(fell: boolean): void {
    this.freezes++;
    this.warmth = WARMTH.respawn;
    this.invuln = 1500; this.stun = 0;
    this.hero.setVelocity(0, 0);
    this.hero.setPosition(this.spawn.x, this.spawn.y);
    this.cameras.main.fadeIn(500, 20, 30, 60);
    this.sound.play('phaserDown2', { volume: 0.3 });
    this.say(fell ? 'You slipped.\nBack to the last lantern.' : 'You froze.\nBack to the last lantern.');
  }

  private hurt(fromX: number): void {
    if (this.invuln > 0) return;
    // An enemy can chill you but never freeze you outright (that takes the wind, or running out of lanterns),
    // and the knock-back is a small hop, so a hit cannot throw you off a ledge.
    this.warmth = Math.max(Math.min(this.warmth, 12), this.warmth - WARMTH.hit);
    this.invuln = 1600; this.stun = 160;
    this.hero.setVelocity((this.hero.x >= fromX ? 1 : -1) * 70, -280);
    this.cameras.main.shake(110, 0.006);
    this.burstE.emitParticleAt(this.hero.x, this.hero.y, 8);
    this.sound.play('lowDown', { volume: 0.35 });
  }

  private updateMobs(time: number, dt: number): void {
    const s = dt / 1000;
    const hb = this.hero.body as Phaser.Physics.Arcade.Body;
    for (const m of this.mobs) {
      if (!m.alive) continue;
      const sp = m.sprite;
      if (m.kind === 'bat') {
        m.t += s;
        sp.setPosition(m.x0 + Math.sin(m.t * 1.1) * 2.2 * T, m.y0 + Math.sin(m.t * 2.6) * 0.6 * T);
        sp.setFlipX(Math.cos(m.t * 1.1) < 0);
      } else {
        sp.x += m.dir * (m.kind === 'slug' ? 38 : 58) * s;
        if (sp.x > m.maxX) { sp.x = m.maxX; m.dir = -1; } else if (sp.x < m.minX) { sp.x = m.minX; m.dir = 1; }
        sp.setFlipX(m.dir < 0);
      }
      // Hit boxes are smaller than the art, which is kind to the player. Walkers are hit only by feet
      // below ~70% of their height, so an ordinary hop clears them; bats use a small box in the middle.
      const halfW = sp.displayWidth * 0.3;
      const top = m.kind === 'bat' ? sp.y - sp.displayHeight * 0.3 : sp.y - sp.displayHeight * 0.7;
      const bottom = m.kind === 'bat' ? sp.y + sp.displayHeight * 0.3 : sp.y;
      const hit = Math.abs(hb.center.x - sp.x) < hb.halfWidth + halfW && hb.bottom > top && hb.top < bottom;
      if (!hit) continue;
      const stomp = m.kind === 'slug' && hb.velocity.y > 40 && hb.bottom < top + 16;
      if (stomp) {
        m.alive = false;
        this.tweens.add({ targets: sp, scaleY: 0.2, alpha: 0, duration: 220, onComplete: () => sp.destroy() });
        this.hero.setVelocityY(-400);
        this.burstE.emitParticleAt(sp.x, sp.y - 10, 8);
        this.sound.play('impactSoft_medium_000', { volume: 0.4 });
      } else {
        this.hurt(sp.x);
      }
    }
    if (this.invuln > 0) {
      this.invuln -= dt;
      this.hero.setAlpha(Math.floor(time / 70) % 2 ? 0.4 : 1);
    } else this.hero.setAlpha(1);
  }

  private updateSprings(dt: number): void {
    const hb = this.hero.body as Phaser.Physics.Arcade.Body;
    for (const sp of this.springs) {
      sp.cool -= dt;
      if (sp.cool > 0 || Math.abs(hb.center.x - sp.x) > 22 || Math.abs(hb.bottom - sp.top) > 14 || hb.velocity.y < -60) continue;
      sp.cool = 400;
      this.hero.setVelocityY(-690);
      this.launched = true;
      this.coyote = 0;
      sp.sprite.setFrame(108);
      this.time.delayedCall(180, () => sp.sprite.setFrame(107));
      this.burstE.emitParticleAt(sp.x, sp.top - 8, 8);
      this.sound.play('phaseJump1', { volume: 0.4, rate: 1.4 });
    }
  }

  private updateNpcs(): void {
    for (const n of this.npcs) {
      // Only start a talk when the hero is standing on the ground next to them. Starting it mid-jump
      // used to freeze the hero over a gap and drop it into the pit.
      const standing = (this.hero.body as Phaser.Physics.Arcade.Body).blocked.down;
      if (n.done || !standing || Math.abs(this.hero.x - n.x) > 70 || Math.abs(this.hero.y - (n.top - 30)) > 50) continue;
      n.done = true;
      n.mark.setVisible(false);
      n.sprite.setFlipX(this.hero.x < n.x);
      this.hero.setFlipX(this.hero.x < n.x ? false : true);
      this.dialog.show(NPC_SCENES[n.id] ?? [], () => {
        this.warmth = WARMTH.max;
        this.burstE.setParticleTint(0xffc46a);
        this.burstE.emitParticleAt(this.hero.x, this.hero.y, 14);
        this.burstE.setParticleTint(0xffffff);
        this.sound.play('powerUp3', { volume: 0.35 });
        this.say('Warmed up.', 1600);
      });
    }
  }

  private updatePickups(): void {
    const hx = this.hero.x, hy = this.hero.y;
    for (const p of this.sparkItems) {
      if (p.got || Phaser.Math.Distance.Between(hx, hy, p.sprite.x, p.sprite.y) > 34) continue;
      p.got = true; p.sprite.destroy(); p.glow.destroy();
      this.sparks++;
      this.burstE.emitParticleAt(p.x, p.y, 10);
      this.sound.play('powerUp3', { volume: 0.35 });
      this.say('Spark collected.\nWalk up to a lantern to light it.', 1800);
    }
    for (const p of this.gemItems) {
      if (p.got || Phaser.Math.Distance.Between(hx, hy, p.sprite.x, p.sprite.y) > 34) continue;
      p.got = true; p.sprite.destroy(); p.glow.destroy();
      this.gemsGot++;
      this.burstE.setParticleTint(0x6ad0ff);
      this.burstE.emitParticleAt(p.x, p.y, 14);
      this.burstE.setParticleTint(0xffffff);
      this.sound.play('powerUp7', { volume: 0.35 });
      this.say(`Star shard ${this.gemsGot} of ${this.gemItems.length}`, 1500);
    }
    for (const l of this.lanterns) {
      if (l.lit || Math.abs(hx - l.x) > 54 || Math.abs(hy - (l.top - T)) > 90) continue;
      if (this.sparks < 1) {
        if (this.toastT <= 0) this.say('This lantern is cold.\nFind a spark first.', 1600);
        continue;
      }
      this.sparks--;
      l.lit = true;
      this.add.particles(l.x, l.top - T, 'dot', {
        lifespan: { min: 900, max: 1700 }, speedY: { min: -50, max: -20 }, speedX: { min: -10, max: 10 },
        scale: { start: 2.4, end: 0 }, alpha: { start: 0.9, end: 0 }, tint: [0xffd27a, 0xff9a3c], blendMode: 'ADD', frequency: 260,
      }).setDepth(DEPTH.fx); // a lit lantern keeps throwing little sparks
      this.spawn = { x: l.x, y: l.top - 40 };
      this.warmth = Math.min(WARMTH.max, this.warmth + 40);
      this.burstE.setParticleTint(0xffc46a);
      this.burstE.emitParticleAt(l.x, l.top - T, 18);
      this.burstE.setParticleTint(0xffffff);
      this.sound.play('impactBell_heavy_000', { volume: 0.5 });
      const lit = this.lanterns.filter((q) => q.lit).length;
      this.say(lit === this.lanterns.length ? 'Every lantern is lit!\nGo to the door.' : `Lantern lit  ${lit} / ${this.lanterns.length}`, 2000);
    }
    const d = this.lv.door;
    const allLit = this.lanterns.every((l) => l.lit);
    if (Math.abs(hx - d.x) < 38 && Math.abs(hy - (d.top - T)) < 70) {
      if (allLit) this.finishChapter();
      else if (this.toastT <= 0) this.say(`The door is frozen shut.\nLight all ${this.lanterns.length} lanterns first.`, 2000);
    }
  }

  /** The door opens: tell the end of the chapter, then go on to the next one (or the ending). */
  private finishChapter(): void {
    this.finished = true;
    const stats = (this.registry.get('stats') ?? { time: 0, gems: 0, gemsTotal: 0, freezes: 0 }) as Stats;
    this.registry.set('stats', stats);
    stats.time += this.elapsed; stats.gems += this.gemsGot; stats.gemsTotal += this.gemItems.length; stats.freezes += this.freezes;
    const body = this.hero.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    this.sound.play('pepSound2', { volume: 0.5 });
    this.burstE.emitParticleAt(this.lv.door.x, this.lv.door.top - T, 30);
    const last = this.idx === LEVELS.length - 1;

    this.dialog.show(CHAPTER_OUTRO[this.idx]!, () => {
      this.cameras.main.fadeOut(last ? 1000 : 800, last ? 255 : 0, last ? 240 : 0, last ? 210 : 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        if (last) this.scene.start('Hearth');   // the last stage is a short mini game at the summit
        else this.scene.restart({ level: this.idx + 1 });
      });
    });
  }

  /** Lights, fades and the HUD. */
  private updateLooks(time: number, dt: number): void {
    const cam = this.cameras.main;
    this.far.tilePositionX = cam.scrollX * 0.06; this.far.tilePositionY = cam.scrollY * 0.07;
    this.near.tilePositionX = cam.scrollX * 0.14; this.near.tilePositionY = cam.scrollY * 0.12;
    this.pines.tilePositionX = cam.scrollX * 0.24; this.pines.tilePositionY = cam.scrollY * 0.16;
    for (const st of this.stars) st.s.setAlpha(0.35 + 0.35 * Math.sin(time * 0.002 + st.phase));
    for (const r of this.ribbons) {
      r.img.x = r.x + Math.sin(time * 0.0003 + r.phase) * 40 - cam.scrollX * 0.01;
      r.img.setScale(2.4 + Math.sin(time * 0.0006 + r.phase) * 0.5, 1.3 + Math.sin(time * 0.0004 + r.phase) * 0.2);
    }
    for (const f of this.flies) {
      f.s.x = f.hx + Math.cos(time * 0.0007 + f.phase) * 30; f.s.y = f.hy + Math.sin(time * 0.0011 + f.phase * 1.7) * 16;
      f.s.setAlpha(0.2 + 0.8 * Math.max(0, Math.sin(time * 0.004 + f.phase * 3)));
    }
    if (Math.floor(time / 45) !== Math.floor((time - dt) / 45)) {
      this.grain.tilePositionX = Math.floor(Math.random() * 128);
      this.grain.tilePositionY = Math.floor(Math.random() * 128);
    }

    // The hero's own light shrinks and cools as warmth drops, and frost creeps in from the edges of the
    // screen. These are the main ways the player feels the meter.
    const w = this.warmth / WARMTH.max;
    const cold = this.warmth < 30;
    this.heroGlow.setPosition(this.hero.x, this.hero.y).setScale(0.7 + w * 1.5).setAlpha(0.18 + w * 0.4);
    this.heroGlow.setTint(cold ? 0x8fa8ff : 0xffd9a8);
    this.hero.setTint(cold ? 0xa9bdff : 0xffffff);
    this.frost.setAlpha(Phaser.Math.Clamp((45 - this.warmth) / 45, 0, 1) * 0.75);

    for (const l of this.lanterns) {
      if (l.lit) {
        l.power = Math.min(1, l.power + dt / 400);
        l.sprite.setTint(0xffe9b0);
        l.glow.setAlpha(l.power * (0.5 + 0.06 * Math.sin(time * 0.01 + l.x)));
      }
    }
    const allLit = this.lanterns.every((l) => l.lit);
    this.doorGlow.setAlpha(allLit ? 0.55 + 0.08 * Math.sin(time * 0.006) : 0);
    this.doorSprite.setTint(allLit ? 0xffe9b0 : 0xb4c3ee);

    this.windSnd?.setVolume(this.inWind ? 0.5 : 0.07);
    // Music steps back while people talk, then returns.
    const want = this.dialog.active ? 0.13 : 0.32;
    this.musicVol += (want - this.musicVol) * Math.min(1, dt * 0.004);
    (this.music as Phaser.Sound.WebAudioSound | undefined)?.setVolume?.(this.musicVol);
    // The camera leans the way you run, so you can see further ahead.
    const body = this.hero.body as Phaser.Physics.Arcade.Body;
    this.lookAhead += (Phaser.Math.Clamp(body.velocity.x * 0.35, -60, 60) - this.lookAhead) * Math.min(1, dt * 0.004);
    this.cameras.main.setFollowOffset(-this.lookAhead, 0);
    // Low warmth: the frost pulses and a low note sounds once.
    if (this.warmth < 25 && !this.lowWarned && !this.finished) { this.lowWarned = true; this.sound.play('lowDown', { volume: 0.2, rate: 0.7 }); this.say('Getting cold.\nFind a lit lantern.', 1800); }
    if (this.warmth > 45) this.lowWarned = false;
    if (this.warmth < 25) this.frost.setAlpha(this.frost.alpha * (0.85 + 0.15 * Math.sin(time * 0.008)));

    // Warmth bar: orange when warm, blue when cold.
    const g = this.bar;
    g.clear();
    g.fillStyle(0x0a1020, 0.7).fillRect(14, 26, 184, 16);
    g.fillStyle(Phaser.Display.Color.GetColor(Math.round(110 + 145 * w), Math.round(120 + 80 * w), Math.round(255 - 150 * w)), 1)
      .fillRect(16, 28, 180 * w, 12);
    g.lineStyle(2, this.inWind ? 0x9db8ff : 0xffd27a, 0.9).strokeRect(14, 26, 184, 16);
    this.hudTxt[0]!.setText(`${this.sparks}`);
    this.hudTxt[1]!.setText(`${this.lanterns.filter((l) => l.lit).length}/${this.lanterns.length}`);
    this.hudTxt[2]!.setText(`${this.gemsGot}/${this.gemItems.length}`);
    // The spark icon bobs when you are carrying one, as a reminder to go light a lantern.
    this.hudIcons[0]!.setScale(this.sparks > 0 ? 1.7 + Math.sin(time * 0.012) * 0.25 : 1.7);

    for (const s of this.signText) {
      const near = Math.abs(this.hero.x - s.x) < 150 && Math.abs(this.hero.y - s.top) < 120;
      s.text.setAlpha(Phaser.Math.Clamp(s.text.alpha + (near ? 1 : -1) * dt * 0.006, 0, 1));
    }
  }
}
