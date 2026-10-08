import Phaser from 'phaser';

// The hero is pixel art typed out as text, so there is no image file. To redraw the
// character, edit the letters in BODY: each letter is one pixel, '.' is empty.
export const HERO_W = 16, HERO_H = 19;
export const HERO_SCALE = 2;

const PAL: Record<string, string> = {
  F: '#f0883a', // fur
  f: '#b8561f', // fur in shadow
  C: '#fff1d6', // cream muzzle, belly and tail
  K: '#2a1a16', // eyes and nose
  Y: '#ffe9a8', // glowing tail tip
};

// A fox kit, facing right: head and body only. 16 columns x 16 rows.
// Legs and the tail are added per frame so they can move.
const BODY = [
  '....F.......F...',
  '...FFF.....FFF..',
  '...FfFFFFFFFfF..',
  '..FFFFFFFFFFFFF.',
  '..FFFFFFFFFFFFF.',
  '..FFFKFFFFFKFFF.',
  '..FFFKFFFFFKFFF.',
  '..FFFCCCCCCCFFF.',
  '..CCCCCCKKCCCCC.',
  '...CCCCCCCCCCC..',
  '....CCCCCCCCC...',
  '....FFFFFFFF....',
  '...fFFCCCCFFF...',
  '...fFFCCCCFFF...',
  '...ffFCCCCFFF...',
  '....ffFFFFFF....',
];

type Px = [x: number, y: number, c: 'F' | 'f' | 'C' | 'Y'];

interface Frame {
  dy: number;                                        // whole body shifted down (+) or up (-): the bob / stretch
  legs: [x: number, top: number, bottom: number][];  // 2px-wide legs, rows in cell space
  tail: Px[];                                        // tail pixels, rows in BODY space
  blink?: boolean;
}

const LEGS_STAND: Frame['legs'] = [[5, 17, 18], [9, 17, 18]];

// The tail carries the light: orange base, cream band, glowing tip.
const TAIL_UP: Px[] = [ // curled up behind the back (standing)
  [2, 14, 'f'], [2, 13, 'F'], [1, 14, 'f'], [1, 13, 'F'], [1, 12, 'F'], [0, 13, 'f'],
  [0, 12, 'F'], [0, 11, 'F'], [1, 11, 'F'], [0, 10, 'C'], [1, 10, 'C'], [0, 9, 'Y'],
];
const TAIL_SWAY: Px[] = [ // same curl, tip tilted back a little
  [2, 14, 'f'], [2, 13, 'F'], [1, 14, 'f'], [1, 13, 'F'], [1, 12, 'F'], [0, 13, 'f'],
  [0, 12, 'F'], [0, 11, 'C'], [1, 11, 'F'], [0, 10, 'Y'],
];
const TAIL_BACK_HI: Px[] = [ // streaming behind while running
  [2, 14, 'f'], [2, 13, 'F'], [1, 13, 'F'], [1, 12, 'F'], [0, 12, 'C'], [0, 11, 'C'], [0, 10, 'Y'],
];
const TAIL_BACK_LO: Px[] = [
  [2, 14, 'f'], [2, 13, 'F'], [1, 14, 'f'], [1, 13, 'F'], [0, 13, 'C'], [0, 12, 'C'], [0, 11, 'Y'],
];
const TAIL_DOWN: Px[] = [ // trails below on the way up
  [2, 13, 'F'], [2, 14, 'F'], [1, 14, 'F'], [1, 15, 'F'], [1, 16, 'f'], [0, 15, 'C'], [0, 16, 'C'], [0, 17, 'Y'],
];
const TAIL_FLY: Px[] = [ // whips up on the way down
  [2, 13, 'F'], [2, 12, 'F'], [1, 12, 'F'], [1, 11, 'F'], [0, 11, 'f'], [1, 10, 'F'],
  [0, 10, 'F'], [0, 9, 'C'], [1, 9, 'C'], [0, 8, 'Y'],
];

const FRAMES: Frame[] = [
  /* 0 idle       */ { dy: 0, legs: LEGS_STAND, tail: TAIL_UP },
  /* 1 idle (dip) */ { dy: 1, legs: [[5, 18, 18], [9, 18, 18]], tail: TAIL_SWAY },
  /* 2 blink      */ { dy: 0, legs: LEGS_STAND, tail: TAIL_UP, blink: true },
  /* 3 run a      */ { dy: 0, legs: [[3, 17, 17], [10, 17, 18]], tail: TAIL_BACK_HI },
  /* 4 run b      */ { dy: 1, legs: [[6, 18, 18], [8, 18, 18]], tail: TAIL_BACK_LO },
  /* 5 run c      */ { dy: 0, legs: [[4, 17, 18], [11, 17, 17]], tail: TAIL_BACK_HI },
  /* 6 run d      */ { dy: 1, legs: [[6, 18, 18], [8, 18, 18]], tail: TAIL_BACK_LO },
  /* 7 jump       */ { dy: -1, legs: [[5, 16, 17], [9, 16, 17]], tail: TAIL_DOWN },
  /* 8 fall       */ { dy: 0, legs: [[4, 17, 18], [10, 17, 18]], tail: TAIL_FLY },
];

function drawFrame(ctx: CanvasRenderingContext2D, ox: number, f: Frame): void {
  const px = (x: number, y: number, c: string) => {
    ctx.fillStyle = PAL[c]!;
    ctx.fillRect(ox + x, y, 1, 1);
  };
  const top = 1 + f.dy; // one spare row above the ears so the jump stretch isn't clipped
  BODY.forEach((row, y) => {
    [...row].forEach((c, x) => {
      if (c === '.') return;
      if (c === 'K' && f.blink && y === 5) c = 'F'; // half-closed eyes
      px(x, y + top, c);
    });
  });
  for (const [x, a, b] of f.legs) {
    for (let y = a; y <= b; y++) { px(x, y, 'f'); px(x + 1, y, 'F'); }
  }
  for (const [x, y, c] of f.tail) px(x, y + top, c);
}

/** Builds the 'hero' sprite sheet and its animations (idle, run, jump, fall). Safe to call twice. */
export function makeHero(scene: Phaser.Scene, key = 'hero'): void {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, HERO_W * FRAMES.length, HERO_H)!;
  const ctx = tex.getContext();
  FRAMES.forEach((f, i) => {
    drawFrame(ctx, i * HERO_W, f);
    tex.add(i, 0, i * HERO_W, 0, HERO_W, HERO_H);
  });
  tex.refresh();
  tex.setFilter(Phaser.Textures.FilterMode.NEAREST); // keep pixels crisp when scaled up

  const anim = (name: string, frames: number[], frameRate: number) =>
    scene.anims.create({ key: name, frames: frames.map((frame) => ({ key, frame })), frameRate, repeat: -1 });
  anim('hero-idle', [0, 0, 1, 1, 0, 2, 1, 1], 4);
  anim('hero-run', [3, 4, 5, 6], 12);
  anim('hero-jump', [7], 1);
  anim('hero-fall', [8], 1);
}
