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
