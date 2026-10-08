# Game idea: "Last Light of Autumn" (working title)

A story, goals and level plan built only from what already exists in this repo. Nothing here needs a new asset to work. Title is a placeholder; I have not checked whether it is taken on itch.

## One-line pitch

A fox kit carries the last spark of autumn in its tail through a ruined lamplighter town, relighting the lanterns before the long winter night closes in.

## Story

**The world.** Hollowmere was a town of lamplighters. Every autumn they lit the lantern road so the forest could find its way through winter. The lamplighters are gone. The lanterns went cold, and where a lantern goes cold, its shadow gets up and walks: that is a **gloom**.

**The hero.** Ember, a fox kit, was born under the Hearth, the town's great lamp, on the night it went out. One spark of it caught in the tip of Ember's tail. It is the last warm light left.

**The companion.** Wick is a mote, a stray flame from a broken lantern. It is small, nervous and knows where the other lost sparks are hiding.

**The guide.** Barrow the owl was the lamplighters' watchman. He is too old to fly the road, so he sits on the signpost and tells Ember what to do.

**The goal.** Gather the six scattered sparks of the Hearth, carry them to the Hearth Gate, and relight it before the first frost.

**The turn.** Glooms are not monsters. They are lanterns' shadows that forgot what they were. When Ember lands on one, it does not die: it bursts back into fireflies. By the end the player realises the fireflies drifting through the level were never decoration. They are glooms that have already been set free.

**The ending.** Ember steps through the Hearth Gate. Every lantern on the road lights at once, back to the start, the glooms left behind turn to fireflies, and the sky warms from blue to orange. Barrow: "That will hold till spring."

## What each existing asset means in the story

| Asset in the game | Story role |
|---|---|
| Fox with glowing tail tip | Ember, carrying the last spark |
| Mote (blue light) | Wick, the companion who points at sparks |
| Owl on the signpost | Barrow, who gives the mission and hints |
| Orbs | The six scattered sparks of the Hearth |
| Hanging lanterns that light as you pass | The lantern road; lighting them is the mission's visible progress |
| Stone lantern (checkpoint) | A waystone: a lamplighter rest stop that remembers you |
| Arched door of warm light | The Hearth Gate |
| Gloom | A cold lantern's shadow. Land on it to free it |
| Hedgehog | A forest animal gone prickly with fear of the dark. Never hurt it, go over it |
| Bat, spider | The dark's own creatures. They guard gaps and trees |
| Fireflies | Glooms already set free |
| Pumpkins | Lamplighters' markers. They wake when the spark comes near |
| Moon, clouds, ruins, big ring | Hollowmere and the dead Hearth machinery |
| Blue / red / orange light (C key) | The three stages of the night: dusk, deep night, first dawn |

## Mission objectives

**Main objective (needed to finish)**
1. Find Wick near the start.
2. Gather all 6 sparks.
3. Reach the Hearth Gate.

**Second objective (changes the ending)**
- Relight every lantern on the road. All lit = the full ending with the sky turning to dawn. Some unlit = the gate still opens, but the road behind stays partly dark and Barrow says so.

**Optional goals (for replay and for jam ratings)**
- Free every gloom.
- Finish without losing a heart.
- Wake every pumpkin.
- Beat a target time.

Show these as a short checklist on the win screen. It costs almost nothing and gives players a reason to play twice.

## One rule change that ties story to play

Right now lanterns are only for show. Proposed rule: **glooms cannot stand in lantern light.** Lighting a lantern frees any gloom under it and keeps that patch safe.

Why it matters: it makes "carry light" the one thing the player does, instead of light being decoration on top of a jump-and-collect game. It also gives the player a choice: take the risky jump to reach a lantern, and the road behind you becomes safe.

## Level plan: one night in three parts

The room that exists today is roughly Part 1. Each part is one screen-chain of about the same length.

| Part | Light | Teaches | Enemies | Feel |
|---|---|---|---|---|
| 1. Dusk Orchard | Blue | Move, jump, meet Barrow, find Wick, first spark, first gloom on flat ground | Gloom | Safe, quiet |
| 2. The Lantern Road | Red | Timing: a hedgehog on a spark's path, a spider under a tree, lantern light clearing glooms | Gloom, hedgehog, spider | Tense |
| 3. Hearth Rise | Orange | Everything together: a bat over a gap, glooms on narrow ledges, the climb to the gate | All four | Climb toward warmth |

Sparks: 2 per part. Waystone (checkpoint) at the start of parts 2 and 3. The light colour changes by itself as the player enters each part, so the C key is no longer needed.

## Barrow's lines (short, he is the whole tutorial)

- Start: "Hoo. A lost light hides up ahead. It likes foxes."
- After Wick joins: "Gather every spark, then find the gate. Hop on glooms, never on thorns."
- First lantern lit: "That is the way. Light them all and the road will hold."
- At the gate, lanterns missing: "The gate will open. But the road behind you is still dark."
- Ending: "That will hold till spring."

## How difficult it should be

- 3 hearts, refilled at each waystone. Falling or running out sends you to the last waystone and keeps your sparks.
- Part 1 cannot really be failed. Part 3 should take a new player 3 to 5 tries.
- Target length: 5 to 8 minutes for a first run.

## Scope for a 72-hour jam

**Must have:** the three parts, the lantern-light rule, Barrow's lines, the ending with all lanterns lighting, win-screen checklist.
**Nice to have:** a title screen with Ember by a cold lantern, soft looping music made in code, glooms turning into fireflies on screen.
**Cut first:** optional goals beyond "all lanterns", any new enemy, any new ability.

## What is not decided yet

- **The jam limitation.** It is announced at the start and is mandatory. This story bends easily (the core is "carry light"), but the limitation may force a change, for example to controls, colours or length. Decide after it drops.
- **The rules on prior work.** The jam asks for games newly created during the jam, and bans AI-generated images and sound. Planning a story ahead is normal. Whether the code and sprites made this week can be reused is your call, and worth a question to the hosts.
- **Names.** Ember, Wick, Barrow, Hollowmere are suggestions.
