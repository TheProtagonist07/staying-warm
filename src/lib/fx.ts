import Phaser from 'phaser';
import { PX } from './pixel';

type Emitter = Phaser.GameObjects.Particles.ParticleEmitter;

/** One-shot particle effects. Gameplay code calls one method; this file owns how each effect looks. */
export class Fx {
  private dustE: Emitter;
  private leafE: Emitter[];
  private sparkE: Emitter;
  private trailE: Emitter;
  private emberE: Emitter;

  constructor(scene: Phaser.Scene) {
    this.dustE = scene.add.particles(0, 0, 'puff', {
      lifespan: { min: 220, max: 420 }, speed: { min: 8, max: 38 }, angle: { min: 200, max: 340 },
      gravityY: -20, scale: PX, alpha: { start: 0.5, end: 0 }, tint: 0x8fa3d6, emitting: false,
    }).setDepth(21);
    this.leafE = [0, 1, 2].map((i) => scene.add.particles(0, 0, `leaf${i}`, {
      lifespan: { min: 700, max: 1300 }, speed: { min: 40, max: 130 }, angle: { min: 215, max: 325 },
      gravityY: 260, scale: PX, rotate: { min: 0, max: 360 }, alpha: { start: 1, end: 0, ease: 'Quad.easeIn' },
      emitting: false,
    }).setDepth(22));
    this.sparkE = scene.add.particles(0, 0, 'spark', {
      lifespan: { min: 300, max: 620 }, speed: { min: 30, max: 110 }, angle: { min: 0, max: 360 },
      scale: { start: PX, end: 0 }, alpha: { start: 1, end: 0 }, blendMode: 'ADD', emitting: false,
    }).setDepth(23);
    this.trailE = scene.add.particles(0, 0, 'dust', {
      lifespan: 420, speed: { min: 0, max: 8 }, scale: { start: 0.9, end: 0 }, alpha: { start: 0.55, end: 0 },
      tint: 0xffe9a8, blendMode: 'ADD', emitting: false,
    }).setDepth(19);
    this.emberE = scene.add.particles(0, 0, 'dot', {
      lifespan: { min: 900, max: 1700 }, speedX: { min: -14, max: 14 }, speedY: { min: -55, max: -18 },
      scale: PX, alpha: { start: 1, end: 0 }, tint: 0xffc46a, blendMode: 'ADD', emitting: false,
    }).setDepth(23);
  }

  /** Puff kicked up by feet: landing, jumping, running. */
  dust(x: number, y: number, n = 4): void { this.dustE.emitParticleAt(x, y, n); }

  /** Leaves thrown up out of a pile. */
  leaves(x: number, y: number, n = 9): void {
    for (const e of this.leafE) e.emitParticleAt(x, y, Math.ceil(n / 3));
  }

  /** Burst of little glints, tinted to match whatever just lit up or got collected. */
  sparks(x: number, y: number, n = 10, tint = 0xffffff): void {
    this.sparkE.setParticleTint(tint);
    this.sparkE.emitParticleAt(x, y, n);
  }

  /** One fading dot of the fox's tail light. Call it often while moving to draw a ribbon. */
  trail(x: number, y: number): void { this.trailE.emitParticleAt(x, y, 1); }

  /** Warm specks that float upward from something burning. */
  embers(x: number, y: number, n = 6): void { this.emberE.emitParticleAt(x, y, n); }
}
