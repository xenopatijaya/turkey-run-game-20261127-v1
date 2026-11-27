// Tuning and constants for Turkey Escape: one place holds every number that
// decides how the chase feels, so balancing never means hunting through logic.
export const VIEW = { width: 1280, height: 720 };
export const GROUND_Y = 620;
export const STEP = 1 / 60;
export const BEST_KEY = 'turkey-escape-best';

// The run: three stages, farmyard to kitchen, then the forest gate.
export const STAGES = [
  { name: 'FARMYARD', from: 0, to: 400, speed: 250, spawn: 1.3, label: 'Stage 1 — Farmyard' },
  { name: 'BARN', from: 400, to: 900, speed: 300, spawn: 1.1, label: 'Stage 2 — The Barn' },
  { name: 'KITCHEN', from: 900, to: 1400, speed: 350, spawn: 0.92, label: 'Stage 3 — The Kitchen' },
];
export const ESCAPE_DISTANCE = 1400;

export const TURKEY = {
  x: 340, width: 74, height: 64,
  gravity: 2600, jumpSpeed: 1000, moveSpeed: 320,
  minX: 90, maxX: 900,
};
export const FARMER = {
  width: 84, height: 132, catchGap: 46,
  baseSpeed: 236, searchSpeed: 150, cornerSpeed: 330,
};
export const RUN = {
  lives: 3, startGap: 260, maxGap: 420,
  dashCost: 34, dashGain: 150, dashSpeed: 520,
  hideSeconds: 2.2, hideGain: 120,
  cornScore: 50, pieScore: 150, meterScore: 1,
};
