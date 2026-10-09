# Story bible: "Staying Warm" (working title: *Last Light of Autumn*)

Built for the Mini Jam 221 limitation **"Staying Warm"**, and shaped so it can grow into a full mobile release later. Names are placeholders. Replaces the earlier draft in `GAME-IDEA.md`.

## The idea in one breath

Warmth is the only thing that keeps you alive, and it is also the only thing worth giving away.
A fox kit carries the last spark of a dead town's great lamp. It keeps her warm. Every time she shares it, she gets colder.

## Why it fits the limitation

The limitation is mandatory and rated, so it is the mechanic, not the setting:
- **You are always cold.** Warmth drains in shadow and in wind.
- **Light refuels you.** Lanterns, campfires and lit pumpkins restore warmth when you stand near them.
- **Warmth is also the currency.** Thawing a frozen friend costs warmth, and a thawed friend becomes a light source that helps you later.

One number (the warmth meter) replaces the heart system, so there is one rule to learn.

## World

**Hollowmere** was a town of lamplighters. Every autumn they lit the lantern road so the forest could find its way through winter. They kept one great lamp, **the Hearth**, burning in the town square.

Then the first frost came early and the Hearth went out. Lanterns went cold, the town emptied, and the cold lantern-shadows stood up and began to wander. They don't hunt out of hate: they drain warmth because they are made of its absence. They are **glooms**.

**Tone:** quiet, cosy, a little sad. Autumn colours against a cold blue night. Nothing graphic: the danger is cold, not violence.

## Cast

| Character | Who they are | Role in play |
|---|---|---|
| **Ember** | A fox kit born under the Hearth the night it died. One spark stuck in her tail tip. | The player. The spark is her warmth meter. |
| **Wick** | A stray flame from a broken lantern. Small, nervous, talks in flickers. | Companion. Points at the nearest spark and flares to warn of cold gusts. |
| **Barrow** | An old owl, the lamplighters' watchman. Too stiff to fly the road. | Guide. Gives the mission and hints from the signpost. |
| **Cinder** | A vixen, Ember's mother, seen only as a frozen shape by the gate until the end. | The reason Ember keeps going. |
| **Glooms** | Cold lantern-shadows. Purple. Slow and sad. | Enemy. Drains warmth on touch. Landing on one frees it into a firefly. |
| **Thorn** (hedgehog), **Dusk** (bat), **Weaver** (spider) | Forest creatures frightened into hostility by the dark. | Enemies that guard gaps and trees. |
| **Friends to thaw** | Frozen animals along the road (hare, frog, badger, mole). | Optional rescues. Each becomes a light source and a small ability. |

## The turn (the emotional centre)

Halfway through, the player learns that glooms are not monsters: freeing one makes it a firefly, and the fireflies drifting through the earlier levels were glooms the player already freed. The player has been *undoing the cold* all along, not killing things.

## Three acts (one per level, matching the jam scope)

**Act 1: Dusk Orchard (blue light).** Barrow gives the mission. Wick joins. The player learns the warmth meter in a safe place, lights the first lantern, and frees the first gloom. Ends at a waystone.

**Act 2: The Lantern Road (deep red night, the coldest).** The meter drains faster. Wind gusts blow the player's warmth off. The player finds the first frozen friend and must choose to spend warmth to thaw it, which teaches the central trade: **give and get colder, or hold and stay safe.** The friend's lantern makes the road behind them safe.

**Act 3: Hearth Rise (orange dawn creeping in).** Everything combined. The climb to the Hearth Gate is lit by the friends the player chose to thaw. The more friends thawed, the more of the road is already lit.

**Ending.** At the gate, Cinder stands frozen. Ember has almost no warmth left. She gives her last spark to relight the Hearth. For a moment the screen goes dark and cold. Then every lantern on the road lights at once, the thawed friends gather round, the sky turns from blue to orange, and Cinder's frozen shape warms and turns to look at her.

Barrow: "That will hold till spring."

**Variation by choice (cheap to build, good for replay):**
- Thawed 0 friends: Ember reaches the Hearth alone and the ending is quiet and small.
- Thawed all: the whole town of animals is at the gate, and the Hearth burns brightest.

## Missions and objectives

**Main:** reach the Hearth Gate with warmth left to give.
**Spark hunt:** find and keep the 6 sparks (the orbs). They are the only things that can top up the meter's maximum.
**Rescues:** thaw frozen friends (optional, changes the ending).
**Road:** relight every lantern.
**Optional:** free every gloom, finish without freezing once, wake every pumpkin.

## Rules the story teaches

1. Stand near light to stay warm.
2. Warmth spent on others comes back to you later, as light on the road.
3. Gloom-touch drains warmth. Landing on a gloom frees it.
4. Wind gusts strip warmth. Shelter behind walls, trees and lanterns.
5. At zero warmth you freeze and wake at the last waystone, keeping what you've collected.

## Barrow's lines

- Start: "Hoo. The Hearth is cold, little one. But you are not."
- Wick joins: "Gather the sparks. Light the road. Hop on glooms, never on thorns."
- First lantern lit: "That is the way."
- First friend thawed: "Warmth you give is warmth that stays."
- Low warmth: "Find a lantern, quickly now."
- Ending: "That will hold till spring."

## Making it a mobile release later

This story and the warmth rule carry over unchanged. For iOS and Android the work is:
- **Touch controls:** left thumb to move, right thumb to jump, large buttons.
- **Portrait or landscape:** the level layouts are side-scrolling, so landscape is easiest.
- **Content:** 5 to 8 levels in a 3-biome campaign (orchard, road, town, then a winter coda). More rescues, boss at the Hearth.
- **Store assets:** icon, screenshots and a trailer, plus a privacy statement.
- **Tech:** the web build can be wrapped (Capacitor) or rebuilt in Unity, which you already have tooling for.
Decide the engine after the jam, once you know how the web game plays.

## Open decisions

- **Name:** pick one. Candidates: *Staying Warm*, *Last Light of Autumn*, *Ember Road*.
- **Does Ember speak?** Right now she doesn't; the animals do. That is cheaper and more charming.
- **How dark is the ending?** The version above is gentle. A bittersweet alternative has Ember fade as the Hearth lights, with the friends carrying her light on. Pick before writing the final scenes.
