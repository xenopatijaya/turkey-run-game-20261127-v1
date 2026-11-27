// Deterministic screenshot scenes: each one plays the real rules forward from a
// fresh world for a fixed number of steps, steered by a simple autopilot (jump
// over what is ahead, dash when the farmer closes in, hide when a haystack is
// near), so every frame is what a real run looks like and the same seed always
// gives the same frame.
import { STEP } from './config.js';
import { EVENT_ESCAPED, EVENT_OVER } from './world.js';
import { SCREEN_ESCAPED, SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const SAMPLE = STEP;
const START_SECONDS = 4;
const PLAY_SECONDS = 14;
const CHASE_SECONDS = 9;
const ESCAPE_SECONDS = 200;

/** Jump late over ground hazards (fence, pumpkin, oven); knives are dodged sideways, never jumped into. */
function dangerAhead(state, horizon) {
  const turkey = state.turkey;
  for (const item of state.obstacles) {
    if (item.x < turkey.x + 130 && item.x + item.width > turkey.x) {
      const reaches = item.kind === 'oven' || item.kind === 'fence' || item.kind === 'pumpkin';
      if (reaches && item.y + item.height > turkey.y + 10) return true;
    }
  }
  return false;
}

/** Step sideways when a falling knife is about to land on the turkey — but never
 *  sidestep into a ground hazard, and never back up past the safe line. */
function dodgeKnife(state) {
  const turkey = state.turkey;
  const centre = turkey.x + TURKEY_WIDTH / 2;
  for (const item of state.obstacles) {
    if (item.kind === 'fence' || item.kind === 'pumpkin' || item.kind === 'oven') {
      if (item.x < turkey.x + 300 && item.x + item.width > turkey.x) return 0;
    }
  }
  for (const item of state.obstacles) {
    if (item.kind !== 'knife' || item.stuck) continue;
    const knifeCentre = item.x + item.width / 2;
    const fallingOnto = item.y > turkey.y - 340 && item.y < turkey.y + 60;
    if (fallingOnto && Math.abs(knifeCentre - centre) < 150) {
      if (knifeCentre > centre) return turkey.x > 200 ? -1 : 0;
      return 1;
    }
  }
  return 0;
}

const TURKEY_WIDTH = 74;

/** A knife about to slice the turkey at ground level: jump clean over it. */
function lowKnifeClose(state) {
  const turkey = state.turkey;
  const centre = turkey.x + TURKEY_WIDTH / 2;
  for (const item of state.obstacles) {
    if (item.kind !== 'knife' || item.stuck) continue;
    const knifeCentre = item.x + item.width / 2;
    if (item.y > turkey.y - 80 && Math.abs(knifeCentre - centre) < 100) return true;
  }
  return false;
}

function autopilot(state) {
  if (state.turkey.hidden) return { move: 0, jump: false, dash: false, hide: false };
  const jump = (dangerAhead(state, 0.5) || lowKnifeClose(state)) && state.turkey.grounded;
  const dash = state.gap < 150 && state.dash > 40;
  let hide = false;
  for (const hay of state.hides) {
    if (!hay.used && Math.abs((hay.x + hay.width / 2) - (state.turkey.x + 37)) < 60 && state.turkey.grounded) hide = true;
  }
  return { move: dodgeKnife(state), jump, dash, hide };
}

function runFor(world, seconds, pilot) {
  let events = 0;
  for (let i = 0; i < seconds / SAMPLE; i += 1) {
    const input = pilot ? autopilot(world.state) : { move: 0, jump: false, dash: false, hide: false };
    events |= world.step(SAMPLE, input.move, input.jump, input.dash, input.hide);
    if (events & (EVENT_OVER | EVENT_ESCAPED)) break;
  }
  return events;
}

/**
 * Set `world` to the named scene and return the screen to draw and the best
 * score to show. Scenes: title, play, chase (farmer closing in), escaped, caught.
 */
export function stageShot(name, world) {
  world.reset();
  if (name === 'title') {
    runFor(world, START_SECONDS, false);
    return { screen: SCREEN_TITLE, best: 0 };
  }
  if (name === 'escaped') {
    runFor(world, ESCAPE_SECONDS, true);
    return { screen: world.state.escaped ? SCREEN_ESCAPED : SCREEN_PLAY, best: world.state.score };
  }
  if (name === 'caught') {
    // A careless pilot: never jumps, never dashes — the farmer catches it.
    let events = 0;
    for (let i = 0; i < 600 / SAMPLE; i += 1) {
      events |= world.step(SAMPLE, 0, false, false, false);
      if (events & EVENT_OVER) break;
    }
    return { screen: SCREEN_OVER, best: world.state.score };
  }
  if (name === 'chase') {
    runFor(world, CHASE_SECONDS, true);
    // Force the farmer close so the chase reads at a glance.
    world.state.gap = 78;
    return { screen: SCREEN_PLAY, best: world.state.score };
  }
  runFor(world, PLAY_SECONDS, true);
  return { screen: SCREEN_PLAY, best: world.state.score };
}
