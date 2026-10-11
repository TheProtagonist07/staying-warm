# Staying Warm

A short cold-night platformer made for Mini Jam 221 (limitation: "Staying Warm"). Carry sparks up a frozen mountain, light every lantern, and keep your warmth from running out.

Play: A/D or arrows to move, Space/W/Z to jump, M to mute, R to restart after winning. Touch controls appear on phones and tablets.

## How it plays
- Your warmth drains all the time, and faster in cold-wind zones. Standing near a lit lantern refills it. At zero you freeze and wake at the last lantern.
- Sparks (gold coins) light lanterns when you walk up to them. Light all 6 and the door at the summit opens.
- Land on blue slugs to squash them. Red spikers and bats hurt: hop or wait.
- Five optional star shards are hidden above the route.

## Stack and layout
Phaser 3 + TypeScript + Vite. `npm run dev` to play locally, `npm run zip` builds `game.zip` for an itch.io HTML5 upload.

- `src/level.ts`: the whole level (platform segments, items, enemies, wind zones) and the warmth numbers.
- `src/scenes/GameScene.ts`: gameplay. `src/scenes/BootScene.ts`: loading and title.
- `src/lib/atmosphere.ts`, `src/lib/scenery.ts`: sky, glow, fog, grain, mountains, stars, moon, drawn by code.
- `public/assets`: art and audio. `third_party/`: the original downloads with their licence files. Credits: `public/CREDITS.txt`.

## Rules followed (Mini Jam 221)
Art and sound are CC0 packs by Kenney and CC0 tracks from OpenGameArt (see credits). Docs in `docs/` are planning notes for a larger mobile version.
