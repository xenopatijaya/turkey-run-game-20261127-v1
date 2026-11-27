// Boot and the one loop: input is read every frame, the world advances in fixed
// 1/60 s steps, and the renderer paints what is there. Screens: title, play,
// paused, caught and escaped. ?seed=N fixes the run. ?shot=title|play|chase|
// escaped|caught (with &seed=N) stages that scene instead of running the loop,
// paints it twice and sets window.__shotReady for a screenshot.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createAudio } from './audio.js';
import { createWorld, EVENT_CAUGHT, EVENT_ESCAPED, EVENT_HIDE, EVENT_HIT, EVENT_OVER, EVENT_PICKUP, EVENT_SPOTTED, EVENT_STAGE } from './world.js';
import { ACTION_CONFIRM, ACTION_MUTE, ACTION_PAUSE, ACTION_RESTART, createInput } from './input.js';
import { createRenderer, SCREEN_ESCAPED, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall is dropped. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const audio = createAudio();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off: the best score then lasts this visit only.
  }
}

function announce(message) {
  status.textContent = message;
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best, performance.now() / 1000);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  let time = 0;

  function startRun() {
    world.reset();
    screen = SCREEN_PLAY;
    audio.unlock();
    audio.play('gobble');
    audio.startMusic();
    announce('Run! Outrun the farmer and reach the forest gate.');
  }

  function endRun(escaped) {
    audio.stopMusic();
    if (escaped) audio.play('escaped');
    else audio.play('caught');
    screen = escaped ? SCREEN_ESCAPED : SCREEN_OVER;
    if (world.state.score > best) {
      best = Math.floor(world.state.score);
      saveBest(best);
    }
    announce(escaped ? `Escaped! Score ${world.state.score}.` : `Caught! Score ${world.state.score}. Press R to run again.`);
  }

  function handleEvents(events) {
    if (events & EVENT_HIT) audio.play('hit');
    if (events & EVENT_PICKUP) audio.play('corn');
    if (events & EVENT_SPOTTED) audio.play('spotted');
    if (events & EVENT_HIDE) audio.play('hide');
    if (events & EVENT_STAGE) audio.play('stage');
    if (events & EVENT_OVER) endRun(false);
    else if (events & EVENT_ESCAPED) endRun(true);
  }

  function frame(now) {    const delta = Math.min(MAX_FRAME, (now - last) / 1000);
    last = now;
    time += delta;

    if (input.takeAction(ACTION_MUTE)) {
      const muted = audio.toggleMute();
      announce(muted ? 'Sound off.' : 'Sound on.');
    }
    const click = input.takeClick();

    if (screen === SCREEN_TITLE) {
      if (input.takeAction(ACTION_CONFIRM) || click) startRun();
    } else if (screen === SCREEN_PLAY) {
      if (input.takeAction(ACTION_PAUSE) || (click && click.y < 60)) {
        screen = SCREEN_PAUSED;
        audio.stopMusic();
        announce('Paused.');
      } else {
        accumulator += delta;
        let guard = 0;
        while (accumulator >= STEP && guard < 8) {
          const jump = input.takeKey('Space') || input.takeKey('ArrowUp') || input.takeKey('KeyW');
          const events = world.step(
            STEP,
            input.axis(),
            jump,
            input.dashHeld(),
            input.hideHeld(),
          );
          handleEvents(events);
          accumulator -= STEP;
          guard += 1;
          if (screen !== SCREEN_PLAY) break;
        }
      }
    } else if (screen === SCREEN_PAUSED) {
      if (input.takeAction(ACTION_PAUSE) || click) {
        screen = SCREEN_PLAY;
        audio.startMusic();
      }
    } else {
      if (input.takeAction(ACTION_RESTART) || input.takeAction(ACTION_CONFIRM) || click) startRun();
    }

    renderer.draw(world.state, screen, best, time);
    input.endFrame();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// Debug hook for automated playtests (read-only state, no gameplay effect).
window.__turkeyState = () => ({
  score: world.state.score,
  distance: Math.floor(world.state.distance),
  lives: world.state.lives,
  gap: Math.round(world.state.gap),
  stage: world.state.stageIndex,
  over: world.state.over,
  escaped: world.state.escaped,
  caught: world.state.caught,
});

if (shot) runShot(shot);
else runGame();
