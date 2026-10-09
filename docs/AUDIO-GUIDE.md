# Audio guide: music and sound without AI

Jam rule: AI-generated sound is prohibited, and you must have the rights to all audio. So all music and effects are either **made by you** or **taken from sources with a licence you can follow**. Do not use AI music generators.

I have not checked the current terms of any site below. Open the licence page at download time and screenshot it. Terms change.

## 1. What the game needs

| Sound | Count | Feel |
|---|---|---|
| Music loop, main | 1 | Quiet, warm, a little sad. Slow tempo, soft pads, music box or piano |
| Music, tense (act 2) | 1 | Same melody, lower and sparser, wind in the background |
| Music, ending | 1 | The main melody full and warm |
| Ambience | 2 | Night wind; crackling fire |
| Effects | about 20 | Jump, land, run steps, leaf rustle, orb collect, lantern light, gloom squash, hurt, thaw friend, low-warmth warning, checkpoint, door open, UI click, win, game over |

## 2. Making it yourself (strongest for the jam)

| Tool | Where | Good for |
|---|---|---|
| **GarageBand** | iPad / Mac, free | Music with real instruments, loops, piano and strings you play on the glass. The easiest high-quality route |
| **LMMS** | Mac, free, open source | Full tracker-style music if you want a chiptune or synth feel |
| **BeepBox** | Browser, free | Tiny melody loops that sound like old consoles |
| **Bosca Ceoil** | Mac/PC, free, open source | Fast chiptune songs, very simple |
| **Audacity** | Mac, free, open source | Cutting and cleaning recordings |
| **Ardour** | Mac, free, open source | Full multitrack recording |
| **jsfxr / ChipTone** | Browser, free | Retro effects: jump, pickup, hurt |
| **Voice Memos** | iPhone / iPad | Foley: crunch real leaves, snap a twig, strike a match, rub a coat, then trim in Audacity or GarageBand |

**GarageBand notes:** Apple's included loops and instruments can be used in your own music, but you cannot just resell the loops on their own. Read Apple's terms if unsure.
**Recording your own foley** is the most distinctive and cheapest effect source. It is also unambiguous rights-wise.

**A fast melody recipe:** pick a minor key (A minor or D minor), four slow chords (Am, F, C, G), play a simple 8-note melody on a music-box or soft piano patch, loop it. Then thin it out for the cold level and fill it out for the ending.

## 3. Borrowing from free libraries (with credit)

| Source | Licence to expect | Notes |
|---|---|---|
| **Kenney.nl** | CC0 (public domain) | Effects and some music. No credit needed, but give it anyway |
| **OpenGameArt.org** | Varies: CC0, CC-BY, CC-BY-SA, GPL | Filter by licence. Avoid GPL for a game you may sell |
| **Incompetech (Kevin MacLeod)** | CC-BY | Lots of ambient. Needs attribution in the exact form he asks |
| **Free Music Archive** | Varies per track | Read each track |
| **Freesound.org** | CC0 or CC-BY, sometimes non-commercial | Effects and ambience. Avoid NonCommercial if you may sell the game |
| **itch.io asset packs** | Varies per pack | Read the pack page, not just the title |
| **Pixabay** | Its own licence | Allows many uses, but read it, and check whether the track was AI-generated |

Avoid:
- **NonCommercial (NC)** licences, because the mobile release may be paid.
- **ShareAlike (SA) and GPL** unless you are happy to open-source the game.
- Anything marked **AI-generated** or from an AI music service. This is banned in the jam.
- Anything with unclear origin, or music "inspired by" a commercial song.

## 4. Credits

Create `CREDITS.md` in the game and the itch page. For every borrowed asset record:
```
Title - Author - Source URL - Licence - Date downloaded - Where used
```
Put the credit list in the game's end screen or the page description. Keep the licence screenshots in a folder.

## 5. Budget for the weekend

| Item | Time |
|---|---|
| Music loop in GarageBand | 1 to 2 hours |
| Variations (tense, ending) | 1 hour |
| 20 effects: jsfxr plus foley | 1 to 2 hours |
| Mixing and volume pass | 30 minutes |

Total: about 4 to 5 hours. If time runs short: one great loop plus effects beats three rushed tracks.

## 6. Technical

- **Format:** `.ogg` (small, loops cleanly in browsers) and `.mp3` as a fallback. Export from GarageBand as AAC then convert, or use Audacity.
- **Looping:** make the end flow into the start. Trim to exact beats.
- **Loudness:** music quieter than effects. Test on phone speakers.
- **Size:** keep the whole game under about 20 MB for the browser build.
- **Where it goes:** `public/audio/music/` and `public/audio/sfx/`. My code-made sounds stay as fallbacks while you record.
