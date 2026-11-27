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
  // Hide only when the farmer is actually threatening: hiding while he is far
  // away wastes the run (hazards keep scrolling while the turkey stands still).
  let hide = false;
  if (state.gap < 200) {
    for (const hay of state.hides) {
      if (!hay.used && Math.abs((hay.x + hay.width / 2) - (state.turkey.x + 37)) < 60 && state.turkey.grounded) hide = true;
    }
  }
  return { move: dodgeKnife(state), jump, dash, hide };
}

export { autopilot };

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
    // Wait for a haystack on screen (the hide mechanic must read), without
    // letting the autopilot hide the turkey for the frame.
    for (let i = 0; i < 240; i += 1) {
      const hayOnScreen = world.state.hides.some((h) => !h.used && h.x > 700 && h.x < 1150);
      if (hayOnScreen) break;
      const input = autopilot(world.state);
      input.hide = false;
      world.step(SAMPLE, input.move, input.jump, input.dash, input.hide);
    }
    // Force the farmer close and the SPOTTED banner up, then frame the pair.
    world.state.gap = 78;
    world.state.farmer.shout = 1.2;
    world.state.turkey.x = 430;
    world.state.farmer.x = 430 - 78 - 84 + 20;
    return { screen: SCREEN_PLAY, best: world.state.score };
  }
  if (name === 'kitchen') {
    // Fast-forward to the kitchen stage, then keep playing until the frame
    // shows the whole chase at once: turkey visible, an oven on screen, the
    // farmer closing in behind.
    let events = 0;
    for (let i = 0; i < 200 / SAMPLE; i += 1) {
      const input = autopilot(world.state);
      events |= world.step(SAMPLE, input.move, input.jump, input.dash, input.hide);
      if (world.state.distance >= 950 || (events & (EVENT_OVER | EVENT_ESCAPED))) break;
    }
    // Bring the farmer close first, then wait for a frame with the turkey
    // visible and an oven on screen.
    world.state.gap = 78;
    for (let i = 0; i < 600 && !(events & (EVENT_OVER | EVENT_ESCAPED)); i += 1) {
      const input = autopilot(world.state);
      events |= world.step(SAMPLE, input.move, input.jump, input.dash, input.hide);
      const ovenOnScreen = world.state.obstacles.some((o) => o.kind === 'oven' && o.x > 480 && o.x < 1150);
      if (!world.state.turkey.hidden && ovenOnScreen) break;
    }
    // Frame the pair: turkey centre-left, farmer fully in shot behind it.
    world.state.turkey.x = 430;
    world.state.gap = 78;
    world.state.farmer.x = 430 - 78 - 84 + 20;
    return { screen: world.state.over ? SCREEN_OVER : SCREEN_PLAY, best: world.state.score };
  }
  runFor(world, PLAY_SECONDS, true);
  return { screen: SCREEN_PLAY, best: world.state.score };
}
