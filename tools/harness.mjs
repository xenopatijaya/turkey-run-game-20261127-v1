// harness.mjs — headless playtest of the world logic (no DOM, no canvas):
// autopilot escape rate over 10 seeds, hide usage, and determinism of the
// staged scenes. Usage: node tools/harness.mjs
import { STEP } from '../game/src/config.js';
import { createRandom } from '../game/src/random.js';
import { createWorld, EVENT_ESCAPED, EVENT_HIDE, EVENT_OVER } from '../game/src/world.js';
import { autopilot, stageShot } from '../game/src/shots.js';

function snapshot(state) {
  return JSON.stringify({
    d: Math.round(state.distance), s: Math.round(state.score), l: state.lives,
    g: Math.round(state.gap), st: state.stageIndex, ov: state.over, es: state.escaped,
    tx: Math.round(state.turkey.x), ty: Math.round(state.turkey.y),
    fx: Math.round(state.farmer.x), fm: state.farmer.mode,
    ob: state.obstacles.map((o) => [o.kind, Math.round(o.x), Math.round(o.y)]),
    pk: state.pickups.map((p) => [p.kind, Math.round(p.x), Math.round(p.y)]),
    hy: state.hides.map((h) => [Math.round(h.x), h.used]),
  });
}

let escapes = 0;
let seedsWithHide = 0;
for (let seed = 1; seed <= 10; seed += 1) {
  const world = createWorld(createRandom(seed));
  let hideCount = 0;
  let events = 0;
  for (let i = 0; i < 200 / STEP; i += 1) {
    const input = autopilot(world.state);
    events |= world.step(STEP, input.move, input.jump, input.dash, input.hide);
    if (events & EVENT_HIDE) { hideCount += 1; events &= ~EVENT_HIDE; }
    if (events & (EVENT_OVER | EVENT_ESCAPED)) break;
  }
  const s = world.state;
  if (s.escaped) escapes += 1;
  if (hideCount > 0) seedsWithHide += 1;
  console.log(`seed ${seed}: escaped=${s.escaped} over=${s.over} score=${Math.round(s.score)} dist=${Math.round(s.distance)} lives=${s.lives} hides=${hideCount}`);
}
console.log(`escapes: ${escapes}/10, seeds with >=1 hide: ${seedsWithHide}/10`);

// Determinism: same seed + scene twice must give the same state snapshot.
for (const scene of ['title', 'chase', 'kitchen', 'escaped']) {
  const a = createWorld(createRandom(7));
  stageShot(scene, a);
  const snapA = snapshot(a.state);
  const b = createWorld(createRandom(7));
  stageShot(scene, b);
  const snapB = snapshot(b.state);
  console.log(`scene ${scene}: deterministic=${snapA === snapB}`);
  if (snapA !== snapB) {
    console.log('  A:', snapA.slice(0, 300));
    console.log('  B:', snapB.slice(0, 300));
  }
}
if (escapes < 10) { console.error('FAIL: not all seeds escaped'); process.exit(1); }
console.log('HARNESS OK');
