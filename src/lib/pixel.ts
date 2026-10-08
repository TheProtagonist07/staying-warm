import Phaser from 'phaser';

/** Every pixel-art asset is drawn small and shown at this scale, so all pixels on screen are the same size. */
export const PX = 2;

/** Creates a crisp (unsmoothed) canvas texture and hands you its 2D context to draw on. */
export function pixelTex(
  scene: Phaser.Scene, key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void,
): void {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.createCanvas(key, w, h)!;
  draw(tex.getContext());
  tex.refresh();
  tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
}

/** Texture from a text map: one letter per pixel, '.' is empty, `pal` maps letters to colours. */
export function mapTex(scene: Phaser.Scene, key: string, rows: string[], pal: Record<string, string>): void {
  const w = rows[0]!.length;
  if (rows.some((r) => r.length !== w)) throw new Error(`pixel map '${key}' has rows of different lengths`);
  pixelTex(scene, key, w, rows.length, (ctx) => {
    rows.forEach((row, y) => [...row].forEach((c, x) => {
      const colour = pal[c];
      if (!colour) return;
      ctx.fillStyle = colour;
      ctx.fillRect(x, y, 1, 1);
    }));
  });
}

/** Shrinks an existing canvas texture by `factor` without smoothing, so it shows as chunky pixels when scaled back up. */
export function pixelate(scene: Phaser.Scene, key: string, factor = PX): void {
  const src = scene.textures.get(key).getSourceImage() as HTMLCanvasElement;
  const w = Math.floor(src.width / factor), h = Math.floor(src.height / factor);
  const copy = document.createElement('canvas');
  copy.width = w; copy.height = h;
  const c = copy.getContext('2d')!;
  c.imageSmoothingEnabled = false;
  c.drawImage(src, 0, 0, src.width, src.height, 0, 0, w, h);
  pixelTex(scene, key, w, h, (ctx) => ctx.drawImage(copy, 0, 0));
}
