import Phaser from 'phaser';

// Everything here draws textures from code (canvas gradients, noise, shapes), so the
// look needs no image files. Mini Jam bans AI-generated art; this is fully procedural.

/** Seeded RNG so generated scenery is identical every run. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvasTex(scene: Phaser.Scene, key: string, w: number, h: number) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.createCanvas(key, w, h)!;
  return { tex, ctx: tex.getContext() };
}

/** White radial glow; tint it per light at runtime and draw with ADD blend. */
export function makeGlow(scene: Phaser.Scene, key: string, size: number): void {
  if (scene.textures.exists(key)) return; // keep the old one: scenes that still use it would break if it were rebuilt
  const { tex, ctx } = canvasTex(scene, key, size, size);
  const r = size / 2;
  const g = ctx.createRadialGradient(r, r, 0, r, r, r);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.35)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  tex.refresh();
}

/** Dark corners that pull the eye to the centre. */
export function makeVignette(scene: Phaser.Scene, key: string, w: number, h: number): void {
  if (scene.textures.exists(key)) return; // keep the old one: scenes that still use it would break if it were rebuilt
  const { tex, ctx } = canvasTex(scene, key, w, h);
  const g = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, w * 0.65);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.88)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  tex.refresh();
}

/** Tileable film-grain: random black/white specks with low alpha. */
export function makeGrain(scene: Phaser.Scene, key: string, size = 128): void {
  if (scene.textures.exists(key)) return; // keep the old one: scenes that still use it would break if it were rebuilt
  const { tex, ctx } = canvasTex(scene, key, size, size);
  const img = ctx.createImageData(size, size);
  const rand = rng(7);
  for (let i = 0; i < size * size; i++) {
    const v = rand() < 0.5 ? 0 : 255;
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = rand() * 46;
  }
  ctx.putImageData(img, 0, 0);
  tex.refresh();
}

/** Horizontal fog band: transparent at top and bottom, soft in the middle. Tint at runtime. */
export function makeFog(scene: Phaser.Scene, key: string, w: number, h: number): void {
  if (scene.textures.exists(key)) return; // keep the old one: scenes that still use it would break if it were rebuilt
  const { tex, ctx } = canvasTex(scene, key, w, h);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.55, 'rgba(255,255,255,0.5)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // Break up the band so it reads as drifting mist, not a flat stripe. Wrap-safe: drawn at both edges.
  const rand = rng(11);
  for (let i = 0; i < 14; i++) {
    const x = rand() * w, y = h * (0.25 + rand() * 0.5), r = 40 + rand() * 90;
    for (const dx of [-w, 0, w]) {
      const b = ctx.createRadialGradient(x + dx, y, 0, x + dx, y, r);
      b.addColorStop(0, 'rgba(255,255,255,0.22)');
      b.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = b;
      ctx.fillRect(x + dx - r, y - r, r * 2, r * 2);
    }
  }
  tex.refresh();
}

/** Vertical sky gradient. */
export function makeSky(scene: Phaser.Scene, key: string, w: number, h: number, top: string, bottom: string): void {
  if (scene.textures.exists(key)) return; // keep the old one: scenes that still use it would break if it were rebuilt
  const { tex, ctx } = canvasTex(scene, key, w, h);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  tex.refresh();
}

function gfx(scene: Phaser.Scene): Phaser.GameObjects.Graphics {
  return scene.make.graphics({ x: 0, y: 0 }, false);
}

/** Far layer: distant ruined skyline with a few dim windows. Tiles horizontally. */
export function makeSkyline(scene: Phaser.Scene, key: string, w: number, h: number, color: number, seed: number): void {
  const g = gfx(scene);
  const rand = rng(seed);
  g.fillStyle(color, 1);
  let x = 0;
  while (x < w) {
    const bw = 50 + rand() * 90;
    const bh = 120 + rand() * 230;
    const width = Math.min(bw, w - x);
    g.fillRect(x, h - bh, width, bh);
    if (rand() < 0.5) g.fillRect(x + width * 0.3, h - bh - 30 - rand() * 40, 5 + rand() * 8, 60); // antenna / chimney
    g.fillStyle(0x1d2f5e, 0.55);
    for (let i = 0; i < 3; i++) {
      if (rand() < 0.45) g.fillRect(x + 8 + rand() * (width - 18), h - bh + 14 + rand() * (bh - 40), 3, 4);
    }
    g.fillStyle(color, 1);
    x += width + 4 + rand() * 14;
  }
  g.generateTexture(key, w, h);
  g.destroy();
}

/** Mid layer: pillars, pipes, hanging cables, and one big ring (the Sheepy-style background prop). */
export function makeMidground(scene: Phaser.Scene, key: string, w: number, h: number, color: number, seed: number): void {
  const g = gfx(scene);
  const rand = rng(seed);
  // faint ring behind everything in this layer
  g.lineStyle(14, 0x16213f, 0.8);
  g.strokeCircle(w * 0.62, h * 0.42, 120);
  g.fillStyle(color, 1);
  // pillars
  for (let i = 0; i < 4; i++) {
    const px = (i + 0.2 + rand() * 0.6) * (w / 4), pw = 26 + rand() * 40;
    g.fillRect(px, 0, pw, h);
    g.fillRect(px - 6, h * (0.2 + rand() * 0.4), pw + 12, 10); // beam / bracket
  }
  // horizontal pipes
  g.fillRect(0, h * 0.16, w, 8);
  g.fillRect(0, h * 0.2, w, 4);
  // hanging cables with a droop
  g.lineStyle(2, color, 1);
  for (let i = 0; i < 6; i++) {
    const x0 = rand() * w, len = 60 + rand() * 120;
    g.beginPath();
    g.moveTo(x0, h * 0.16);
    g.lineTo(x0 + 6, h * 0.16 + len * 0.6);
    g.lineTo(x0, h * 0.16 + len);
    g.strokePath();
  }
  g.generateTexture(key, w, h);
  g.destroy();
}

/** Near foreground: pure-black silhouettes (pillars, ragged top, dangling roots) drawn in front of the player. */
export function makeForeground(scene: Phaser.Scene, key: string, w: number, h: number, seed: number): void {
  const g = gfx(scene);
  const rand = rng(seed);
  g.fillStyle(0x000000, 1);
  // ragged ceiling
  for (let x = 0; x < w; x += 24) g.fillRect(x, 0, 24, 14 + rand() * 38);
  // dangling roots
  for (let i = 0; i < 9; i++) {
    const x = rand() * w, len = 40 + rand() * 110;
    g.fillRect(x, 0, 3, len);
    g.fillRect(x - 3, len - 6, 9, 10);
  }
  // two pillars; kept thin so they only hide gameplay for a moment as they slide past
  g.fillRect(w * 0.06, 0, 30, h);
  g.fillRect(w * 0.7, 0, 22, h);
  g.generateTexture(key, w, h);
  g.destroy();
}
