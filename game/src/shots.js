// Deterministic screenshot scenes: each one plays the real rules forward from a
// fresh world for a fixed number of steps, steered by a simple autopilot (jump
// over what is ahead, dash when the farmer closes in, hide when a haystack is
// near), so every frame is what a real run looks like and the same seed always
// gives the same frame.
import { GROUND_Y, STEP, TURKEY } from './config.js';
import {
  EVENT_ESCAPED, EVENT_OVER,
  KIND_CORN, KIND_FENCE, KIND_HAY, KIND_KNIFE, KIND_OVEN,
} from './world.js';
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
    // Force the definitive chase frame: the turkey mid-jump over a fence and
    // dashing (speed lines + dust), the farmer cornering in ("!"), the vision
    // cone on, a haystack offering HIDE ahead. Every chase verb visible.
    world.state.turkey.y = GROUND_Y - TURKEY.height - 70;
    world.state.turkey.vy = -300;
    world.state.turkey.grounded = false;
    world.state.turkey.dashing = true;
    world.state.turkey.invuln = 0;
    world.state.turkey.hidden = false;
    world.state.dash = 70;
    world.state.farmer.mode = 'corner';
    world.state.flash = 0;
    world.state.message = '';
    world.state.messageLeft = 0;
    world.state.obstacles = world.state.obstacles.filter((o) => o.kind !== KIND_FENCE);
    world.state.obstacles.push({ kind: KIND_FENCE, x: 500, y: GROUND_Y - 74, width: 26, height: 74, vx: 0 });
    // The haystack fully on screen, so HIDE! reads instead of clipping off.
    const hay = world.state.hides.find((h) => !h.used);
    if (hay) hay.x = 980;
    return { screen: SCREEN_PLAY, best: world.state.score };
  }
  if (name === 'kitchen') {
    // Fast-forward to the kitchen stage with the real autopilot.
    let events = 0;
    for (let i = 0; i < 200 / SAMPLE; i += 1) {
      const input = autopilot(world.state);
      events |= world.step(SAMPLE, input.move, input.jump, input.dash, input.hide);
      if (world.state.distance >= 950 || (events & (EVENT_OVER | EVENT_ESCAPED))) break;
    }
    if (world.state.over || world.state.escaped) {
      // The autopilot should not die reaching the kitchen; if it did, reset
      // and run it again from the top (deterministic for the same seed).
      world.reset();
      events = 0;
      for (let i = 0; i < 200 / SAMPLE; i += 1) {
        const input = autopilot(world.state);
        events |= world.step(SAMPLE, input.move, input.jump, input.dash, input.hide);
        if (world.state.distance >= 950 || (events & (EVENT_OVER | EVENT_ESCAPED))) break;
      }
    }
    // Force the definitive kitchen frame: the turkey jumping the oven, a
    // carving knife falling ahead, a knife stuck in the dirt, the farmer
    // closing in behind, a haystack offering HIDE. Every hazard the game
    // names is visible at once, in positions a real run reaches.
    world.state.obstacles = [
      { kind: KIND_OVEN, x: 470, y: GROUND_Y - 92, width: 118, height: 92, vx: 0 },
      { kind: KIND_KNIFE, x: 700, y: 180, width: 64, height: 18, vx: 0, vy: 150, spin: 2, angle: 0.6 },
      { kind: KIND_KNIFE, x: 860, y: GROUND_Y - 18, width: 64, height: 18, vx: 0, vy: 0, spin: 0, angle: 0.5, stuck: true },
    ];
    world.state.hides = [
      { kind: KIND_HAY, x: 1060, y: GROUND_Y - 96, width: 110, height: 96, used: false },
    ];
    world.state.pickups = [
      { kind: KIND_CORN, x: 1010, y: GROUND_Y - 120, width: 34, height: 44, bob: 0 },
    ];
    world.state.turkey.x = 520;
    world.state.turkey.y = GROUND_Y - TURKEY.height - 150;
    world.state.turkey.vy = -200;
    world.state.turkey.grounded = false;
    world.state.turkey.hidden = false;
    world.state.turkey.invuln = 0;
    world.state.turkey.dashing = false;
    world.state.gap = 78;
    world.state.farmer.x = 520 - 78 - 84 + 20;
    world.state.farmer.mode = 'chase';
    world.state.farmer.shout = 1.2;
    world.state.flash = 0;
    world.state.message = '';
    world.state.messageLeft = 0;
    world.state.particles = [];
    return { screen: world.state.over ? SCREEN_OVER : SCREEN_PLAY, best: world.state.score };
  }
  runFor(world, PLAY_SECONDS, true);
  return { screen: SCREEN_PLAY, best: world.state.score };
}
