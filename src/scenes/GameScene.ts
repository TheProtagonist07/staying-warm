import Phaser from 'phaser';
import {
  makeForeground, makeFog, makeGlow, makeGrain, makeMidground, makeSky, makeSkyline, makeVignette, rng,
} from '../lib/atmosphere';
import { sfx } from '../lib/sfx';
import { CHECKPOINT, EXIT, LAMPS, ORBS, PLATFORMS, SPAWN, WORLD_W } from '../level';

const W = 960, H = 540;
const ACCENTS = [0x4a6bff, 0xff4a3a, 0xff9a3c]; // blue, red, orange; press C to cycle

// Practice game on the look prototype: collect every light orb, then reach the door.
export class GameScene extends Phaser.Scene {
  private solids!: Phaser.Physics.Arcade.StaticGroup;
  private player!: Phaser.GameObjects.Rectangle;
  private body!: Phaser.Physics.Arcade.Body;
  private playerGlow!: Phaser.GameObjects.Image;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private lamps: { glow: Phaser.GameObjects.Image; phase: number }[] = [];
  private tinted: (Phaser.GameObjects.Image | Phaser.GameObjects.TileSprite)[] = [];
  private accent = 0;
  private spawn = { ...SPAWN };
  private orbsGot = 0;
  private won = false;
  private elapsed = 0;
  private hud!: Phaser.GameObjects.Text;
  private door!: Phaser.GameObjects.Rectangle;
  private doorGlow!: Phaser.GameObjects.Image;
  private coyote = 0;
  private buffer = 0;
  private jumpCut = false;
  private far!: Phaser.GameObjects.TileSprite;
  private mid!: Phaser.GameObjects.TileSprite;
  private near!: Phaser.GameObjects.TileSprite;
  private fogBack!: Phaser.GameObjects.TileSprite;
  private fogFront!: Phaser.GameObjects.TileSprite;
  private grain!: Phaser.GameObjects.TileSprite;
  private dust: { s: Phaser.GameObjects.Image; vx: number; vy: number }[] = [];

  constructor() { super('Game'); }

  create(): void {
    this.lamps = []; this.tinted = []; this.dust = [];
    this.spawn = { ...SPAWN }; this.orbsGot = 0; this.won = false; this.elapsed = 0;
    if (!this.textures.exists('grain')) this.buildTextures(); // survive scene.restart()
    this.buildBackdrop();
    this.buildLevel();
    this.buildPlayer();
    this.buildPickups();
    this.buildAtmosphere();
    this.hud = this.add.text(20, 18, '', { fontFamily: 'monospace', fontSize: '16px', color: '#9db8ff' })
      .setScrollFactor(0).setDepth(60);
    this.updateHud();

    this.cameras.main.setBounds(0, 0, WORLD_W, H).startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.fadeIn(600, 0, 0, 0);
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,UP,LEFT,RIGHT,SPACE,Z,C') as typeof this.keys;
    this.keys.R = this.input.keyboard!.addKey('R');
    this.keys.C.on('down', () => this.setAccent((this.accent + 1) % ACCENTS.length));

    const hint = this.add.text(W / 2, H - 28, 'A / D move   Space jump   collect every orb, then reach the door   C light', {
      fontFamily: 'monospace', fontSize: '14px', color: '#6f7fae',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(60);
    this.tweens.add({ targets: hint, alpha: 0, delay: 6000, duration: 1500 });
  }

  private buildTextures(): void {
    makeSky(this, 'sky', W, H, '#070e26', '#020307');
    makeSkyline(this, 'far', W, H, 0x0a1230, 3);
    makeMidground(this, 'mid', W, H, 0x060a17, 5);
    makeForeground(this, 'near', W, H, 9);
    makeFog(this, 'fog', 512, 220);
    makeGlow(this, 'glow', 256);
    makeGlow(this, 'dust', 10);
    makeVignette(this, 'vignette', W, H);
    makeGrain(this, 'grain');
  }

  private buildBackdrop(): void {
    const fixed = <T extends Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.ScrollFactor>(o: T) =>
      o.setScrollFactor(0) as T;
    fixed(this.add.image(0, 0, 'sky').setOrigin(0, 0).setDepth(0));
    // soft moonlight behind the skyline
    const moon = this.add.image(W * 0.7, H * 0.3, 'glow').setScale(4).setTint(0x2c4a9a).setAlpha(0.22)
      .setBlendMode(Phaser.BlendModes.ADD).setDepth(1);
    fixed(moon);
    this.far = fixed(this.add.tileSprite(0, 0, W, H, 'far').setOrigin(0, 0).setDepth(2));
    this.fogBack = fixed(this.add.tileSprite(0, 270, W, 220, 'fog').setOrigin(0, 0).setDepth(3).setAlpha(0.16));
    this.mid = fixed(this.add.tileSprite(0, 0, W, H, 'mid').setOrigin(0, 0).setDepth(4));
    this.tinted.push(this.fogBack);
  }

  private buildLevel(): void {
    const solids = this.physics.add.staticGroup();
    for (const [x, top, w] of PLATFORMS) {
      const h = 800 - top;
      const block = this.add.rectangle(x + w / 2, top + h / 2, w, h, 0x04060c).setDepth(10);
      solids.add(block);
      // thin cool rim on the walkable edge: the "readable surface" trick
      this.add.rectangle(x + w / 2, top + 1, w, 2, 0x4a6099).setDepth(11);
    }
    this.physics.world.setBounds(0, -200, WORLD_W, H + 600);
    this.solids = solids;

    // hanging lamps: a bright bar plus an additive glow pool that flickers
    for (const [x, y] of LAMPS) {
      this.add.rectangle(x, y, 64, 3, 0xdfe8ff).setDepth(12);
      this.add.rectangle(x, y / 2 - 2, 1, y - 4, 0x0a0f1e).setDepth(9); // cable
      const glow = this.add.image(x, y + 50, 'glow').setScale(1.9).setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(13).setTint(ACCENTS[0]).setAlpha(0.45);
      this.lamps.push({ glow, phase: Math.random() * 10 });
      this.tinted.push(glow);
    }

    // a few small birds on ledges give the dead world a little life
    const r = rng(21);
    for (let i = 0; i < 6; i++) {
      const p = PLATFORMS[Math.floor(r() * PLATFORMS.length)]!;
      this.add.rectangle(p[0] + 12 + r() * (p[2] - 24), p[1] - 3, 5, 5, 0xdfe8ff).setDepth(12);
    }
  }

  private buildPlayer(): void {
    this.player = this.add.rectangle(SPAWN.x, SPAWN.y, 14, 20, 0xf2f6ff).setDepth(20);
    this.physics.add.existing(this.player);
    this.body = this.player.body as Phaser.Physics.Arcade.Body;
    this.body.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.solids);
    this.playerGlow = this.add.image(0, 0, 'glow').setScale(1.0).setBlendMode(Phaser.BlendModes.ADD)
      .setTint(0xcfdcff).setAlpha(0.55).setDepth(21);
  }


  private buildPickups(): void {
    // orbs: small bright core + additive glow, bobbing gently
    const orbs = this.physics.add.staticGroup();
    for (const [x, y] of ORBS) {
      const core = this.add.rectangle(x, y, 8, 8, 0xffffff).setDepth(14).setAngle(45);
      const glow = this.add.image(x, y, 'glow').setScale(0.6).setBlendMode(Phaser.BlendModes.ADD)
        .setTint(0x9db8ff).setDepth(14).setAlpha(0.8);
      this.tweens.add({ targets: [core, glow], y: y - 6, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      core.setData('glow', glow);
      orbs.add(core);
      // pickup box is much bigger than the 8px sprite: near misses should count
      (core.body as Phaser.Physics.Arcade.StaticBody).setSize(24, 24);
    }
    this.physics.add.overlap(this.player, orbs, (_p, o) => {
      const core = o as Phaser.GameObjects.Rectangle;
      (core.getData('glow') as Phaser.GameObjects.Image).destroy();
      core.destroy();
      this.orbsGot++;
      sfx.pickup();
      this.updateHud();
      if (this.orbsGot === ORBS.length) this.openDoor();
    });

    // checkpoint beacon: dim until touched, then lights up
    const cp = this.add.rectangle(CHECKPOINT.x, CHECKPOINT.topY - 14, 4, 28, 0x2a3a66).setDepth(12);
    const cpGlow = this.add.image(CHECKPOINT.x, CHECKPOINT.topY - 30, 'glow').setScale(0.7)
      .setBlendMode(Phaser.BlendModes.ADD).setTint(0xffd27a).setDepth(13).setAlpha(0);
    this.physics.add.existing(cp, true);
    this.physics.add.overlap(this.player, cp, () => {
      if (this.spawn.x === CHECKPOINT.x) return;
      this.spawn = { x: CHECKPOINT.x, y: CHECKPOINT.topY - 40 };
      cp.setFillStyle(0xffd27a);
      this.tweens.add({ targets: cpGlow, alpha: 0.7, duration: 400 });
      sfx.win();
    });

    // exit door: closed (dark) until every orb is collected
    this.door = this.add.rectangle(EXIT.x, EXIT.topY - 30, 34, 60, 0x0b1022).setDepth(12)
      .setStrokeStyle(2, 0x4a6099);
    this.doorGlow = this.add.image(EXIT.x, EXIT.topY - 30, 'glow').setScale(1.4)
      .setBlendMode(Phaser.BlendModes.ADD).setTint(0xffe9b0).setDepth(13).setAlpha(0);
    this.physics.add.existing(this.door, true);
    this.physics.add.overlap(this.player, this.door, () => {
      if (this.orbsGot === ORBS.length && !this.won) this.win();
    });
  }

  private openDoor(): void {
    this.door.setFillStyle(0xffe9b0).setStrokeStyle(2, 0xffffff);
    this.tweens.add({ targets: this.doorGlow, alpha: 0.85, duration: 600 });
    sfx.win();
  }

  private updateHud(): void {
    this.hud.setText(`orbs ${this.orbsGot}/${ORBS.length}`);
  }

  private win(): void {
    this.won = true;
    this.body.setVelocity(0, 0);
    this.body.setAllowGravity(false);
    const secs = (this.elapsed / 1000).toFixed(1);
    this.add.rectangle(0, 0, W, H, 0x000000, 0.6).setOrigin(0, 0).setScrollFactor(0).setDepth(70);
    this.add.text(W / 2, H / 2 - 20, 'LIGHT RESTORED', { fontFamily: 'monospace', fontSize: '44px', color: '#ffe9b0' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(71);
    this.add.text(W / 2, H / 2 + 34, `${secs}s   press R to play again`, { fontFamily: 'monospace', fontSize: '18px', color: '#9db8ff' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(71);
    sfx.win();
  }

  private buildAtmosphere(): void {
    this.near = this.add.tileSprite(0, 0, W, H, 'near').setOrigin(0, 0).setScrollFactor(0).setDepth(30);
    this.fogFront = this.add.tileSprite(0, 330, W, 220, 'fog').setOrigin(0, 0).setScrollFactor(0).setDepth(31).setAlpha(0.07);
    this.tinted.push(this.fogFront);
    this.add.image(0, 0, 'vignette').setOrigin(0, 0).setScrollFactor(0).setDepth(50);
    this.grain = this.add.tileSprite(0, 0, W, H, 'grain').setOrigin(0, 0).setScrollFactor(0).setDepth(51).setAlpha(0.4);

    // floating dust motes catching the light
    const r = rng(33);
    for (let i = 0; i < 40; i++) {
      const s = this.add.image(r() * W, r() * H, 'dust').setScrollFactor(0).setDepth(22)
        .setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.15 + r() * 0.35).setScale(0.4 + r() * 0.6);
      this.dust.push({ s, vx: (r() - 0.5) * 6, vy: -2 - r() * 6 });
    }
    this.setAccent(0, true);
  }

  private setAccent(i: number, silent = false): void {
    this.accent = i;
    const c = ACCENTS[i]!;
    const dim = Phaser.Display.Color.ValueToColor(c).darken(55).color;
    for (const o of this.tinted) o.setTint(o instanceof Phaser.GameObjects.TileSprite ? dim : c);
    if (!silent) sfx.pickup();
  }

  update(time: number, dt: number): void {
    if (this.won) {
      if (Phaser.Input.Keyboard.JustDown(this.keys.R)) this.scene.restart();
    } else {
      this.elapsed += dt;
      this.move(dt);
    }

    // parallax: far layers scroll slower than the camera, near layers faster
    const sx = this.cameras.main.scrollX;
    this.far.tilePositionX = sx * 0.12;
    this.mid.tilePositionX = sx * 0.45;
    this.near.tilePositionX = sx * 1.4;
    this.fogBack.tilePositionX = sx * 0.3 + time * 0.012;
    this.fogFront.tilePositionX = sx * 1.1 - time * 0.02;

    // film grain: jump the tile to a random offset every ~3rd frame
    if (Math.floor(time / 40) !== Math.floor((time - dt) / 40)) {
      this.grain.tilePositionX = Math.floor(Math.random() * 128);
      this.grain.tilePositionY = Math.floor(Math.random() * 128);
    }

    // lamp flicker: slow wobble plus the occasional hard dip
    for (const l of this.lamps) {
      const dip = Math.random() < 0.008 ? -0.35 : 0;
      l.glow.setAlpha(Math.max(0.15, 0.45 + Math.sin(time * 0.003 + l.phase) * 0.05 + dip));
    }

    for (const d of this.dust) {
      d.s.x += d.vx * dt * 0.001; d.s.y += d.vy * dt * 0.001;
      if (d.s.y < -5) d.s.y = H + 5;
      if (d.s.x < -5) d.s.x = W + 5; else if (d.s.x > W + 5) d.s.x = -5;
    }

    this.playerGlow.setPosition(this.player.x, this.player.y).setAlpha(0.55 + Math.sin(time * 0.004) * 0.05);

    if (this.player.y > H + 120) this.respawn();
  }

  private move(dt: number): void {
    const k = this.keys;
    const dir = (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0);
    const jumpKey = k.SPACE.isDown || k.W.isDown || k.UP.isDown || k.Z.isDown;
    const jumpPressed = [k.SPACE, k.W, k.UP, k.Z].some((key) => Phaser.Input.Keyboard.JustDown(key));
    const grounded = this.body.blocked.down || this.body.touching.down;

    // coyote time + jump buffer: forgiveness windows that make jumping feel fair
    this.coyote = grounded ? 110 : this.coyote - dt;
    this.buffer = jumpPressed ? 120 : this.buffer - dt;

    const target = dir * 175;
    this.body.setVelocityX(this.body.velocity.x + (target - this.body.velocity.x) * Math.min(1, dt * 0.02));

    if (this.buffer > 0 && this.coyote > 0) {
      this.body.setVelocityY(-470);
      this.buffer = 0; this.coyote = 0; this.jumpCut = false;
      sfx.pickup();
    }
    // release early = shorter hop
    if (!jumpKey && this.body.velocity.y < -150 && !this.jumpCut) {
      this.body.setVelocityY(this.body.velocity.y * 0.5);
      this.jumpCut = true;
    }
  }

  private respawn(): void {
    this.body.reset(this.spawn.x, this.spawn.y);
    this.cameras.main.fadeIn(400, 0, 0, 0);
    sfx.hit();
  }
}
