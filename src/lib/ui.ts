// Fonts for all text. Kenney Pixel reads well in sentences; Kenney Pixel Square is wide capitals for titles.
// Both are loaded from public/assets/fonts (CC0, see CREDITS.txt) by the loading screen before any text is drawn.
export const FONT_BODY = '"Kenney Pixel", monospace';
export const FONT_TITLE = '"Kenney Pixel Square", monospace';

/** Loads both fonts so the first text drawn already uses them. Resolves even if a font fails: text falls back to monospace. */
export async function loadFonts(): Promise<void> {
  const faces = [
    new FontFace('Kenney Pixel', 'url(assets/fonts/kenney-pixel.ttf)'),
    new FontFace('Kenney Pixel Square', 'url(assets/fonts/kenney-pixel-square.ttf)'),
  ];
  await Promise.all(faces.map((f) => f.load().then((l) => document.fonts.add(l)).catch(() => undefined)));
}
