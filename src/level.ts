// The whole level as a list of platform segments, laid out left to right and climbing.
// Each segment says how wide it is, how many empty columns come before it, and how many rows
// it rises (negative = higher up the screen). Things on a segment are placed by column offset.
//
// Reach check used when laying this out (hero: jump 85px high, 190px/s run, tile 36px):
// a gap of up to 2 columns with a rise of up to 2 rows is always makeable.

export const TILE = 18;      // size of a tile in the art, in pixels
export const S = 2;          // how much the art is scaled up on screen
export const T = TILE * S;   // size of a tile on screen: 36px
export const ROWS = 34;      // height of the world in tiles

type Kind = 'sign' | 'spark' | 'gem' | 'lantern' | 'door' | 'flag' | 'slug' | 'spiker' | 'bat';
/** [kind, column offset on the segment, height above the platform in tiles, text for signs] */
type Item = [kind: Kind, off: number, up?: number, text?: string];
interface Seg { w: number; gap: number; rise: number; items?: Item[]; wind?: boolean }

const SEGS: Seg[] = [
  { w: 10, gap: 0, rise: 0, items: [['sign', 3.5, 0, 'A / D or arrows to walk\nSpace or Z to jump'], ['spark', 7]] },
  { w: 6, gap: 0, rise: -2, items: [['lantern', 3], ['sign', 0.5, 0, 'Carry a spark to a lantern\nto light it. Lit lanterns keep you warm.']] },
  { w: 5, gap: 2, rise: 0, items: [['spark', 2]] },
  { w: 6, gap: 1, rise: -2, items: [['slug', 3], ['gem', 6.6, 2.6]] },
  { w: 4, gap: 2, rise: 0, wind: true, items: [['sign', 0.5, 0, 'Cold wind!\nYou lose warmth fast out here.']] },
  { w: 6, gap: 2, rise: -2, wind: true, items: [['lantern', 3]] },
  { w: 8, gap: 1, rise: 0, items: [['spiker', 5], ['spark', 2]] },
  { w: 5, gap: 2, rise: -1, items: [['gem', 2, 3.2], ['bat', 6.5]] },
  { w: 6, gap: 2, rise: -2, items: [['spark', 3]] },
  { w: 7, gap: 1, rise: 0, items: [['lantern', 4], ['slug', 1.5]] },
  { w: 4, gap: 2, rise: 0, wind: true },
  { w: 5, gap: 2, rise: -2, wind: true, items: [['gem', 2, 2.8]] },
  { w: 6, gap: 2, rise: 0, items: [['spiker', 3], ['spark', 4.5]] },
  { w: 5, gap: 2, rise: -2, wind: true, items: [['lantern', 2]] },
  { w: 8, gap: 1, rise: -1, items: [['slug', 5], ['spark', 6.5]] },
  { w: 5, gap: 2, rise: -2, items: [['gem', 2, 3]] },
  { w: 6, gap: 2, rise: 0, items: [['lantern', 3]] },
  { w: 5, gap: 2, rise: -2, wind: true, items: [['gem', 2, 2.8]] },
  { w: 7, gap: 1, rise: -1, items: [['lantern', 3], ['sign', 6, 0, 'Almost there.\nThe door needs every lantern lit.']] },
  { w: 9, gap: 2, rise: -2, items: [['flag', 1], ['door', 6.5]] },
];

export interface Platform { col: number; row: number; w: number }
export interface Point { x: number; y: number }
export interface Walker { kind: 'slug' | 'spiker'; x: number; top: number; minX: number; maxX: number }
export interface Sign { x: number; top: number; text: string }
export interface WindZone { x: number; y: number; w: number; h: number }

export const PLATFORMS: Platform[] = [];
export const SPARKS: Point[] = [];
export const GEMS: Point[] = [];
export const LANTERNS: { x: number; top: number }[] = [];
export const WALKERS: Walker[] = [];
export const BATS: Point[] = [];
export const SIGNS: Sign[] = [];
export const WIND: WindZone[] = [];
export const FLAGS: { x: number; top: number }[] = [];
export let DOOR = { x: 0, top: 0 };

let col = 0, row = 30;
SEGS.forEach((seg, i) => {
  if (i > 0) col += seg.gap;
  row += seg.rise;
  PLATFORMS.push({ col, row, w: seg.w });
  const top = row * T, left = col * T;
  for (const [kind, off, up = 0, text = ''] of seg.items ?? []) {
    const x = left + off * T + T / 2;
    switch (kind) {
      case 'spark': SPARKS.push({ x, y: top - 1.1 * T }); break;
      case 'gem': GEMS.push({ x, y: top - up * T }); break;
      case 'lantern': LANTERNS.push({ x, top }); break;
      case 'door': DOOR = { x, top }; break;
      case 'flag': FLAGS.push({ x, top }); break;
      case 'sign': SIGNS.push({ x, top, text }); break;
      case 'slug': case 'spiker':
        {
        // Patrols stay clear of both ends of the platform: that is where the player lands and takes off.
        const lead = kind === 'spiker' ? 3.4 : 2.5, tail = kind === 'spiker' ? 2.8 : 1.2; // spikes hurt on contact, so they keep further from the ends
        const minX = left + lead * T, maxX = left + (seg.w - tail) * T;
        WALKERS.push({ kind, x: Math.min(Math.max(x, minX), maxX), top, minX, maxX });
        break;
      }
      case 'bat': BATS.push({ x, y: top - 2.2 * T }); break;
    }
  }
  if (seg.wind) WIND.push({ x: (col - seg.gap) * T, y: (row - 10) * T, w: (seg.w + seg.gap) * T, h: 14 * T });
  col += seg.w;
});

export const COLS = col + 6;
export const WORLD_W = COLS * T;
export const WORLD_H = ROWS * T;
export const SPAWN: Point = { x: 3 * T, y: 30 * T - 40 };
export const WARMTH = {
  max: 100,
  drain: 4,          // per second, in the open
  windDrain: 11,     // per second, inside a cold-wind zone
  regen: 24,         // per second, near a lit lantern
  lanternRadius: 150,
  hit: 15,           // lost when an enemy touches you
  respawn: 65,       // warmth when you wake at the last lantern
};

/** Top of the highest platform under a world x, or null over a pit. */
export function groundAt(x: number): number | null {
  const c = Math.floor(x / T);
  const tops = PLATFORMS.filter((p) => c >= p.col && c < p.col + p.w).map((p) => p.row * T);
  return tops.length ? Math.min(...tops) : null;
}
