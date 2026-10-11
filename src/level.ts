// The game as three chapters. A chapter is a list of platform segments laid out left to right
// and climbing. Each segment says how wide it is, how many empty columns come before it, and how
// many rows it rises (negative = higher up the screen). Things on a segment are placed by column offset.
//
// Reach check used when laying these out (hero: jump 85px high, 190px/s run, tile 36px):
// a gap of up to 2 columns with a rise of up to 2 rows is always makeable.
// Spikers need a platform at least 7 wide, so there is room to land and take off.

export const TILE = 18;      // size of a tile in the art, in pixels
export const S = 2;          // how much the art is scaled up on screen
export const T = TILE * S;   // size of a tile on screen: 36px

type Kind = 'sign' | 'spark' | 'gem' | 'lantern' | 'door' | 'flag' | 'slug' | 'spiker' | 'bat' | 'spring' | 'npc';
/** [kind, column offset on the segment, height above the platform in tiles, text for signs / id for npcs] */
type Item = [kind: Kind, off: number, up?: number, text?: string];
interface Seg { w: number; gap: number; rise: number; items?: Item[]; wind?: boolean }

export interface LevelDef {
  name: string;
  /** Platforms at or above this row are snowy. Use -1 for none. */
  snowRow: number;
  sky: [top: string, bottom: string];
  /** Colour the whole picture is multiplied by: the time of night. */
  tint: number;
  /** Colour the grass tiles are tinted: autumn orange in chapter 1, plain later. */
  grass: number;
  weather: 'leaves' | 'snow';
  segs: Seg[];
}

export const LEVELS: LevelDef[] = [
  {
    name: 'The Orchard Path',
    snowRow: -1,
    sky: ['#1a1a40', '#3a2a50'],
    tint: 0x8a86b8,
    grass: 0xf0a060,
    weather: 'leaves',
    segs: [
      { w: 10, gap: 0, rise: 0, items: [['sign', 3.5, 0, 'A / D or arrows to walk\nSpace or Z to jump'], ['spark', 7]] },
      { w: 6, gap: 0, rise: -1, items: [['lantern', 3], ['sign', 0.6, 0, 'Carry a spark to a lantern\nto light it. Lit lanterns keep you warm.']] },
      { w: 7, gap: 2, rise: 0, items: [['spark', 2], ['slug', 4.5]] },
      { w: 5, gap: 2, rise: -2, items: [['gem', 2, 2.8]] },
      { w: 8, gap: 1, rise: 0, items: [['lantern', 5], ['npc', 3, 0, 'pip']] },
      { w: 5, gap: 2, rise: -1, items: [['spark', 2]] },
      { w: 7, gap: 2, rise: 0, items: [['slug', 3.5], ['spring', 5.5], ['gem', 5.5, 5.4]] },
      { w: 6, gap: 2, rise: -2, items: [['spark', 3]] },
      { w: 8, gap: 1, rise: 0, items: [['lantern', 4], ['sign', 7, 0, 'The door ahead leads\nhigher up the mountain.']] },
      { w: 9, gap: 2, rise: -1, items: [['flag', 1], ['door', 6.5]] },
    ],
  },
  {
    name: 'The Cold Road',
    snowRow: 15,
    sky: ['#0a1330', '#1b2a58'],
    tint: 0x6a7ab0,
    grass: 0xffffff,
    weather: 'snow',
    segs: [
      { w: 9, gap: 0, rise: 0, items: [['spark', 6], ['sign', 3.5, 0, 'Cold wind ahead.\nWarmth drains fast out there.']] },
      { w: 5, gap: 2, rise: 0, wind: true, items: [['lantern', 2]] },
      { w: 6, gap: 2, rise: -2, items: [['spark', 3], ['slug', 3.5]] },
      { w: 5, gap: 2, rise: 0, wind: true, items: [['gem', 2, 2.8]] },
      { w: 7, gap: 2, rise: -2, wind: true, items: [['lantern', 2.5], ['npc', 4.8, 0, 'moth']] },
      { w: 8, gap: 1, rise: 0, items: [['spiker', 4], ['spark', 1.5], ['spark', 6.8]] },
      { w: 6, gap: 2, rise: -1, items: [['bat', 3]] },
      { w: 6, gap: 2, rise: -2, wind: true, items: [['spark', 3]] },
      { w: 6, gap: 2, rise: 0, items: [['lantern', 3], ['spring', 5], ['gem', 5, 5.6]] },
      { w: 7, gap: 2, rise: -1, items: [['slug', 3.5], ['spark', 5.5]] },
      { w: 4, gap: 2, rise: -2, wind: true },
      { w: 8, gap: 2, rise: 0, items: [['spiker', 4.5], ['spark', 1.2]] },
      { w: 6, gap: 2, rise: -2, items: [['lantern', 3]] },
      { w: 8, gap: 1, rise: -1, items: [['slug', 4.5], ['spark', 6.5]] },
      { w: 5, gap: 2, rise: -2, wind: true },
      { w: 9, gap: 2, rise: -2, items: [['flag', 1], ['door', 6.5], ['sign', 3, 0, 'Snow ahead. Nearly\nthere, Wren.']] },
    ],
  },
  {
    name: 'The Hearth Rise',
    snowRow: 100,
    sky: ['#0c0a2a', '#241b52'],
    tint: 0x5c6aa8,
    grass: 0xffffff,
    weather: 'snow',
    segs: [
      { w: 8, gap: 0, rise: 0, items: [['spark', 4], ['sign', 1.5, 0, 'The Hearth Rise.\nDeep snow. Deep cold.']] },
      { w: 6, gap: 1, rise: -2, items: [['lantern', 3]] },
      { w: 5, gap: 2, rise: 0, items: [['spark', 2]] },
      { w: 8, gap: 2, rise: -2, items: [['spark', 4.5]] },
      { w: 6, gap: 2, rise: -1, items: [['npc', 2.8, 0, 'brann'], ['spark', 4.5]] },
      { w: 5, gap: 2, rise: -2, wind: true, items: [['lantern', 2], ['gem', 2, 2.9]] },
      { w: 7, gap: 2, rise: 0, items: [['bat', 3.5], ['spark', 1.2]] },
      { w: 6, gap: 2, rise: -2, items: [['slug', 3.5]] },
      { w: 8, gap: 1, rise: 0, items: [['spring', 1], ['gem', 1, 5.6], ['lantern', 5.5], ['spark', 7]] },
      { w: 5, gap: 2, rise: -2, wind: true },
      { w: 8, gap: 2, rise: 0, items: [['spiker', 4.5], ['spark', 1.3]] },
      { w: 6, gap: 2, rise: -2, items: [['slug', 3.5], ['lantern', 1]] },
      { w: 5, gap: 2, rise: -1, items: [['gem', 2, 2.8], ['spark', 3.5]] },
      { w: 7, gap: 2, rise: 0, items: [['lantern', 3], ['spark', 5]] },
      { w: 5, gap: 2, rise: -2, wind: true },
      { w: 7, gap: 2, rise: -2, items: [['spark', 3], ['lantern', 5.5]] },
      { w: 6, gap: 2, rise: 0, items: [['spark', 3]] },
      { w: 5, gap: 2, rise: -2, wind: true, items: [['spark', 2]] },
      { w: 9, gap: 2, rise: -1, items: [['flag', 1], ['door', 6.5], ['sign', 3, 0, 'The Great Hearth.\nIt only needs light.']] },
    ],
  },
];

export interface Platform { col: number; row: number; w: number }
export interface Point { x: number; y: number }
export interface Walker { kind: 'slug' | 'spiker'; x: number; top: number; minX: number; maxX: number }
export interface Sign { x: number; top: number; text: string }
export interface Npc { x: number; top: number; id: string }
export interface WindZone { x: number; y: number; w: number; h: number }

/** A chapter turned into pixel positions, ready for the scene to build from. */
export interface BuiltLevel {
  def: LevelDef;
  rows: number;
  worldW: number;
  worldH: number;
  spawn: Point;
  platforms: Platform[];
  sparks: Point[];
  gems: Point[];
  lanterns: { x: number; top: number }[];
  walkers: Walker[];
  bats: Point[];
  signs: Sign[];
  wind: WindZone[];
  flags: { x: number; top: number }[];
  springs: { x: number; top: number }[];
  npcs: Npc[];
  door: { x: number; top: number };
}

export function buildLevel(def: LevelDef): BuiltLevel {
  // Work out the total climb first, so the world is exactly tall enough.
  const climb = def.segs.reduce((n, s) => n + s.rise, 0);
  const startRow = 8 - climb;       // the door ends up on row 8, leaving sky above it
  const rows = startRow + 4;        // and four rows of cliff below the start

  const b: BuiltLevel = {
    def, rows, worldW: 0, worldH: rows * T, spawn: { x: 3 * T, y: startRow * T - 40 },
    platforms: [], sparks: [], gems: [], lanterns: [], walkers: [], bats: [], signs: [], wind: [], flags: [],
    springs: [], npcs: [], door: { x: 0, top: 0 },
  };

  let col = 0, row = startRow;
  def.segs.forEach((seg, i) => {
    if (i > 0) col += seg.gap;
    row += seg.rise;
    b.platforms.push({ col, row, w: seg.w });
    const top = row * T, left = col * T;
    for (const [kind, off, up = 0, text = ''] of seg.items ?? []) {
      const x = left + off * T + T / 2;
      switch (kind) {
        case 'spark': b.sparks.push({ x, y: top - 1.1 * T }); break;
        case 'gem': b.gems.push({ x, y: top - up * T }); break;
        case 'lantern': b.lanterns.push({ x, top }); break;
        case 'door': b.door = { x, top }; break;
        case 'flag': b.flags.push({ x, top }); break;
        case 'sign': b.signs.push({ x, top, text }); break;
        case 'spring': b.springs.push({ x, top }); break;
        case 'npc': b.npcs.push({ x, top, id: text }); break;
        case 'slug': case 'spiker': {
          // Patrols stay clear of both ends of the platform: that is where the player lands and takes off.
          const lead = kind === 'spiker' ? 3.4 : 2.5, tail = kind === 'spiker' ? 2.8 : 1.2;
          const minX = left + lead * T, maxX = Math.max(left + (seg.w - tail) * T, minX + T);
          b.walkers.push({ kind, x: Math.min(Math.max(x, minX), maxX), top, minX, maxX });
          break;
        }
        case 'bat': b.bats.push({ x, y: top - 2.2 * T }); break;
      }
    }
    if (seg.wind) b.wind.push({ x: (col - seg.gap) * T, y: (row - 10) * T, w: (seg.w + seg.gap) * T, h: 14 * T });
    col += seg.w;
  });
  b.worldW = (col + 6) * T;
  return b;
}

export const WARMTH = {
  max: 100,
  drain: 4,          // per second, in the open
  windDrain: 11,     // per second, inside a cold-wind zone
  regen: 24,         // per second, near a lit lantern
  lanternRadius: 150,
  hit: 15,           // lost when an enemy touches you
  respawn: 65,       // warmth when you wake at the last lantern
};
