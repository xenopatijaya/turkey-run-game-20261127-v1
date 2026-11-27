[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/xenopatijaya/turkey-run-game-20261127-v1/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/xenopatijaya/turkey-run-game-20261127-v1/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

# Turkey Escape — make.fun turkey-run-game-01

A completely original Thanksgiving chase game. You are a turkey on the run:
Thanksgiving is coming, the farmer wants you for dinner, and the only way out
is 1,400 metres of farmyard, barn and kitchen to the forest gate.

## How to play

- **← → / A D** — run left and right
- **Space / ↑ / W** — jump
- **Shift** — dash (drains the dash meter, opens the gap to the farmer)
- **↓ / S** — hide in a haystack while the farmer searches
- **P** — pause · **M** — mute · **R / Enter** — restart · mouse works on menus

Dodge the oven and the falling carving knives, jump the fences and pumpkins,
grab corn for points and pumpkin pie for an extra life. Three hits and the
oven wins; let the farmer catch you and dinner is served. Three stages get
faster and busier: Farmyard → Barn → Kitchen.

## Play it

```sh
node serve.ts        # serves game/ on http://localhost:8080
```

Open `game/index.html` in desktop Chrome. No network request, no build step,
all sound synthesized with WebAudio. Screenshots are real renders of the game
(`?shot=title|play|chase|escaped|caught&seed=N` stages each scene).

## Files

- `game/index.html` — the page
- `game/src/config.js` — all tuning numbers
- `game/src/random.js` — seeded RNG
- `game/src/audio.js` — synthesized sounds and music
- `game/src/input.js` — keyboard + mouse
- `game/src/world.js` — turkey, farmer AI, hazards, stages
- `game/src/render.js` — all canvas art, HUD and screens
- `game/src/shots.js` — deterministic screenshot scenes
- `game/src/main.js` — boot and the game loop
- `main.ts` — the make.fun hand-in program
