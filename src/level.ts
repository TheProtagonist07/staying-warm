// Level data, kept separate from game logic so changing a level never touches code paths.
// Platforms: [x, topY, width]; blocks extend below the screen. Gaps are <=80px so every jump is makeable.
export const WORLD_W = 2880;
export const SPAWN = { x: 60, y: 400 };

export const PLATFORMS: [number, number, number][] = [
  [0, 470, 520], [600, 470, 500], [780, 410, 110], [1180, 470, 260], [1520, 430, 300],
  [1900, 390, 160], [2140, 430, 120], [2340, 470, 540], [2420, 410, 80], [2500, 350, 140],
];

// Hanging lamps: [x, y]
export const LAMPS: [number, number][] = [[260, 250], [820, 230], [1320, 260], [1700, 240], [2250, 250], [2650, 230]];

// Collectible light orbs: [x, y]. An orb ~22px above a surface is picked up by walking; ~70px needs a jump.
export const ORBS: [number, number][] = [[330, 400], [835, 388], [1300, 448], [1660, 360], [1980, 368], [2570, 328]];

// Checkpoint beacon x (stands on the platform at that x), and the exit door x (on the floor).
export const CHECKPOINT = { x: 1560, topY: 430 };
// Keep the door clear of the foreground pillars' resting position at the end of the room.
export const EXIT = { x: 2720, topY: 470 };
