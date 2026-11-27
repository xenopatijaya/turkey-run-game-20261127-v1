// The world: the turkey, the chasing farmer, the hazards, the pickups and the
// three stages from farmyard to kitchen. Pure logic — drawing lives in render.js.
import { ESCAPE_DISTANCE, FARMER, GROUND_Y, RUN, STAGES, TURKEY, VIEW } from './config.js';

export const EVENT_HIT = 1;
export const EVENT_OVER = 2;
export const EVENT_ESCAPED = 4;
export const EVENT_STAGE = 8;
export const EVENT_SPOTTED = 16;
export const EVENT_CAUGHT = 32;
export const EVENT_PICKUP = 64;
export const EVENT_HIDE = 128;

export const KIND_KNIFE = 'knife';
export const KIND_OVEN = 'oven';
export const KIND_FENCE = 'fence';
export const KIND_PUMPKIN = 'pumpkin';
export const KIND_CORN = 'corn';
export const KIND_PIE = 'pie';
export const KIND_HAY = 'hay';

function stageFor(distance) {
  for (let i = STAGES.length - 1; i >= 0; i -= 1) {
    if (distance >= STAGES[i].from) return { index: i, ...STAGES[i] };
  }
  return { index: 0, ...STAGES[0] };
}

export function createWorld(random) {
  const state = freshState();

  function freshState() {
    return {
      distance: 0, score: 0, lives: RUN.lives, gap: RUN.startGap, dash: 100,
      turkey: { x: TURKEY.x, y: GROUND_Y - TURKEY.height, vy: 0, grounded: true, hidden: false, hideLeft: 0, dashing: false, runPhase: 0, invuln: 0 },
      farmer: { x: TURKEY.x - RUN.startGap, y: GROUND_Y - FARMER.height, mode: 'chase', phase: 0, shout: 0 },
      obstacles: [], pickups: [], hides: [], particles: [],
      spawnIn: 0.9, elapsed: 0, stageIndex: 0, over: false, escaped: false,
      caught: false, flash: 0, message: '', messageLeft: 0, nearMiss: 0,
      cornEaten: 0, jumps: 0,
    };
  }

  function reset() {
    Object.assign(state, freshState());
  }

  function burst(x, y, color, count) {
    for (let i = 0; i < count; i += 1) {
      state.particles.push({
        x, y, vx: random.range(-160, 160), vy: random.range(-260, 40),
        life: random.range(0.35, 0.7), max: 0.7, color, size: random.range(3, 7),
      });
    }
  }

  function spawnPattern(stage) {
    const roll = random.next();
    const x = VIEW.width + 60;
    if (stage.index === 2 && roll < 0.34) {
      // Kitchen: the oven blocks the floor, a knife sails over it.
      state.obstacles.push({ kind: KIND_OVEN, x, y: GROUND_Y - 92, width: 118, height: 92, vx: 0 });
      state.obstacles.push({ kind: KIND_KNIFE, x: x + 190, y: 210, width: 64, height: 18, vx: -90, vy: 150, spin: random.range(-4, 4), angle: 0 });
      return;
    }
    if (roll < 0.16) {
      state.obstacles.push({ kind: KIND_KNIFE, x, y: random.range(120, 260), width: 64, height: 18, vx: random.range(-60, 60), vy: random.range(100, 170), spin: random.range(-5, 5), angle: 0 });
    } else if (roll < 0.48) {
      state.obstacles.push({ kind: KIND_FENCE, x, y: GROUND_Y - 74, width: 26, height: 74, vx: 0 });
      if (random.next() < 0.5) state.pickups.push({ kind: KIND_CORN, x: x + 70, y: GROUND_Y - 150, width: 34, height: 44, bob: random.range(0, 6) });
    } else if (roll < 0.72) {
      state.obstacles.push({ kind: KIND_PUMPKIN, x, y: GROUND_Y - 52, width: 62, height: 52, vx: 0 });
      state.pickups.push({ kind: KIND_CORN, x: x + 40, y: GROUND_Y - 190, width: 34, height: 44, bob: random.range(0, 6) });
    } else if (roll < 0.88) {
      state.hides.push({ kind: KIND_HAY, x, y: GROUND_Y - 96, width: 110, height: 96, used: false });
      state.pickups.push({ kind: KIND_CORN, x: x + 130, y: GROUND_Y - 60, width: 34, height: 44, bob: 0 });
    } else {
      state.pickups.push({ kind: KIND_CORN, x, y: GROUND_Y - 120, width: 34, height: 44, bob: random.range(0, 6) });
      state.pickups.push({ kind: KIND_CORN, x: x + 64, y: GROUND_Y - 120, width: 34, height: 44, bob: random.range(0, 6) });
      if (random.next() < 0.4) state.pickups.push({ kind: KIND_PIE, x: x + 128, y: GROUND_Y - 120, width: 40, height: 36, bob: 0 });
    }
  }

  function overlap(a, b, shrink = 0) {
    return a.x + shrink < b.x + b.width && a.x + a.width - shrink > b.x
      && a.y + shrink < b.y + b.height && a.y + a.height - shrink > b.y;
  }

  // Advance the world one fixed step. `move` is -1/0/1, `jump`, `dash`, `hide`
  // are booleans. Returns a bitmask of events for the frame.
  function step(dt, move, jump, dash, hide) {
    if (state.over || state.escaped) return 0;
    let events = 0;
    const stage = stageFor(state.distance);
    if (stage.index !== state.stageIndex) {
      state.stageIndex = stage.index;
      state.message = stage.label;
      state.messageLeft = 2.2;
      events |= EVENT_STAGE;
    }
    state.elapsed += dt;
    if (state.messageLeft > 0) state.messageLeft -= dt;
    if (state.flash > 0) state.flash -= dt;
    if (state.turkey.invuln > 0) state.turkey.invuln -= dt;

    const turkey = state.turkey;
    const farmer = state.farmer;

    // --- Turkey movement ---
    turkey.dashing = dash && state.dash > 0 && !turkey.hidden;
    const speed = turkey.dashing ? TURKEY.moveSpeed + 260 : TURKEY.moveSpeed;
    turkey.x = Math.min(TURKEY.maxX, Math.max(TURKEY.minX, turkey.x + move * speed * dt));
    if (jump && turkey.grounded && !turkey.hidden) {
      turkey.vy = -TURKEY.jumpSpeed;
      turkey.grounded = false;
      state.jumps += 1;
    }
    turkey.vy += TURKEY.gravity * dt;
    turkey.y += turkey.vy * dt;
    if (turkey.y >= GROUND_Y - TURKEY.height) {
      turkey.y = GROUND_Y - TURKEY.height;
      turkey.vy = 0;
      turkey.grounded = true;
    }
    turkey.runPhase += dt * (turkey.grounded ? 11 : 4);

    // --- Hiding in a haystack ---
    let nearHay = null;
    for (const hay of state.hides) {
      if (!hay.used && Math.abs((hay.x + hay.width / 2) - (turkey.x + TURKEY.width / 2)) < 90 && turkey.grounded) nearHay = hay;
    }
    if (hide && nearHay && !turkey.hidden) {
      turkey.hidden = true;
      turkey.hideLeft = RUN.hideSeconds;
      nearHay.used = true;
      state.gap = Math.min(RUN.maxGap, state.gap + RUN.hideGain);
      burst(turkey.x + 30, turkey.y + 20, '#d9a441', 14);
      events |= EVENT_HIDE;
    }
    if (turkey.hidden) {
      turkey.hideLeft -= dt;
      farmer.mode = 'search';
      if (turkey.hideLeft <= 0) turkey.hidden = false;
    } else if (state.gap < 120) {
      farmer.mode = 'corner';
    } else {
      farmer.mode = 'chase';
    }

    // --- Dash meter and the gap to the farmer ---
    if (turkey.dashing) state.dash = Math.max(0, state.dash - RUN.dashCost * dt);
    else state.dash = Math.min(100, state.dash + 14 * dt);
    const worldSpeed = stage.speed + (turkey.dashing ? 170 : 0);
    // The farmer's pace grows with the stage; the gap opens when the turkey
    // outruns him (dashing, corn) and closes when it dawdles or gets hit.
    const farmerBase = 248 + stage.index * 47;
    const farmerSpeed = farmer.mode === 'search' ? farmerBase * 0.6
      : farmer.mode === 'corner' ? farmerBase + 95 : farmerBase;
    state.gap += (worldSpeed * 0.94 - farmerSpeed) * dt * 0.55;
    if (turkey.hidden) state.gap += 26 * dt;
    state.gap = Math.min(RUN.maxGap, Math.max(0, state.gap));
    farmer.x = turkey.x - state.gap - FARMER.width + 20;
    farmer.phase += dt * 9;
    if (farmer.shout > 0) farmer.shout -= dt;

    // The farmer spots the turkey again after a hide, or closes in fast.
    if (state.gap < 130 && farmer.shout <= 0 && !turkey.hidden) {
      farmer.shout = 1.4;
      events |= EVENT_SPOTTED;
    }

    // --- Distance, score, spawning ---
    state.distance += (worldSpeed * dt) / 14;
    state.score += worldSpeed * dt * RUN.meterScore * 0.12;
    state.spawnIn -= dt;
    if (state.spawnIn <= 0) {
      spawnPattern(stage);
      state.spawnIn = stage.spawn * random.range(0.85, 1.2);
    }

    // --- Move hazards and pickups with the world ---
    const scroll = worldSpeed * dt;
    for (const item of state.obstacles) {
      item.x -= scroll + (item.vx || 0) * dt;
      if (item.kind === KIND_KNIFE) {
        item.y += (item.vy || 0) * dt;
        item.angle += (item.spin || 0) * dt;
        // A knife that hits the dirt sticks there, harmless, and is left behind.
        if (item.y + item.height >= GROUND_Y) {
          item.y = GROUND_Y - item.height;
          item.vy = 0;
          item.stuck = true;
        }
      }
    }
    for (const item of state.pickups) {
      item.x -= scroll;
      item.bob += dt * 4;
    }
    for (const item of state.hides) item.x -= scroll;
    state.obstacles = state.obstacles.filter((o) => o.x > -220 && o.y < VIEW.height + 40);
    state.pickups = state.pickups.filter((p) => p.x > -80);
    state.hides = state.hides.filter((h) => h.x > -160);

    // --- Pickups ---
    const turkeyBox = { x: turkey.x + 6, y: turkey.y + 4, width: TURKEY.width - 12, height: TURKEY.height - 8 };
    for (const item of state.pickups) {
      const box = { x: item.x, y: item.y + Math.sin(item.bob) * 5, width: item.width, height: item.height };
      if (overlap(turkeyBox, box)) {
        item.taken = true;
        if (item.kind === KIND_CORN) {
          state.score += RUN.cornScore;
          state.cornEaten += 1;
          state.gap = Math.min(RUN.maxGap, state.gap + 12);
        } else {
          state.score += RUN.pieScore;
          state.lives = Math.min(3, state.lives + 1);
        }
        burst(box.x + 17, box.y + 20, item.kind === KIND_CORN ? '#f2c230' : '#e2725b', 10);
        events |= EVENT_PICKUP;
      }
    }
    state.pickups = state.pickups.filter((p) => !p.taken);

    // --- Hazard hits (not while hidden, not during the brief grace after a hit) ---
    if (!turkey.hidden && turkey.invuln <= 0) {
      for (const item of state.obstacles) {
        if (item.stuck) continue; // a knife stuck in the dirt cannot hurt anyone
        const shrink = item.kind === KIND_OVEN ? 14 : 8;
        const box = { x: item.x, y: item.y, width: item.width, height: item.height };
        if (overlap(turkeyBox, box, shrink)) {
          item.hit = true;
          state.lives -= 1;
          turkey.invuln = 1.2;
          state.gap = Math.max(0, state.gap - 70);
          state.flash = 0.35;
          burst(turkey.x + 37, turkey.y + 30, '#ff5a3c', 18);
          events |= EVENT_HIT;
          if (state.lives <= 0) {
            state.over = true;
            state.caught = state.gap <= 10;
            events |= EVENT_OVER;
            if (state.caught) events |= EVENT_CAUGHT;
          }
          break;
        }
      }
    }
    state.obstacles = state.obstacles.filter((o) => !o.hit);

    // --- Caught by the farmer ---
    if (state.gap <= 0 && !state.over) {
      state.over = true;
      state.caught = true;
      events |= EVENT_OVER | EVENT_CAUGHT;
    }

    // --- Escaped! Reached the forest gate. ---
    if (state.distance >= ESCAPE_DISTANCE && !state.over) {
      state.escaped = true;
      events |= EVENT_ESCAPED;
    }

    // --- Particles ---
    for (const p of state.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 500 * dt;
    }
    state.particles = state.particles.filter((p) => p.life > 0);

    return events;
  }

  return { state, reset, step, stageFor };
}
