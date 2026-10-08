import Phaser from 'phaser';
import { rng } from './atmosphere';
import { mapTex, pixelTex } from './pixel';

// Environment art, all drawn from code: ground tiles, props, trees and leaves.
// The world is dark and cool. Autumn colour is kept dim on purpose so the fox stays
// the brightest warm thing on screen.
const STONE = '#0a0e1a', STONE_LIT = '#111830', STONE_DARK = '#070a13', MORTAR = '#05070d';
const RIM = '#4a6099', RIM_HI = '#7f97d6', SOIL = '#1b2440', SOIL_DARK = '#10162a', GRASS = '#33466e';
const LITTER = ['#c9692a', '#9a4a1c', '#b98a2e', '#7a3516'];
const TRUNK = '#1b2340', TRUNK_LIT = '#34416e';
const LEAF_DARK = '#4a2110', LEAF_MID = '#7d3c18', LEAF_HI = '#a85a22', LEAF_SPARK = '#c98a36';

const pick = <T>(r: () => number, list: T[]): T => list[Math.floor(r() * list.length)]!;

/** Ground: a tileable brick fill and a tileable top strip (lit edge, grass tufts, leaf litter). */
function makeGround(scene: Phaser.Scene): void {
  const r = rng(101);
  const S = 32; // fill tile size: 4 bricks across, 8 rows
  pixelTex(scene, 'ground-fill', S, S, (ctx) => {
    ctx.fillStyle = STONE;
    ctx.fillRect(0, 0, S, S);
    for (let row = 0; row < 8; row++) {
      const off = row % 2 ? 4 : 0; // every other row is shifted half a brick
      for (let b = 0; b < 4; b++) {
        const roll = r();
        const face = roll < 0.18 ? STONE_LIT : roll < 0.3 ? STONE_DARK : null;
        for (let i = 0; i < 8; i++) {
          const x = (b * 8 + off + i) % S;
          ctx.fillStyle = i === 7 ? MORTAR : face ?? STONE;
          ctx.fillRect(x, row * 4, 1, 3);
        }
      }
      ctx.fillStyle = MORTAR;
      ctx.fillRect(0, row * 4 + 3, S, 1);
    }
  });

  // Top strip, 8px tall. Row 2 is the walkable edge; rows 0-1 are grass and leaves sticking up.
  const TW = 64;
  pixelTex(scene, 'ground-top', TW, 8, (ctx) => {
    const dot = (x: number, y: number, c: string) => { ctx.fillStyle = c; ctx.fillRect((x + TW) % TW, y, 1, 1); };
    for (let x = 0; x < TW; x++) {
      dot(x, 2, r() < 0.15 ? RIM_HI : RIM);
      dot(x, 3, SOIL);
      dot(x, 4, r() < 0.5 ? SOIL_DARK : STONE);
      for (let y = 5; y < 8; y++) dot(x, y, r() < 0.08 ? SOIL_DARK : STONE);
    }
    for (let x = 0; x < TW; x++) {
      const roll = r();
      if (roll < 0.1) { dot(x, 1, GRASS); if (r() < 0.5) dot(x, 0, GRASS); }
      else if (roll < 0.24) { const c = pick(r, LITTER); dot(x, 1, c); dot(x + 1, 1, c); }
    }
  });
}

const LANTERN = [
  '....K....',
  '...KKK...',
  '..KKKKK..',
  '..KGGGK..',
  '..KGLGK..',
  '..KGLGK..',
  '..KGGGK..',
  '..KKKKK..',
  '...KKK...',
  '....K....',
];
const ORB = [
  '...c...',
  '..cWc..',
  '.cWWWc.',
  'cWWWWWc',
  '.cWWWc.',
  '..cWc..',
  '...c...',
];
const STONE_LANTERN = [
  '....S....',
  '...SSS...',
  '..SSSSS..',
  '.SSSSSSS.',
  '..sWWWs..',
  '..sWWWs..',
  '..sWWWs..',
  '.SSSSSSS.',
  '...sSs...',
  '...sSs...',
  '...sSs...',
  '...sSs...',
  '..SSSSS..',
  '.SSSSSSS.',
];
const MUSHROOM = [
  '.RRR.',
  'RRWRR',
  'RWRRR',
  '..S..',
  '..S..',
];
const SIGN = [
  '.BBBBBB..',
  '.BbbbbBB.',
  '.BbbbbbBB',
  '.BbbbbBB.',
  '.BBBBBB..',
  '...PP....',
  '...PP....',
  '...PP....',
  '...PP....',
  '...PP....',
  '...PP....',
];
const BIRD = [
  '.WW..',
  'WWWWo',
  '.WWW.',
];
const LEAF = [
  'LL.',
  '.LL',
];

function makeProps(scene: Phaser.Scene): void {
  mapTex(scene, 'lantern', LANTERN, { K: '#2b3660', G: '#dfe8ff', L: '#ffffff' });
  mapTex(scene, 'orb', ORB, { c: '#9db8ff', W: '#ffffff' });
  mapTex(scene, 'cp-off', STONE_LANTERN, { S: '#3d4b80', s: '#2b3660', W: '#0b0f1c' });
  mapTex(scene, 'cp-on', STONE_LANTERN, { S: '#59699f', s: '#3d4b80', W: '#ffd27a' });
  mapTex(scene, 'mushroom', MUSHROOM, { R: '#c9692a', W: '#fff1d6', S: '#d8cdb8' });
  mapTex(scene, 'sign', SIGN, { B: '#4a3426', b: '#6b4a33', P: '#33241c' });
  mapTex(scene, 'bird', BIRD, { W: '#dfe8ff', o: '#e8a33d' });
  ['#e8742a', '#c9692a', '#e8a33d'].forEach((c, i) => mapTex(scene, `leaf${i}`, LEAF, { L: c }));
}

/** Arched door, 18x30. Closed is dark planks; open is a doorway full of warm light. */
function makeDoor(scene: Phaser.Scene, key: string, open: boolean): void {
  const W = 18, H = 30, cx = 8.5, cy = 9;
  const inArch = (x: number, y: number, inset: number) =>
    y >= cy ? x >= inset && x <= W - 1 - inset : (x - cx) ** 2 + (y - cy) ** 2 <= (cx + 0.3 - inset) ** 2;
  pixelTex(scene, key, W, H, (ctx) => {
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (!inArch(x, y, 0)) continue;
        let c: string;
        if (!inArch(x, y, 2)) c = open ? (x < 9 ? '#fff7de' : '#d8c9a0') : (x < 9 ? '#4a5c99' : '#33406e'); // stone frame
        else if (open) c = Math.abs(x - cx) < 3 ? '#fff7de' : '#ffe9b0';
        else if (y === 14 || y === 24) c = '#3a3f55';                                  // iron bands
        else if (x === 13 && (y === 19 || y === 20)) c = '#b98a2e';                   // handle
        else c = x % 4 === 1 ? '#1c1218' : '#2a1c22';                                  // planks
        ctx.fillStyle = c;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  });
}

/** A small mound of fallen leaves. */
function makePile(scene: Phaser.Scene, key: string, w: number, h: number, seed: number): void {
  const r = rng(seed);
  pixelTex(scene, key, w, h, (ctx) => {
    for (let x = 0; x < w; x++) {
      const top = Math.round(h * Math.sin((Math.PI * (x + 0.5)) / w) * (0.75 + r() * 0.35));
      for (let y = h - top; y < h; y++) {
        const roll = r();
        ctx.fillStyle = roll < 0.15 ? LEAF_SPARK : roll < 0.45 ? LEAF_HI : roll < 0.8 ? LEAF_MID : LEAF_DARK;
        ctx.fillRect(x, Math.max(0, y), 1, 1);
      }
    }
  });
}

/**
 * An autumn tree grown from a seed: a swaying trunk, a few branches, then leaf clusters at the
 * branch tips, lit from the top-left. `leafiness` below 1 leaves more bare branches showing.
 */
function makeTree(scene: Phaser.Scene, key: string, w: number, h: number, seed: number, leafiness: number): void {
  const r = rng(seed);
  pixelTex(scene, key, w, h, (ctx) => {
    const put = (x: number, y: number, c: string) => {
      x = Math.round(x); y = Math.round(y);
      if (x < 0 || y < 0 || x >= w || y >= h) return;
      ctx.fillStyle = c;
      ctx.fillRect(x, y, 1, 1);
    };
    const cx = Math.floor(w / 2);
    const trunkTop = Math.floor(h * 0.42);
    const lean = (y: number) => Math.sin(((h - y) / h) * 3 + seed) * 2;
    const tips: { x: number; y: number }[] = [];

    for (let y = h - 1; y >= trunkTop; y--) {
      const t = (h - 1 - y) / (h - 1 - trunkTop);
      const half = t < 0.12 ? 3 : t < 0.6 ? 2 : 1; // flared at the roots, thinner higher up
      for (let dx = -half; dx <= half; dx++) put(cx + lean(y) + dx, y, dx === -half ? TRUNK_LIT : TRUNK);
    }
    tips.push({ x: cx + lean(trunkTop), y: trunkTop - 2 });

    const branches = 4 + Math.floor(r() * 3);
    for (let i = 0; i < branches; i++) {
      const side = i % 2 ? 1 : -1;
      let y = trunkTop + r() * (h - trunkTop) * 0.45;
      let x = cx + lean(y);
      const len = 9 + r() * 12, rise = 0.5 + r() * 0.7;
      for (let s = 0; s < len; s++) {
        x += side; y -= rise;
        put(x, y, TRUNK);
        if (s < len / 3) put(x, y + 1, TRUNK);
        if (s === Math.floor(len * 0.6)) tips.push({ x, y });
      }
      tips.push({ x, y });
    }

    for (const tip of tips) {
      const R = Math.round((5 + r() * 4) * leafiness);
      for (let dy = -R; dy <= R; dy++) {
        for (let dx = -R; dx <= R; dx++) {
          const d = dx * dx + dy * dy;
          if (d > R * R) continue;
          if (d > (R - 1) * (R - 1) && r() < 0.45) continue; // ragged edge
          if (r() < 0.1) continue;                             // gaps so the canopy isn't a solid blob
          const light = (-dx - dy) / (2 * R) + (r() - 0.5) * 0.5;
          const c = r() < 0.05 ? LEAF_SPARK : light > 0.3 ? LEAF_HI : light > -0.15 ? LEAF_MID : LEAF_DARK;
          put(tip.x + dx, tip.y + dy, c);
        }
      }
    }
  });
}

const GRASS1 = [
  '.G...g.',
  '.G..g..',
  '..G.g.T',
  '..G.gG.',
  '..GggG.',
  '...GG..',
  '...GG..',
];
const GRASS2 = [
  'T...g',
  '.G.g.',
  '.G.g.',
  '..G..',
  '..G..',
];
const REED = [
  '.B.',
  '.B.',
  '.B.',
  '.g.',
  '.g.',
  '.g.',
  '.g.',
  '.g.',
  '.g.',
  '.g.',
];
const PUMPKIN = [
  '.....S.....',
  '....SS.....',
  '..OOOOOOO..',
  '.OoOOOOOoO.',
  'OOoEOOOEoOO',
  'OOoOOOOOoOO',
  'OOoEEEEEoOO',
  '.OoOOOOOoO.',
  '..OOOOOOO..',
];
const FENCE = [
  '.B.....B.....B..',
  'BBB...BBB...BBB.',
  'BbB...BbB...BbB.',
  'BbBBBBBbBBBBBbB.',
  'BbB...BbB...BbB.',
  'BbB...BbB...BbB.',
  'BbBBBBBbB...BbB.',
  'BbB...BbB...BbB.',
  'BbB...BbB...BbB.',
];
const BIRD_UP = [
  'W.....W',
  '.W...W.',
  '..WWWo.',
  '..WWW..',
];
const BIRD_DOWN = [
  '.......',
  '..WWWo.',
  '.WWWWW.',
  'W..W..W',
];
const SPARK = [
  '.W.',
  'WWW',
  '.W.',
];
const PUFF = [
  '.WW.',
  'WWWW',
  'WWWW',
  '.WW.',
];

/** Second batch: things that react to the fox (grass, pumpkins, flying birds) and particle shapes. */
function makeLiveProps(scene: Phaser.Scene): void {
  const grass = { G: '#3d5285', g: '#2c3c66', T: '#8a7a3e', B: '#5a4030' };
  mapTex(scene, 'grass1', GRASS1, grass);
  mapTex(scene, 'grass2', GRASS2, grass);
  mapTex(scene, 'reed', REED, grass);
  mapTex(scene, 'pumpkin', PUMPKIN, { O: '#8a4318', o: '#6a3212', E: '#2a1408', S: '#2f4a3a' });
  mapTex(scene, 'pumpkin-on', PUMPKIN, { O: '#d9762a', o: '#b8561f', E: '#ffe9a8', S: '#3d5c48' });
  mapTex(scene, 'fence', FENCE, { B: '#3b2c26', b: '#57402f' });
  mapTex(scene, 'bird-up', BIRD_UP, { W: '#dfe8ff', o: '#e8a33d' });
  mapTex(scene, 'bird-down', BIRD_DOWN, { W: '#dfe8ff', o: '#e8a33d' });
  mapTex(scene, 'lantern-off', LANTERN, { K: '#2b3660', G: '#3a4a7a', L: '#4a5c99' });
  mapTex(scene, 'spark', SPARK, { W: '#ffffff' });
  mapTex(scene, 'puff', PUFF, { W: '#ffffff' });
  mapTex(scene, 'dot', ['W'], { W: '#ffffff' });
}

/** Pixel moon with a shaded edge and a few craters. */
function makeMoon(scene: Phaser.Scene, key: string, size: number): void {
  const c = (size - 1) / 2;
  const craters: [number, number, number][] = [[0.36, 0.34, 0.13], [0.62, 0.52, 0.09], [0.42, 0.68, 0.07], [0.68, 0.28, 0.05]];
  pixelTex(scene, key, size, size, (ctx) => {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (Math.hypot(x - c, y - c) > c + 0.2) continue;
        let col = Math.hypot(x - c * 0.8, y - c * 0.8) > c * 0.95 ? '#aebbe2' : '#d8e0f8'; // lit from the top-left
        if (craters.some(([cx, cy, r]) => Math.hypot(x - cx * size, y - cy * size) <= r * size)) col = '#b9c5ea';
        ctx.fillStyle = col;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  });
}

/** Flat-bottomed cloud made of overlapping circles, lighter along the top. */
function makeCloud(scene: Phaser.Scene, key: string, w: number, h: number, seed: number): void {
  const r = rng(seed);
  const blobs = Array.from({ length: 5 }, () => {
    const rad = h * (0.35 + r() * 0.3);
    return { x: rad + r() * (w - rad * 2), y: h - rad * (0.5 + r() * 0.5), rad };
  });
  const solid = (x: number, y: number) => y < h && blobs.some((b) => Math.hypot(x - b.x, y - b.y) <= b.rad);
  pixelTex(scene, key, w, h, (ctx) => {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (!solid(x, y)) continue;
        ctx.fillStyle = solid(x, y - 1) ? '#141f45' : '#24356a';
        ctx.fillRect(x, y, 1, 1);
      }
    }
  });
}

/** A distant line of tree silhouettes that tiles sideways: the forest behind the ruins. */
function makeTreeline(scene: Phaser.Scene, key: string, w: number, h: number, seed: number): void {
  const r = rng(seed);
  const BASE = '#080d20', MOONLIT = '#18244a', RUST = '#2c1d1c';
  pixelTex(scene, key, w, h, (ctx) => {
    const put = (x: number, y: number, c: string) => {
      ctx.fillStyle = c;
      ctx.fillRect(((Math.round(x) % w) + w) % w, Math.round(y), 1, 1); // wrap so the layer repeats cleanly
    };
    ctx.fillStyle = BASE;
    ctx.fillRect(0, h - 24, w, 24);
    for (let x = 0; x < w; x += 12 + r() * 24) {
      const tall = 50 + r() * 62, rad = 8 + r() * 9;
      for (let y = h - tall; y < h; y++) { put(x, y, BASE); put(x + 1, y, BASE); }
      for (let i = 0; i < 4; i++) {
        const bx = x + (r() - 0.5) * rad * 1.4, by = h - tall + (r() - 0.6) * rad, br = rad * (0.6 + r() * 0.4);
        for (let dy = -br; dy <= br; dy++) {
          for (let dx = -br; dx <= br; dx++) {
            if (dx * dx + dy * dy > br * br) continue;
            const edge = dx + dy < -br * 0.7; // the side facing the moon
            put(bx + dx, by + dy, edge && r() < 0.3 ? (r() < 0.4 ? RUST : MOONLIT) : BASE);
          }
        }
      }
    }
  });
}

/** Soft cone of light that hangs under a lantern. Smooth on purpose: light is not pixel art. */
function makeShaft(scene: Phaser.Scene, key: string, w: number, h: number): void {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.createCanvas(key, w, h)!;
  const ctx = tex.getContext();
  for (let y = 0; y < h; y++) {
    const t = y / h;
    const half = 6 + t * (w / 2 - 6);
    const a = Math.pow(1 - t, 1.6);
    const g = ctx.createLinearGradient(w / 2 - half, 0, w / 2 + half, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.5, `rgba(255,255,255,${a.toFixed(3)})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(w / 2 - half, y, half * 2, 1);
  }
  tex.refresh();
}

/** Builds every environment texture. Call once; the full set is pictured in docs/assets.jpg. */
export function makeEnvironment(scene: Phaser.Scene): void {
  makeGround(scene);
  makeProps(scene);
  makeLiveProps(scene);
  makeDoor(scene, 'door-closed', false);
  makeDoor(scene, 'door-open', true);
  makePile(scene, 'pile1', 18, 6, 41);
  makePile(scene, 'pile2', 12, 4, 43);
  makeTree(scene, 'tree1', 64, 96, 3, 1);
  makeTree(scene, 'tree2', 64, 96, 8, 1.15);
  makeTree(scene, 'tree3', 64, 96, 12, 0.6); // nearly bare
  makeMoon(scene, 'moon', 28);
  makeCloud(scene, 'cloud1', 56, 16, 61);
  makeCloud(scene, 'cloud2', 40, 12, 67);
  makeTreeline(scene, 'treeline', 480, 270, 71);
  makeShaft(scene, 'shaft', 128, 256);
}

export type PropKind =
  | 'tree1' | 'tree2' | 'tree3' | 'pile1' | 'pile2' | 'mushroom' | 'sign' | 'pumpkin' | 'fence';
