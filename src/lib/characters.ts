import Phaser from 'phaser';

// The cast besides the fox. Like the fox, every character is pixel art typed as text:
// one letter per pixel, '.' is empty. Each array of rows is one animation frame.
// Enemies are purple so they read as danger against the blue world and the orange fox.

const GLOOM = [
  [ // 0 walk: tall
    '............',
    '...PPPPPP...',
    '..PpPPPPPP..',
    '.PpPPPPPPPP.',
    '.PPEEPPEEPP.',
    '.PPEKPPEKPP.',
    'PPPPPPPPPPPP',
    'PPPPPPPPPPPP',
    '.PP.PPPP.PP.',
  ],
  [ // 1 walk: squat
    '............',
    '............',
    '..PPPPPPPP..',
    '.PpPPPPPPPP.',
    'PPPEEPPEEPPP',
    'PPPEKPPEKPPP',
    'PPPPPPPPPPPP',
    'PPPPPPPPPPPP',
    'PP.PPPPPP.PP',
  ],
  [ // 2 stomped flat
    '............',
    '............',
    '............',
    '............',
    '............',
    '............',
    '.PPPPPPPPPP.',
    'PPXXPPPPXXPP',
    'PPPPPPPPPPPP',
  ],
];

const HOG_BODY = [
  '....S.S.S.....',
  '...SsSsSsS....',
  '..SsSsSsSsSFF.',
  '.SsSsSsSsSFFKF',
  '.sSsSsSsSsFFFN',
  '.SsSsSsSsSFFF.',
  '..sSsSsSsSFF..',
];
const HEDGEHOG = [
  [...HOG_BODY, '...L...L..L...'],
  [...HOG_BODY, '....L...L.L...'],
];

const BAT = [
  [ // wings up
    'B.............B',
    'BB...........BB',
    'BBB..B...B..BBB',
    'BBBB.BBBBB.BBBB',
    '.BBBBBEBEBBBBB.',
    '..BBBBBBBBBBB..',
    '....BBBFBBB....',
    '.....BB.BB.....',
  ],
  [ // wings down
    '...............',
    '.....B...B.....',
    '.....BBBBB.....',
    '.BBBBBEBEBBBBB.',
    'BBBBBBBBBBBBBBB',
    'BBB.BBBFBBB.BBB',
    'BB...BB.BB...BB',
    'B.............B',
  ],
];

const SPIDER = [
  [
    'L..L...L..L',
    '.L.LBBBL.L.',
    '..LBBBBBL..',
    'LLBBEBEBBLL',
    '..LBBBBBL..',
    '.L.LBBBL.L.',
    'L.........L',
  ],
  [
    '.L.L...L.L.',
    '.L.LBBBL.L.',
    '..LBBBBBL..',
    '.LBBEBEBBL.',
    '..LBBBBBL..',
    '.L.LBBBL.L.',
    '.L.......L.',
  ],
];

const MOTE = [
  [ // wings up
    'WW.....WW',
    'WWW...WWW',
    '.WWWBWWW.',
    '..WWBWW..',
    '...WBW...',
    '....B....',
    '.........',
  ],
  [ // wings down
    '.........',
    '....B....',
    '..WWBWW..',
    '.WWWBWWW.',
    'WWW.B.WWW',
    'WW.....WW',
    '.........',
  ],
];

const OWL_BODY = [
  'TTYYTOTYYTT',
  'TTTTTOTTTTT',
  'TTbbbbbbbTT',
  'TTbBbBbBbTT',
  'TTbbbbbbbTT',
  '.TTbbbbbTT.',
  '..FF...FF..',
];
const OWL_EARS = [
  '.T.......T.',
  '.TT.....TT.',
  '.TTTTTTTTT.',
];
const OWL = [
  [...OWL_EARS, 'TTYYTTTYYTT', 'TYYKYTYKYYT', ...OWL_BODY], // eyes open
  [...OWL_EARS, 'TTTTTTTTTTT', 'TKKKKTKKKKT', ...OWL_BODY], // blink
];

const HEART = [
  ['.RR.RR.', 'RWRRRRR', 'RRRRRRR', '.RRRRR.', '..RRR..', '...R...'],
  ['.DD.DD.', 'DDDDDDD', 'DDDDDDD', '.DDDDD.', '..DDD..', '...D...'], // empty
];

/** Sprite sheet from text frames: every frame the same size, laid out left to right. */
function sheet(scene: Phaser.Scene, key: string, frames: string[][], pal: Record<string, string>): void {
  if (scene.textures.exists(key)) return;
  const h = frames[0]!.length, w = frames[0]![0]!.length;
  if (frames.some((f) => f.length !== h || f.some((row) => row.length !== w))) {
    throw new Error(`sprite '${key}' has frames or rows of different sizes`);
  }
  const tex = scene.textures.createCanvas(key, w * frames.length, h)!;
  const ctx = tex.getContext();
  frames.forEach((rows, i) => {
    rows.forEach((row, y) => [...row].forEach((c, x) => {
      const colour = pal[c];
      if (!colour) return;
      ctx.fillStyle = colour;
      ctx.fillRect(i * w + x, y, 1, 1);
    }));
    tex.add(i, 0, i * w, 0, w, h);
  });
  tex.refresh();
  tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
}

function anim(scene: Phaser.Scene, name: string, key: string, frames: number[], frameRate: number): void {
  if (scene.anims.exists(name)) return;
  scene.anims.create({ key: name, frames: frames.map((frame) => ({ key, frame })), frameRate, repeat: -1 });
}

/** Builds every character sheet and animation. Safe to call more than once. */
export function makeCharacters(scene: Phaser.Scene): void {
  sheet(scene, 'gloom', GLOOM, { P: '#6a46a8', p: '#9a7ad6', E: '#f2efe6', K: '#1a1026', X: '#d8cdf0' });
  sheet(scene, 'hedgehog', HEDGEHOG, { S: '#b0457a', s: '#7a2c55', F: '#f0d9b5', K: '#1a1026', N: '#2a1a16', L: '#7a2c55' });
  sheet(scene, 'bat', BAT, { B: '#7b4fb0', E: '#ffd27a', F: '#f2efe6' });
  sheet(scene, 'spider', SPIDER, { B: '#4a2d6e', L: '#8a6ac0', E: '#ff6a6a' });
  sheet(scene, 'mote', MOTE, { W: '#8fd8ff', B: '#f4fdff' });
  sheet(scene, 'owl', OWL, { T: '#a8855c', Y: '#ffd27a', K: '#1a1026', O: '#e8742a', b: '#e6d2ae', B: '#c4a878', F: '#e8a33d' });
  sheet(scene, 'heart', HEART, { R: '#ff5a6a', W: '#ffd0d6', D: '#3a2a44' });

  anim(scene, 'gloom-walk', 'gloom', [0, 1], 4);
  anim(scene, 'hedgehog-walk', 'hedgehog', [0, 1], 6);
  anim(scene, 'bat-fly', 'bat', [0, 1], 9);
  anim(scene, 'spider-wiggle', 'spider', [0, 1], 5);
  anim(scene, 'mote-fly', 'mote', [0, 1], 12);
  anim(scene, 'owl-idle', 'owl', [0, 0, 0, 0, 0, 0, 1, 0], 3);
}
