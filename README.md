# Mini Jam 221: Autumn

Jam: https://itch.io/jam/mini-jam-221-autumn (Oct 9 04:00 UTC to Oct 12).

Stack: Phaser 3 + TypeScript + Vite. `npm run dev`, `npm run zip` (builds `game.zip` for itch HTML5 upload).

Rules to respect: new work only, no AI-generated images/sound (art is drawn in code, audio is WebAudio in `src/lib/sfx.ts`), must follow the limitation announced at start.

## Practice game (pre-jam rehearsal, not the submission)

Collect all 6 light orbs, then reach the door. A/D or arrows to move, Space/W/Z to jump, C cycles the light colour, R restarts after winning. Level data and prop placement live in `src/level.ts`. Art is all drawn from code: lighting and scenery layers in `src/lib/atmosphere.ts`, the fox in `src/lib/hero.ts`, ground tiles, props, trees, moon, clouds and the distant forest in `src/lib/environment.ts` (sheets: `docs/assets.jpg`, `docs/assets-interactive.jpg`). Things that react to the fox (lanterns, grass, leaf piles, mushrooms, pumpkins, birds, fireflies) live in `src/lib/life.ts`; particle effects in `src/lib/fx.ts`. The rest of the cast (gloom, hedgehog, bat, spider, the mote companion, the owl) is drawn in `src/lib/characters.ts` and behaves per `src/lib/creatures.ts`; enemy placement is the `FOES` list in `src/level.ts` (sheet: `docs/cast.jpg`). The fox has 3 hearts: land on glooms to squash them, avoid everything else. The real jam entry gets designed after the limitation is announced.
