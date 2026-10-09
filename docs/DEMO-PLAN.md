# Jam entry as demo and ad for the mobile release

Decision (2026-10-09, Shivam): the Mini Jam 221 entry is the base of the real game. It ships on itch.io as a free demo and works as the advert for the iOS and Android release.

## Two cautions

1. **The jam wants a new game, "mostly made within the jam timeframe."** A demo of a bigger planned game is fine, and planning ahead is normal. What matters is that what you *submit* is substantially made between Oct 9 04:00 and Oct 12 04:00 (timezone unstated, assumed UTC). Code and sprites made before the jam are a grey area. Ask the hosts on Discord, describe it honestly, and write the answer on your page. Being open about it is also better marketing than hiding it.
2. **Don't let the ad get in the way of the game.** Ratings are Enjoyment, Concept, Presentation and Use of limitation. The ad part is page text and one end screen. The game itself must stand alone.

## What the demo is

A vertical slice, about 8 to 10 minutes: two short levels that show the whole idea, then a "to be continued" screen.

| Part | Contents | Purpose |
|---|---|---|
| Level 1: Dusk Orchard | Warmth meter, lanterns, first gloom, Barrow and Wick | Teaches the rule in a safe place |
| Level 2: Lantern Road (short) | Wind, a hedgehog, one frozen friend to thaw | The trade: spend warmth to gain light |
| End screen | "Ember's road continues." Wishlist / follow link, mailing list | The ad |

**What it must prove to a player:** the warmth rule is fun, the world is charming, there is more to come.

## What makes it an ad

On the itch page:
- First line: the hook, e.g. "A fox kit carries the last spark of a dead town. Keeping it warm means giving it away."
- One looping GIF of the best 5 seconds above the fold.
- Four screenshots, one per mood: cosy, tense, thaw moment, dawn.
- A short "About the full game" section: what's coming (more friends, more biomes, mobile).
- "Coming to iOS and Android." **Do not give a date or a store link until they exist.** Do not promise features you haven't scoped.
- A follow button and a mailing list link. Free and simple: itch's own follow, plus a mailing list service (Buttondown, Mailchimp or similar).
- Credits for every borrowed asset.

In the game:
- End screen with the follow link and a short message.
- Title screen shows the final logo and "Demo".

## Mobile from day one

The demo plays in a browser on phones, so build for touch now:
- Left thumb: move. Right thumb: jump, large buttons.
- Landscape, 960x540 base, scaled to fit.
- No hover-only interactions. Everything works with one tap.
- Test on your own phone and iPad.

## How it reaches the app stores

**Recommended: keep Phaser and wrap it.** The demo is already a web game. A wrapper such as Capacitor puts it inside a native app for iOS and Android without a rewrite. I'd confirm the current state of Capacitor and of each store's rules before committing, since I haven't checked them today.

Alternative: rebuild in Unity (you have tooling for it), which costs weeks and buys better performance and store tooling.

Decide after the jam, using how smoothly the web version runs on a real phone.

Rough costs and chores to verify before committing (I'm going from memory):
- **Apple:** a paid developer account, a Mac with Xcode, app review, a privacy policy, screenshots.
- **Google Play:** a one-time developer fee, a privacy policy, store listing, internal testing before release.
- Both: an app icon, store screenshots, age rating, support email.

## Schedule (IST), fitting the jam

| When | Goal |
|---|---|
| Fri night | Warmth meter and refuel working; touch controls |
| Sat | Level 1 and 2, your Procreate art swapped in, music loop |
| Sun morning | End screen, title, tune difficulty |
| Sun afternoon | itch page, GIF, screenshots, credits, content notes |
| **Sun night by 11 PM** | **Submit with margin** |
| After the jam | Read ratings and comments, patch what players report, decide the mobile engine |

## Things to avoid

- Don't put a store badge or release date on the page before they're real.
- Don't use unlicensed music or art, even for a demo.
- Don't claim the whole game is finished. Label it **Demo** or **Vertical slice**.
- Don't rate other jam entries differently based on theme, and keep promotion on your own page. Don't spam other entries' comments.

## After the jam

1. Post a devlog with what you learned and what comes next. The jam audience is the first audience.
2. Fix bugs found in comments and publish an update. The original jam build must stay downloadable, so note changes on the page.
3. Gather the mailing list and ratings. Use them to decide whether the mobile release is worth the effort.
