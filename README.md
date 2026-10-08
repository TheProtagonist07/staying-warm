# Mini Jam 221: Autumn

Jam: https://itch.io/jam/mini-jam-221-autumn (Oct 9 04:00 UTC to Oct 12).

Stack: Phaser 3 + TypeScript + Vite. `npm run dev`, `npm run zip` (builds `game.zip` for itch HTML5 upload).

Rules to respect: new work only, no AI-generated images/sound (art is drawn in code, audio is WebAudio in `src/lib/sfx.ts`), must follow the limitation announced at start.

## Practice game (pre-jam rehearsal, not the submission)

Collect all 6 light orbs, then reach the door. A/D or arrows to move, Space/W/Z to jump, C cycles the light colour, R restarts after winning. Level data lives in `src/level.ts`; the look generators are in `src/lib/atmosphere.ts`. The real jam entry gets designed after the limitation is announced.
