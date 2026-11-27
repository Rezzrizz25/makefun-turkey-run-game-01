# Tom's Great Escape — A Thanksgiving Breakout

[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/Rezzrizz25/makefun-turkey-run-game-01/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/Rezzrizz25/makefun-turkey-run-game-01/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

Play more make.fun games: https://make.fun/r/v4m1pbv2

**Tom's Great Escape** is an original one-player turkey escape game: Thanksgiving is coming and Tom the turkey is on the menu. Run 1200 metres through the farmyard at dusk to the forest gate while the farmer chases you with his pitchfork, jump fences, hay bales, pumpkin piles, the hot oven and carving knives stuck in the dirt, slide under low branches, grab corn for points and golden feathers to win a life back. Three stumbles and the farmer catches you — reach the gate and Tom is free.

## How to play

- **Goal:** cover 1200m and reach the forest gate. Every stumble pulls the farmer closer; run clean and he drops back.
- **Jump:** Space, ↑, W, or click / tap. Jump again mid-air for a double jump — the only way to reach the high golden feathers.
- **Slide:** ↓ or S — duck under low branches.
- **Pickups:** corn +10 points, golden feather +50 points (and a life back when hurt).
- **Lives:** 3 golden feathers. Lose one per stumble; a short invulnerable blink follows each hit.
- **Difficulty:** the run speeds up and obstacles come thicker every 150m, up to level 10.
- **Screens:** title, run in play with a HUD (score, level, distance bar to the gate, lives), paused, caught-for-dinner and escaped — each with a restart.
- **Sound:** WebAudio blips only (jump, pickup, stumble, win), M to mute. No audio files, no network requests, no external assets — all art is drawn in code.

## Run it

`node serve.ts`, then open http://localhost:8080. Node 22 or later. No build step, no dependencies.

## Entry

Built for make.fun's "Make the best turkey escape game" bounty (turkey-run-game-01, $250 shared by the 20 best entries). `main.ts` hands the game in: it copies `game/` and `screenshots/` to `/output` and writes `/output/dossier.json` with the vendored make.fun library.
