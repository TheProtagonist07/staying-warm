import Phaser from 'phaser';

// The hero is pixel art typed out as text, so there is no image file. To redraw the
// character, edit the letters in BODY: each letter is one pixel, '.' is empty.
export const HERO_W = 16, HERO_H = 19;
export const HERO_SCALE = 2;

const PAL: Record<string, string> = {
  W: '#f2efe6', // fur
  w: '#b4b3cb', // fur in shadow
  D: '#171a2c', // face
  E: '#c9ecff', // eyes
  O: '#e8742a', // scarf
  o: '#a84a1a', // scarf in shadow
};

// Head and body, facing right. 16 columns x 16 rows. Legs and scarf tail are added per frame.
const BODY = [
  '...W........W...',
  '..WWW......WWW..',
  '..WWWWWWWWWWWW..',
  '.WWWWWWWWWWWWWW.',
  '.WWWWDDDDDDDDWW.',
  '.WWWDDDDDDDDDDW.',
  '.WWWDDEEDDDEEDW.',
  '.WWWDDEEDDDEEDW.',
  '.WWWDDDDDDDDDDW.',
  '.wWWWDDDDDDDDWW.',
  '..wWWWWWWWWWWW..',
  '..oOOOOOOOOOOO..',
  '...wWWWWWWWWW...',
  '...wWWWWWWWWW...',
  '...wwWWWWWWWW...',
  '....wwWWWWWW....',
];

interface Frame {
  dy: number;                          // whole body shifted down (+) or up (-): the bob / stretch
  legs: [x: number, top: number, bottom: number][];   // 2px-wide legs, rows in cell space
  tail: [x: number, y: number, c: 'O' | 'o'][];       // scarf tail pixels, rows in BODY space
  blink?: boolean;
}

const LEGS_STAND: Frame['legs'] = [[5, 17, 18], [9, 17, 18]];
const TAIL_REST: Frame['tail'] = [[1, 11, 'O'], [0, 12, 'o']];

const FRAMES: Frame[] = [
  /* 0 idle       */ { dy: 0, legs: LEGS_STAND, tail: TAIL_REST },
  /* 1 idle (dip) */ { dy: 1, legs: [[5, 18, 18], [9, 18, 18]], tail: TAIL_REST },
  /* 2 blink      */ { dy: 0, legs: LEGS_STAND, tail: TAIL_REST, blink: true },
  /* 3 run a      */ { dy: 0, legs: [[3, 17, 17], [10, 17, 18]], tail: [[1, 11, 'O'], [0, 10, 'o']] },
  /* 4 run b      */ { dy: 1, legs: [[6, 18, 18], [8, 18, 18]], tail: [[1, 10, 'O'], [0, 10, 'o']] },
  /* 5 run c      */ { dy: 0, legs: [[4, 17, 18], [11, 17, 17]], tail: [[1, 11, 'O'], [0, 12, 'o']] },
  /* 6 run d      */ { dy: 1, legs: [[6, 18, 18], [8, 18, 18]], tail: [[1, 10, 'O'], [0, 11, 'o']] },
  /* 7 jump       */ { dy: -1, legs: [[5, 16, 17], [9, 16, 17]], tail: [[1, 12, 'O'], [1, 13, 'O'], [0, 14, 'o']] },
  /* 8 fall       */ { dy: 0, legs: [[4, 17, 18], [10, 17, 18]], tail: [[1, 10, 'O'], [0, 9, 'O'], [0, 8, 'o']] },
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
      if (c === 'E' && f.blink && y === 6) c = 'D'; // half-closed eyes
      px(x, y + top, c);
    });
  });
  for (const [x, a, b] of f.legs) {
    for (let y = a; y <= b; y++) { px(x, y, 'w'); px(x + 1, y, 'W'); }
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
