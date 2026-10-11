import Phaser from 'phaser';
import { makeGlow, makeGrain, makeSky, makeVignette, rng } from '../lib/atmosphere';
import { makeDisc, makeDot, makeRidge } from '../lib/scenery';
import {
  BATS, DOOR, FLAGS, GEMS, LANTERNS, PLATFORMS, S, SIGNS, SPARKS, SPAWN, T, WALKERS, WARMTH, WIND,
  WORLD_H, WORLD_W,
} from '../level';

const W = 960, H = 540;
const HERO_FRAME = 24;            // size of one character frame in the art
const DEPTH = { sky: 0, far: 2, near: 4, tiles: 10, props: 12, items: 14, mob: 18, hero: 20, fx: 24, dark: 40, light: 41 };

interface Mob {
  kind: 'slug' | 'spiker' | 'bat'; sprite: Phaser.GameObjects.Sprite;
  x0: number; y0: number; minX: number; maxX: number; dir: number; alive: boolean; t: number;
}
interface Lantern {
  x: number; top: number; lit: boolean; power: number; sprite: Phaser.GameObjects.Image; glow: Phaser.GameObjects.Image;
}
interface Pickup { x: number; y: number; got: boolean; sprite: Phaser.GameObjects.Image; glow: Phaser.GameObjects.Image }

export class GameScene extends Phaser.Scene {
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
  private won = false;
  private endAt = 0;
  private invuln = 0;
  private stun = 0;
  private coyote = 0;
  private buffer = 0;
  private stepT = 0;
  private spawn = { ...SPAWN };
  private inWind = false;
  private wasGrounded = true;

  private lanterns: Lantern[] = [];
  private sparkItems: Pickup[] = [];
  private gemItems: Pickup[] = [];
  private mobs: Mob[] = [];
  private doorSprite!: Phaser.GameObjects.Image;
  private doorGlow!: Phaser.GameObjects.Image;
  private flags: Phaser.GameObjects.Image[] = [];
  private signText: { x: number; top: number; text: Phaser.GameObjects.Text }[] = [];

  private far!: Phaser.GameObjects.TileSprite;
  private near!: Phaser.GameObjects.TileSprite;
  private grain!: Phaser.GameObjects.TileSprite;
  private stars: { s: Phaser.GameObjects.Image; phase: number }[] = [];
  private burstE!: Phaser.GameObjects.Particles.ParticleEmitter;
  private dustE!: Phaser.GameObjects.Particles.ParticleEmitter;
  private music?: Phaser.Sound.BaseSound;
  private windSnd?: Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound;

  private bar!: Phaser.GameObjects.Graphics;
  private hud!: Phaser.GameObjects.Text;
  private toast!: Phaser.GameObjects.Text;
  private toastT = 0;

  constructor() { super('Game'); }

  create(): void {
    this.warmth = WARMTH.max; this.sparks = 0; this.gemsGot = 0; this.freezes = 0; this.elapsed = 0;
    this.won = false; this.invuln = 0; this.stun = 0; this.spawn = { ...SPAWN }; this.inWind = false;
    this.lanterns = []; this.sparkItems = []; this.gemItems = []; this.mobs = []; this.flags = [];
    this.signText = []; this.stars = []; this.wasGrounded = true; this.toastT = 0; this.jumpWas = false;

    this.buildTextures();
    this.buildBackdrop();
    const solids = this.buildWorld();
    this.buildItems();
    this.buildMobs();
    this.buildHero(solids);
    this.buildAtmosphere();
    this.buildHud();
    this.buildInput();

    this.physics.world.setBounds(0, -400, WORLD_W, WORLD_H + 800);
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H).startFollow(this.hero, true, 0.1, 0.1);
    this.cameras.main.setDeadzone(60, 80);
    this.cameras.main.fadeIn(700, 0, 0, 0);

    this.music = this.sound.add('music', { loop: true, volume: 0.32 });
    this.music.play();
    this.windSnd = this.sound.add('wind', { loop: true, volume: 0.05 }) as Phaser.Sound.WebAudioSound;
    this.windSnd.play();
    this.events.once('shutdown', () => { this.music?.stop(); this.windSnd?.stop(); });

    this.say('The village below is freezing.\nCarry sparks up the mountain and light every lantern.', 6500);
  }

  // ---------- building the scene ----------

  private buildTextures(): void {
    makeDot(this);
    makeSky(this, 'sky', W, H, '#0a1330', '#1b2a58');
    makeGlow(this, 'glow', 256);
    makeVignette(this, 'vignette', W, H);
    makeGrain(this, 'grain');
    makeDisc(this, 'moon', 26, '#e6ecff', '#c3cdf0');
    makeRidge(this, 'ridge-far', W, H, {
      base: 220, amp: 160, body: '#2c3f78', snow: '#7a90cc',
      waves: [[2, 1, 0.3], [3, 0.7, 1.9], [5, 0.4, 4.1]],
    });
    makeRidge(this, 'ridge-near', W, H, {
      base: 110, amp: 120, body: '#0b1230', snow: '#2b3d74',
      waves: [[3, 1, 2.2], [4, 0.6, 0.7], [7, 0.35, 3.3]],
    });
  }

  private buildBackdrop(): void {
    const fixed = <O extends Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.ScrollFactor>(o: O) => o.setScrollFactor(0) as O;
    fixed(this.add.image(0, 0, 'sky').setOrigin(0, 0).setDepth(DEPTH.sky));
    const r = rng(5);
    for (let i = 0; i < 80; i++) {
      const s = fixed(this.add.image(r() * W, r() * H * 0.6, 'dot').setDepth(DEPTH.sky + 0.5)
        .setAlpha(0.2 + r() * 0.6).setScale(0.5 + r() * 0.6));
      this.stars.push({ s, phase: r() * 10 });
    }
    fixed(this.add.image(W * 0.78, 96, 'glow').setScale(3.4).setTint(0x4a62b8).setAlpha(0.3)
      .setBlendMode(Phaser.BlendModes.ADD).setDepth(DEPTH.sky + 0.6));
    fixed(this.add.image(W * 0.78, 96, 'moon').setDepth(DEPTH.sky + 0.7));
    this.far = fixed(this.add.tileSprite(0, 0, W, H, 'ridge-far').setOrigin(0, 0).setDepth(DEPTH.far));
    this.near = fixed(this.add.tileSprite(0, 0, W, H, 'ridge-near').setOrigin(0, 0).setDepth(DEPTH.far + 1));
  }

  /** Tiles, scenery and the invisible collision boxes. Returns the solid group. */
  private buildWorld(): Phaser.Physics.Arcade.StaticGroup {
    const solids = this.physics.add.staticGroup();
    const r = rng(11);
    PLATFORMS.forEach((p, n) => {
      const snowy = p.row <= 17;
      const left = p.col * T, top = p.row * T, width = p.w * T;
      // One collision box per platform. The tiles are only paint.
      solids.add(this.add.rectangle(left + width / 2, top + (WORLD_H - top) / 2 + 200, width, WORLD_H - top + 400).setVisible(false));
      // Dark mass under the visible tile rows, so the cliff reads against the sky.
      this.add.rectangle(left + width / 2, top + 4 * T + (WORLD_H - top) / 2, width, WORLD_H - top, 0x0e1428).setDepth(DEPTH.tiles - 1);
      for (let c = 0; c < p.w; c++) {
        const first = c === 0, last = c === p.w - 1;
        const topTile = snowy ? (first ? 80 : last ? 83 : 81 + (c % 2)) : (first ? 0 : last ? 3 : 1 + (c % 2));
        this.tile(left + c * T, top, topTile, DEPTH.tiles);
        for (let k = 1; k <= 3; k++) this.tile(left + c * T, top + k * T, [4, 5, 24, 25][Math.floor(r() * 4)]!, DEPTH.tiles);
      }
      // A few plain props so the ground isn't bare.
      if (p.w >= 5 && n > 0) {
        for (let i = 0; i < Math.floor(p.w / 3); i++) {
          const kind = [126, 126, 128, 124, 125][Math.floor(r() * 5)]!;
          this.add.image(left + (1 + r() * (p.w - 2)) * T, top, 'tiles', kind).setOrigin(0.5, 1).setScale(S).setDepth(DEPTH.props - 1);
        }
      }
    });

    for (const sgn of SIGNS) {
      this.add.image(sgn.x, sgn.top, 'tiles', 86).setOrigin(0.5, 1).setScale(S).setDepth(DEPTH.props);
      const text = this.add.text(sgn.x, sgn.top - 2 * T - 10, sgn.text, {
        fontFamily: 'monospace', fontSize: '13px', color: '#101624', backgroundColor: '#e8e2cf',
        padding: { x: 6, y: 4 }, align: 'center',
      }).setOrigin(0.5, 1).setDepth(DEPTH.fx).setAlpha(0);
      this.signText.push({ x: sgn.x, top: sgn.top, text });
    }

    for (const wz of WIND) {
      this.add.rectangle(wz.x + wz.w / 2, wz.y + wz.h / 2, wz.w, wz.h, 0x9db8ff, 0.07).setDepth(DEPTH.dark - 1);
      this.add.particles(0, 0, 'dot', {
        emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(wz.x, wz.y + wz.h * 0.25, wz.w, wz.h * 0.5), quantity: 1 },
        lifespan: 700, speedX: { min: -330, max: -240 }, speedY: { min: -10, max: 14 },
        scaleX: { start: 7, end: 2 }, scaleY: 0.6, alpha: { start: 0.55, end: 0 }, frequency: 45, blendMode: 'ADD',
      } as Phaser.Types.GameObjects.Particles.ParticleEmitterConfig).setDepth(DEPTH.light);
    }
    return solids;
  }

  private tile(x: number, y: number, frame: number, depth: number): void {
    this.add.image(x, y, 'tiles', frame).setOrigin(0, 0).setScale(S).setDepth(depth);
  }

  private buildItems(): void {
    for (const f of FLAGS) {
      this.flags.push(this.add.image(f.x, f.top, 'tiles', 111).setOrigin(0.5, 1).setScale(S).setDepth(DEPTH.props));
    }
    this.tweens.addCounter({
      from: 0, to: 1, duration: 450, yoyo: true, repeat: -1,
      onUpdate: (c) => this.flags.forEach((f) => f.setFrame(c.getValue()! > 0.5 ? 112 : 111)),
    });

    // The door is two tiles tall: 130 on top of 150.
    this.add.image(DOOR.x, DOOR.top, 'tiles', 150).setOrigin(0.5, 1).setScale(S).setDepth(DEPTH.props);
    this.doorSprite = this.add.image(DOOR.x, DOOR.top - T, 'tiles', 130).setOrigin(0.5, 1).setScale(S).setDepth(DEPTH.props);
    this.doorGlow = this.add.image(DOOR.x, DOOR.top - T, 'glow').setScale(2.6).setTint(0xffd27a)
      .setBlendMode(Phaser.BlendModes.ADD).setDepth(DEPTH.light).setAlpha(0);

    for (const l of LANTERNS) {
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
    for (const p of SPARKS) this.sparkItems.push(pickup(p, 151, 0xffc46a, 0.55));
    for (const p of GEMS) this.gemItems.push(pickup(p, 67, 0x6ad0ff, 0.5));
  }

  private buildMobs(): void {
    for (const w of WALKERS) {
      const sprite = this.add.sprite(w.x, w.top, 'chars', 0).setOrigin(0.5, 1).setScale(S).setDepth(DEPTH.mob).play(w.kind);
      this.mobs.push({ kind: w.kind, sprite, x0: w.x, y0: w.top, minX: w.minX, maxX: w.maxX, dir: 1, alive: true, t: 0 });
    }
    for (const b of BATS) {
      const sprite = this.add.sprite(b.x, b.y, 'chars', 24).setScale(S).setDepth(DEPTH.mob).play('bat');
      this.mobs.push({ kind: 'bat', sprite, x0: b.x, y0: b.y, minX: 0, maxX: 0, dir: 1, alive: true, t: Math.random() * 6 });
    }
  }

  private buildHero(solids: Phaser.Physics.Arcade.StaticGroup): void {
    this.heroGlow = this.add.image(SPAWN.x, SPAWN.y, 'glow').setTint(0xffd9a8).setBlendMode(Phaser.BlendModes.ADD).setDepth(DEPTH.light);
    this.hero = this.physics.add.sprite(SPAWN.x, SPAWN.y, 'chars', 6).setScale(S).setDepth(DEPTH.hero);
    this.hero.body!.setSize(12, 20).setOffset((HERO_FRAME - 12) / 2, 3);
    this.hero.setCollideWorldBounds(true);
    this.hero.play('hero-idle');
    this.physics.add.collider(this.hero, solids);
  }

  private buildAtmosphere(): void {
    // Everything is multiplied by a cold blue so the bright art sits in the night; lights are added on top.
    this.add.rectangle(0, 0, W, H, 0x6a7ab0).setOrigin(0, 0).setScrollFactor(0).setDepth(DEPTH.dark)
      .setBlendMode(Phaser.BlendModes.MULTIPLY);
    this.add.image(0, 0, 'vignette').setOrigin(0, 0).setScrollFactor(0).setDepth(50);
    this.grain = this.add.tileSprite(0, 0, W, H, 'grain').setOrigin(0, 0).setScrollFactor(0).setDepth(51).setAlpha(0.28);

    this.add.particles(0, 0, 'dot', {
      x: { min: 0, max: W }, y: -10, lifespan: 7000, speedY: { min: 35, max: 85 }, speedX: { min: -35, max: -10 },
      scale: { min: 1, max: 2.4 }, alpha: { min: 0.4, max: 0.9 }, frequency: 70,
    }).setScrollFactor(0).setDepth(DEPTH.fx);

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
    this.hud = this.add.text(W - 16, 14, '', { fontFamily: 'monospace', fontSize: '15px', color: '#dfe8ff', align: 'right' })
      .setOrigin(1, 0).setScrollFactor(0).setDepth(60);
    this.add.text(16, 8, 'WARMTH', { fontFamily: 'monospace', fontSize: '13px', color: '#ffd27a' }).setScrollFactor(0).setDepth(60);
    this.toast = this.add.text(W / 2, 90, '', {
      fontFamily: 'monospace', fontSize: '17px', color: '#ffffff', align: 'center', backgroundColor: '#0a1020cc', padding: { x: 10, y: 6 },
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(60).setAlpha(0);
  }

  private buildInput(): void {
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,UP,LEFT,RIGHT,SPACE,Z,R,M') as typeof this.keys;
    if (!this.sys.game.device.input.touch) return;
    // On-screen buttons for phones and tablets: move on the left, jump on the right.
    const btn = (x: number, y: number, label: string, key: 'left' | 'right' | 'jump', w = 96) => {
      const g = this.add.rectangle(x, y, w, 96, 0xffffff, 0.14).setStrokeStyle(2, 0xffffff, 0.4)
        .setScrollFactor(0).setDepth(70).setInteractive();
      this.add.text(x, y, label, { fontFamily: 'monospace', fontSize: '34px', color: '#ffffff' })
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
    const restart = Phaser.Input.Keyboard.JustDown(this.keys.R!);
    if (Phaser.Input.Keyboard.JustDown(this.keys.M!)) this.sound.mute = !this.sound.mute; // M toggles all sound
    if (this.won) {
      if (restart || (this.input.activePointer.isDown && this.time.now > this.endAt)) this.scene.restart();
    } else {
      this.elapsed += dt;
      this.moveHero(dt);
      this.updateWarmth(dt);
      this.updateMobs(time, dt);
      this.updatePickups();
    }
    this.updateLooks(time, dt);

    if (this.toastT > 0) {
      this.toastT -= dt;
      if (this.toastT < 400) this.toast.setAlpha(Math.max(0, this.toastT / 400));
    }
    if (!this.won && this.hero.y > WORLD_H + 80) this.freeze(true);
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
      this.sound.play('phaseJump1', { volume: 0.28 });
      this.dustE.emitParticleAt(this.hero.x, this.hero.y + 28, 4);
    }
    if (!jumpDown && body.velocity.y < -150) body.setVelocityY(body.velocity.y * 0.5); // release early = short hop

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
    this.inWind = WIND.some((w) => this.hero.x > w.x && this.hero.x < w.x + w.w && this.hero.y > w.y && this.hero.y < w.y + w.h);
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
    this.warmth = Math.max(0, this.warmth - WARMTH.hit);
    this.invuln = 1200; this.stun = 240;
    this.hero.setVelocity((this.hero.x >= fromX ? 1 : -1) * 170, -300);
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
      this.say(`Star shard ${this.gemsGot} of ${GEMS.length}`, 1500);
    }
    for (const l of this.lanterns) {
      if (l.lit || Math.abs(hx - l.x) > 54 || Math.abs(hy - (l.top - T)) > 90) continue;
      if (this.sparks < 1) {
        if (this.toastT <= 0) this.say('This lantern is cold.\nFind a spark first.', 1600);
        continue;
      }
      this.sparks--;
      l.lit = true;
      this.spawn = { x: l.x, y: l.top - 40 };
      this.warmth = Math.min(WARMTH.max, this.warmth + 40);
      this.burstE.setParticleTint(0xffc46a);
      this.burstE.emitParticleAt(l.x, l.top - T, 18);
      this.burstE.setParticleTint(0xffffff);
      this.sound.play('impactBell_heavy_000', { volume: 0.5 });
      const lit = this.lanterns.filter((q) => q.lit).length;
      this.say(lit === this.lanterns.length ? 'Every lantern is lit!\nGo to the door.' : `Lantern lit  ${lit} / ${this.lanterns.length}`, 2000);
    }
    const allLit = this.lanterns.every((l) => l.lit);
    if (Math.abs(hx - DOOR.x) < 38 && Math.abs(hy - (DOOR.top - T)) < 70) {
      if (allLit) this.win();
      else if (this.toastT <= 0) this.say(`The door is frozen shut.\nLight all ${this.lanterns.length} lanterns first.`, 2000);
    }
  }

  private win(): void {
    this.won = true;
    this.endAt = this.time.now + 1500;
    const body = this.hero.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0); body.setAllowGravity(false);
    this.sound.play('pepSound2', { volume: 0.5 });
    this.burstE.emitParticleAt(DOOR.x, DOOR.top - T, 30);
    const secs = Math.round(this.elapsed / 1000);
    const lines = [
      'WARM AGAIN',
      '',
      'The lanterns are burning all the way down the mountain.',
      'The village will see them.',
      '',
      `time ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}    star shards ${this.gemsGot} / ${GEMS.length}    froze ${this.freezes}x`,
      '',
      'press R or tap to play again',
    ];
    this.add.rectangle(0, 0, W, H, 0x000000, 0.65).setOrigin(0, 0).setScrollFactor(0).setDepth(80);
    this.add.text(W / 2, H / 2, lines.join('\n'), {
      fontFamily: 'monospace', fontSize: '20px', color: '#dfe8ff', align: 'center', lineSpacing: 6,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(81);
  }

  /** Lights, fades and the HUD. */
  private updateLooks(time: number, dt: number): void {
    const cam = this.cameras.main;
    this.far.tilePositionX = cam.scrollX * 0.06; this.far.tilePositionY = cam.scrollY * 0.07;
    this.near.tilePositionX = cam.scrollX * 0.14; this.near.tilePositionY = cam.scrollY * 0.12;
    for (const st of this.stars) st.s.setAlpha(0.35 + 0.35 * Math.sin(time * 0.002 + st.phase));
    if (Math.floor(time / 45) !== Math.floor((time - dt) / 45)) {
      this.grain.tilePositionX = Math.floor(Math.random() * 128);
      this.grain.tilePositionY = Math.floor(Math.random() * 128);
    }

    // The hero's own light shrinks and cools as warmth drops. This is the main way the player sees the meter.
    const w = this.warmth / WARMTH.max;
    const cold = this.warmth < 30;
    this.heroGlow.setPosition(this.hero.x, this.hero.y).setScale(0.7 + w * 1.5).setAlpha(0.18 + w * 0.4);
    this.heroGlow.setTint(cold ? 0x8fa8ff : 0xffd9a8);
    this.hero.setTint(cold ? 0xa9bdff : 0xffffff);

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

    // Warmth bar: orange when warm, blue when cold.
    const g = this.bar;
    g.clear();
    g.fillStyle(0x0a1020, 0.7).fillRect(14, 26, 184, 16);
    g.fillStyle(Phaser.Display.Color.GetColor(Math.round(110 + 145 * w), Math.round(120 + 80 * w), Math.round(255 - 150 * w)), 1)
      .fillRect(16, 28, 180 * w, 12);
    g.lineStyle(2, this.inWind ? 0x9db8ff : 0xffd27a, 0.9).strokeRect(14, 26, 184, 16);
    this.hud.setText(`sparks ${this.sparks}\nlanterns ${this.lanterns.filter((l) => l.lit).length} / ${this.lanterns.length}\nshards ${this.gemsGot} / ${GEMS.length}`);

    for (const s of this.signText) {
      const near = Math.abs(this.hero.x - s.x) < 150 && Math.abs(this.hero.y - s.top) < 120;
      s.text.setAlpha(Phaser.Math.Clamp(s.text.alpha + (near ? 1 : -1) * dt * 0.006, 0, 1));
    }
  }
}
