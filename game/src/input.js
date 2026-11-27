// Keyboard and mouse input. Arrow keys / WASD move, Space jumps, Shift dashes,
// Down/S hides in a haystack, Enter confirms, P pauses, M mutes, R restarts.
export const ACTION_CONFIRM = 'confirm';
export const ACTION_PAUSE = 'pause';
export const ACTION_RESTART = 'restart';
export const ACTION_MUTE = 'mute';

const KEY_ACTIONS = {
  Enter: ACTION_CONFIRM, Space: ACTION_CONFIRM,
  KeyP: ACTION_PAUSE, Escape: ACTION_PAUSE,
  KeyR: ACTION_RESTART, KeyM: ACTION_MUTE,
};

export function createInput(canvas) {
  const held = new Set();
  const pressed = new Set();
  let mouse = { x: 0, y: 0, clicked: false };

  function codeOf(event) {
    return event.code || event.key;
  }

  window.addEventListener('keydown', (event) => {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) event.preventDefault();
    if (!event.repeat) {
      held.add(event.code);
      pressed.add(event.code);
      const action = KEY_ACTIONS[event.code];
      if (action) pressed.add(`action:${action}`);
    }
  });
  window.addEventListener('keyup', (event) => held.delete(event.code));
  window.addEventListener('blur', () => held.clear());
  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    mouse = { x: event.clientX - rect.left, y: event.clientY - rect.top, clicked: true };
  });

  return {
    axis() {
      let value = 0;
      if (held.has('ArrowLeft') || held.has('KeyA')) value -= 1;
      if (held.has('ArrowRight') || held.has('KeyD')) value += 1;
      return value;
    },
    jumpHeld() { return held.has('ArrowUp') || held.has('KeyW'); },
    dashHeld() { return held.has('ShiftLeft') || held.has('ShiftRight'); },
    hideHeld() { return held.has('ArrowDown') || held.has('KeyS'); },
    takeAction(action) {
      const key = `action:${action}`;
      if (pressed.has(key)) { pressed.delete(key); return true; }
      return false;
    },
    takeKey(code) {
      if (pressed.has(code)) { pressed.delete(code); return true; }
      return false;
    },
    takeClick() {
      const click = mouse.clicked ? { x: mouse.x, y: mouse.y } : null;
      mouse.clicked = false;
      return click;
    },
    endFrame() { pressed.clear(); },
  };
}
