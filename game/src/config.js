// Tom's Great Escape — tuning numbers and colours in one place.
// A side-scrolling farmyard runner: the turkey auto-runs right, the world
// scrolls left. The playfield is a fixed 1280x720 logical area; the
// renderer scales it to the window, so no rule depends on screen size.

export const FIELD = { width: 1280, height: 720, groundY: 606 };

/** The simulation's fixed step, in seconds: 60 updates a second. */
export const STEP = 1 / 60;

/** Metres of farmyard to cross before the forest gate: reaching it wins. */
export const GOAL_METERS = 1200;

/** Pixels of scrolling per metre of distance. */
export const PX_PER_METER = 25;

export const PLAYER = {
  x: 230,
  width: 64,
  height: 64,
  slideHeight: 34,
  jumpVel: 1000,
  doubleJumpVel: 880,
  gravity: 2600,
  slideTime: 0.55,
  invulnerable: 1.4,
};

export const RUN = {
  baseSpeed: 400,
  speedPerLevel: 45,
  maxSpeed: 700,
  levelMeters: 150,
  maxLevel: 10,
};

export const LIVES = 3;

/** Seconds between obstacle spawns; shrinks as the level rises. */
export const SPAWN = {
  baseGap: 1.25,
  gapScale: 0.94,
  minGap: 0.7,
  jitter: 0.45,
};

/** Corn is worth 10, a golden feather 50 (and a life back when hurt). */
export const CORN = { points: 10, size: 26 };
export const FEATHER = { points: 50 };

/** How far behind the turkey the farmer starts, in pixels; a hit pulls him in. */
export const FARMER = { startGap: 260, hitPull: 70, recoverPerSecond: 8 };

/** How many obstacles and pickups can exist at once; pools allocated at boot. */
export const POOL_SIZE = 48;

export const PALETTE = {
  backdrop: '#1c1030',
  skyTop: '#2b1b4d',
  skyMid: '#b5506e',
  skyLow: '#ff9a56',
  sun: '#ffd97a',
  sunGlow: '#ffcf5e',
  hillFar: '#5d3a6e',
  hillNear: '#43305c',
  barn: '#3a2447',
  ground: '#6b4a2f',
  groundTop: '#7d5a38',
  grass: '#4d7a3a',
  grassDark: '#3c6330',
  fence: '#8a6a44',
  turkeyBody: '#8a5230',
  turkeyDark: '#6e3f22',
  turkeyLight: '#b07a45',
  tail: ['#a0522d', '#d2691e', '#e8a33c', '#c96a3b', '#8a4a2a'],
  head: '#e8e0d0',
  beak: '#e8912d',
  wattle: '#e5534b',
  leg: '#e8912d',
  farmerShirt: '#b03a2e',
  farmerOveralls: '#3a5a8a',
  farmerSkin: '#e8b98a',
  farmerHat: '#d9b64a',
  knife: '#c9ced6',
  knifeHandle: '#5a3a22',
  hay: '#d9a441',
  hayDark: '#b5822e',
  pumpkin: '#e86a1e',
  pumpkinDark: '#b34d12',
  oven: '#4a4a52',
  ovenFire: '#ff7a2d',
  ovenGlow: '#ffb03a',
  corn: '#f2c94c',
  cornHusk: '#5d8a3a',
  featherGold: '#ffd94a',
  panel: 'rgba(24, 16, 40, 0.92)',
  panelEdge: '#e8a33c',
  text: '#f7ead2',
  muted: '#c9a98a',
  danger: '#ff5a4a',
  good: '#8ae08a',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'toms-great-escape.best';
export const MUTE_KEY = 'toms-great-escape.muted';
