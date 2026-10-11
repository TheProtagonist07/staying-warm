import Phaser from 'phaser';

/** Small white square. Everything particle-like (snow, sparks, stars, wind) is this, scaled and tinted. */
export function makeDot(scene: Phaser.Scene): void {
  if (scene.textures.exists('dot')) return;
  const t = scene.textures.createCanvas('dot', 2, 2)!;
  const c = t.getContext();
  c.fillStyle = '#ffffff';
  c.fillRect(0, 0, 2, 2);
  t.refresh();
}

/** A filled disc with a lit edge, used for the moon. */
export function makeDisc(scene: Phaser.Scene, key: string, r: number, fill: string, craters: string): void {
  if (scene.textures.exists(key)) return;
  const t = scene.textures.createCanvas(key, r * 2, r * 2)!;
  const c = t.getContext();
  c.fillStyle = fill;
  c.beginPath(); c.arc(r, r, r, 0, Math.PI * 2); c.fill();
  c.fillStyle = craters;
  for (const [x, y, rr] of [[0.38, 0.36, 0.16], [0.64, 0.58, 0.11], [0.45, 0.7, 0.08]] as const) {
    c.beginPath(); c.arc(r * 2 * x, r * 2 * y, r * rr, 0, Math.PI * 2); c.fill();
  }
  t.refresh();
}

/**
 * A mountain ridge drawn in chunky 4px columns that repeats sideways without a seam: it is built
 * from sine waves that all complete a whole number of cycles across the width.
 */
export function makeRidge(
  scene: Phaser.Scene, key: string, w: number, h: number,
  o: { base: number; amp: number; body: string; snow: string; waves: [cycles: number, weight: number, phase: number][] },
): void {
  if (scene.textures.exists(key)) return;
  const t = scene.textures.createCanvas(key, w, h)!;
  const c = t.getContext();
  const col = 4;
  for (let x = 0; x < w; x += col) {
    let v = 0, sum = 0;
    for (const [n, wt, ph] of o.waves) { v += wt * Math.sin((2 * Math.PI * n * x) / w + ph); sum += wt; }
    // Folding the wave makes sharp peaks instead of soft hills.
    const top = Math.round((h - o.base - o.amp * (1 - Math.abs(v / sum))) / 4) * 4;
    c.fillStyle = o.body;
    c.fillRect(x, top, col, h - top);
    c.fillStyle = o.snow;
    c.fillRect(x, top, col, 8); // snow on the peaks
  }
  t.refresh();
}

/** A band of distant pines in chunky pixels, dark against the sky. Repeats sideways without a seam. */
export function makePines(scene: Phaser.Scene, key: string, w: number, h: number, color: string, seed: number): void {
  if (scene.textures.exists(key)) return;
  const t = scene.textures.createCanvas(key, w, h)!;
  const c = t.getContext();
  c.fillStyle = color;
  let x = 0, n = seed;
  const next = () => { n = (n * 1664525 + 1013904223) >>> 0; return n / 4294967296; };
  while (x < w) {
    const tw = 36 + Math.floor(next() * 28), th = 70 + Math.floor(next() * 90);
    const cx = Math.min(x + tw / 2, w - tw / 2);
    // stacked triangles, drawn as rows of 4px blocks
    for (let row = 0; row < th; row += 4) {
      const half = Math.round(((row / th) * tw * 0.5) / 4) * 4 + 4;
      c.fillRect(Math.round((cx - half) / 4) * 4, h - th + row, half * 2, 4);
    }
    c.fillRect(Math.round(cx / 4) * 4 - 4, h - 8, 8, 8);
    x += tw * 0.75;
  }
  c.fillRect(0, h - 10, w, 10);
  t.refresh();
}

/** A soft vertical ribbon of light, drawn tall and thin. Used for the aurora. */
export function makeRibbon(scene: Phaser.Scene, key: string, w: number, h: number): void {
  if (scene.textures.exists(key)) return;
  const t = scene.textures.createCanvas(key, w, h)!;
  const c = t.getContext();
  for (let x = 0; x < w; x++) {
    const edge = Math.sin((x / w) * Math.PI);
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.45, `rgba(255,255,255,${(0.55 * edge).toFixed(3)})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    c.fillRect(x, 0, 1, h);
  }
  t.refresh();
}

/** Icy white frost creeping in from the edges of the screen. Shown more strongly as warmth drops. */
export function makeFrost(scene: Phaser.Scene, key: string, w: number, h: number): void {
  if (scene.textures.exists(key)) return;
  const t = scene.textures.createCanvas(key, w, h)!;
  const c = t.getContext();
  const g = c.createRadialGradient(w / 2, h / 2, h * 0.32, w / 2, h / 2, w * 0.62);
  g.addColorStop(0, 'rgba(200,225,255,0)');
  g.addColorStop(1, 'rgba(200,225,255,0.85)');
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
  // crystals: short lines that grow in from the edges
  let n = 7;
  const next = () => { n = (n * 1664525 + 1013904223) >>> 0; return n / 4294967296; };
  c.strokeStyle = 'rgba(235,245,255,0.8)';
  c.lineWidth = 2;
  for (let i = 0; i < 90; i++) {
    const side = Math.floor(next() * 4);
    const x = side === 0 ? 0 : side === 1 ? w : next() * w, y = side === 2 ? 0 : side === 3 ? h : next() * h;
    const ang = Math.atan2(h / 2 - y, w / 2 - x) + (next() - 0.5) * 1.2, len = 14 + next() * 40;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len); c.stroke();
  }
  t.refresh();
}
