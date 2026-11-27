// The screenshot scenes behind ?shot=start|play|caught|escaped. Each one
// plays the real rules forward from a fresh world, steered by a simple
// autopilot (jump the fences, hay, pumpkins, ovens and knives; slide under
// branches; double-jump for the high golden feather), so the frame is what
// a short game really looks like and the same seed always gives the same
// frame. The caught scene's pilot never jumps, so the farmer catches Tom
// the way a hurried player gets caught.

import { FIELD, GOAL_METERS, PLAYER, STEP } from './config.js';
import { EVENT_OVER, EVENT_WIN, KIND_BRANCH } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';

const START_SECONDS = 5;
const PLAY_SECONDS = 24;
const END_LIMIT_SECONDS = 600;
const ESCAPE_LIMIT_SECONDS = 300;
const SAMPLE = 1 / 30;

/** The pilot jumps when an obstacle is this close, in seconds of travel. */
const JUMP_AHEAD = 0.3;
const SLIDE_AHEAD = 0.3;

/** The nearest live obstacle ahead of the turkey, or null. */
function nearestObstacle(state) {
  let nearest = null;
  for (let index = 0; index < state.obstacles.length; index += 1) {
    const item = state.obstacles[index];
    if (!item.active) continue;
    if (item.x + item.width < state.player.x) continue;
    if (nearest === null || item.x < nearest.x) nearest = item;
  }
  return nearest;
}

function autopilot(state, careless) {
  if (careless) return { jump: false, slide: false };
  const player = state.player;
  const obstacle = nearestObstacle(state);
  if (obstacle === null) return { jump: false, slide: false };
  const gap = obstacle.x - (player.x + player.width);
  const secondsAway = gap / state.speed;
  if (obstacle.kind === KIND_BRANCH) {
    return { jump: false, slide: secondsAway < SLIDE_AHEAD && player.grounded };
  }
  if (secondsAway < JUMP_AHEAD && player.grounded) return { jump: true, slide: false };
  // A tall hay bale or a wide oven sometimes needs the second jump.
  if (!player.grounded && player.jumps === 1 && secondsAway < 0.18 && obstacle.x + obstacle.width > player.x + 20) {
    return { jump: true, slide: false };
  }
  return { jump: false, slide: false };
}

/**
 * Set `world` to the named scene and return the screen to draw over it
 * and the best score to show. Unknown names stage the title scene.
 */
export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'caught' && name !== 'escaped') {
    for (let index = 0; index < START_SECONDS / STEP; index += 1) {
      world.step(STEP, false, false, true);
    }
    return { screen: SCREEN_TITLE, best: 0 };
  }
  if (name === 'caught') {
    for (let index = 0; index < END_LIMIT_SECONDS / STEP; index += 1) {
      const move = autopilot(world.state, true);
      if (world.step(STEP, move.jump, move.slide, false) & EVENT_OVER) break;
    }
    return { screen: SCREEN_OVER, best: world.state.score };
  }
  if (name === 'escaped') {
    for (let index = 0; index < ESCAPE_LIMIT_SECONDS / STEP; index += 1) {
      const move = autopilot(world.state, false);
      const events = world.step(STEP, move.jump, move.slide, false);
      // A caught turkey never escapes: stop at the first game over instead
      // of stepping on until the distance counter drifts past the gate.
      if (events & (EVENT_WIN | EVENT_OVER)) break;
    }
    const won = world.state.won;
    return { screen: won ? SCREEN_WIN : SCREEN_OVER, best: world.state.score };
  }
  for (let index = 0; index < PLAY_SECONDS / STEP; index += 1) {
    const move = autopilot(world.state, false);
    if (world.step(STEP, move.jump, move.slide, false) & EVENT_OVER) break;
  }
  return { screen: SCREEN_PLAY, best: world.state.score };
}
