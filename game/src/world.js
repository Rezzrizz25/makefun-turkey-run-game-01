// The game's rules and state, with no drawing and no browser in it: the
// turkey's run physics, the scrolling farmyard, obstacle and pickup
// spawning, the farmer closing in, score, distance, lives and level.
// step() advances one fixed step and returns what happened as bit flags,
// so the caller can react (and play sounds) without the world knowing
// about screens or audio. Nothing here allocates after createWorld returns.

import {
  CORN,
  FARMER,
  FEATHER,
  FIELD,
  GOAL_METERS,
  LIVES,
  PLAYER,
  POOL_SIZE,
  PX_PER_METER,
  RUN,
  SPAWN,
} from './config.js';

export const KIND_FENCE = 0;
export const KIND_HAY = 1;
export const KIND_PUMPKIN = 2;
export const KIND_BRANCH = 3;
export const KIND_OVEN = 4;
export const KIND_KNIFE = 5;
export const KIND_CORN = 6;
export const KIND_FEATHER = 7;

export const EVENT_HIT = 1;
export const EVENT_PICKUP = 2;
export const EVENT_FEATHER = 4;
export const EVENT_WIN = 8;
export const EVENT_OVER = 16;
export const EVENT_JUMP = 32;

const GROUND = FIELD.groundY;

/** Forgiving hitboxes: shave a few pixels off each side of both boxes. */
function overlaps(ax, ay, aw, ah, bx, by, bw, bh, shrink) {
  return (
    ax + shrink < bx + bw - shrink &&
    ax + aw - shrink > bx + shrink &&
    ay + shrink < by + bh - shrink &&
    ay + ah - shrink > by + shrink
  );
}

export function createWorld(random) {
  const player = {
    x: PLAYER.x,
    y: GROUND - PLAYER.height,
    width: PLAYER.width,
    height: PLAYER.height,
    vy: 0,
    grounded: true,
    jumps: 0,
    sliding: false,
    slideTimer: 0,
    invulnerable: 0,
    runPhase: 0,
  };
  const obstacles = [];
  const pickups = [];
  const particles = [];
  for (let index = 0; index < POOL_SIZE; index += 1) {
    obstacles.push({ active: false, kind: KIND_FENCE, x: 0, y: 0, width: 0, height: 0 });
    pickups.push({ active: false, kind: KIND_CORN, x: 0, y: 0, width: 0, height: 0, bob: 0 });
  }
  for (let index = 0; index < 24; index += 1) {
    particles.push({ active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1, size: 3, kind: 0 });
  }
  const state = {
    player,
    obstacles,
    pickups,
    particles,
    score: 0,
    distance: 0,
    lives: LIVES,
    level: 1,
    speed: RUN.baseSpeed,
    farmerGap: FARMER.startGap,
    elapsed: 0,
    scrollX: 0,
    spawnTimer: SPAWN.baseGap,
    cornTimer: 2.2,
    featherTimer: 14,
    won: false,
    over: false,
    shake: 0,
  };

  function reset() {
    player.y = GROUND - PLAYER.height;
    player.vy = 0;
    player.grounded = true;
    player.jumps = 0;
    player.sliding = false;
    player.slideTimer = 0;
    player.invulnerable = 0;
    player.runPhase = 0;
    for (const item of obstacles) item.active = false;
    for (const item of pickups) item.active = false;
    for (const item of particles) item.active = false;
    state.score = 0;
    state.distance = 0;
    state.lives = LIVES;
    state.level = 1;
    state.speed = RUN.baseSpeed;
    state.farmerGap = FARMER.startGap;
    state.elapsed = 0;
    state.scrollX = 0;
    state.spawnTimer = SPAWN.baseGap;
    state.cornTimer = 2.2;
    state.featherTimer = 14;
    state.won = false;
    state.over = false;
    state.shake = 0;
  }

  function freeObstacle() {
    for (let index = 0; index < obstacles.length; index += 1) {
      if (!obstacles[index].active) return obstacles[index];
    }
    return null;
  }

  function freePickup() {
    for (let index = 0; index < pickups.length; index += 1) {
      if (!pickups[index].active) return pickups[index];
    }
    return null;
  }

  function freeParticle() {
    for (let index = 0; index < particles.length; index += 1) {
      if (!particles[index].active) return particles[index];
    }
    return null;
  }

  function burst(x, y, count, kind) {
    for (let index = 0; index < count; index += 1) {
      const part = freeParticle();
      if (part === null) return;
      part.active = true;
      part.x = x;
      part.y = y;
      part.vx = (random() - 0.5) * 320;
      part.vy = -random() * 260 - 40;
      part.life = 0;
      part.maxLife = 0.5 + random() * 0.4;
      part.size = 3 + random() * 4;
      part.kind = kind;
    }
  }

  function spawnObstacle() {
    const item = freeObstacle();
    if (item === null) return;
    const roll = random();
    item.active = true;
    item.x = FIELD.width + 40;
    if (roll < 0.22) {
      item.kind = KIND_FENCE;
      item.width = 46;
      item.height = 62;
    } else if (roll < 0.42) {
      item.kind = KIND_HAY;
      item.width = 78;
      item.height = 96;
    } else if (roll < 0.58) {
      item.kind = KIND_PUMPKIN;
      item.width = 60;
      item.height = 44;
    } else if (roll < 0.74) {
      // A low branch: it hangs at head height, so slide under it.
      item.kind = KIND_BRANCH;
      item.width = 70;
      item.height = 70;
      item.y = GROUND - 100;
      return;
    } else if (roll < 0.88) {
      item.kind = KIND_OVEN;
      item.width = 130;
      item.height = 58;
    } else {
      // A carving knife stuck blade-up in the dirt.
      item.kind = KIND_KNIFE;
      item.width = 26;
      item.height = 78;
    }
    item.y = GROUND - item.height;
  }

  function spawnCornArc(overX, overWidth) {
    // Three cobs in an arc over an obstacle: worth the jump.
    for (let index = 0; index < 3; index += 1) {
      const cob = freePickup();
      if (cob === null) return;
      cob.active = true;
      cob.kind = KIND_CORN;
      cob.width = CORN.size;
      cob.height = CORN.size;
      cob.x = overX - 30 + index * 46;
      cob.y = GROUND - 150 - (index === 1 ? 34 : 0);
      cob.bob = random() * 6.28;
    }
  }

  function spawnCornLine() {
    for (let index = 0; index < 4; index += 1) {
      const cob = freePickup();
      if (cob === null) return;
      cob.active = true;
      cob.kind = KIND_CORN;
      cob.width = CORN.size;
      cob.height = CORN.size;
      cob.x = FIELD.width + 40 + index * 52;
      cob.y = GROUND - CORN.size - 4;
      cob.bob = random() * 6.28;
    }
  }

  function spawnFeather() {
    const item = freePickup();
    if (item === null) return;
    item.active = true;
    item.kind = KIND_FEATHER;
    item.width = 30;
    item.height = 30;
    item.x = FIELD.width + 40;
    // High up: only a double jump reaches it.
    item.y = GROUND - 268;
    item.bob = 0;
  }

  function spawnInterval() {
    return Math.max(
      SPAWN.minGap,
      SPAWN.baseGap * SPAWN.gapScale ** (state.level - 1) + (random() - 0.5) * SPAWN.jitter,
    );
  }

  function playerBox() {
    const height = player.sliding ? PLAYER.slideHeight : PLAYER.height;
    return { x: player.x + 8, y: player.y + (PLAYER.height - height), width: PLAYER.width - 16, height };
  }

  /**
   * One fixed step. `jump` is a one-shot press this step; `slideHeld` is
   * whether the slide key is down. With `harmless` set (the title screen's
   * backdrop) the turkey runs, things scroll, but nothing can hurt it and
   * nothing scores. Returns EVENT_* flags.
   */
  function step(dt, jump, slideHeld, harmless) {
    let events = 0;
    state.elapsed += dt;
    state.level = Math.min(RUN.maxLevel, 1 + Math.floor(state.distance / RUN.levelMeters));
    state.speed = Math.min(RUN.maxSpeed, RUN.baseSpeed + RUN.speedPerLevel * (state.level - 1));

    // --- the turkey -------------------------------------------------------
    if (jump && !harmless) {
      if (player.grounded) {
        player.vy = -PLAYER.jumpVel;
        player.grounded = false;
        player.jumps = 1;
        player.sliding = false;
        events |= EVENT_JUMP;
        burst(player.x + 20, GROUND - 4, 5, 0);
      } else if (player.jumps === 1) {
        player.vy = -PLAYER.doubleJumpVel;
        player.jumps = 2;
        events |= EVENT_JUMP;
        burst(player.x + 20, player.y + player.height, 6, 1);
      }
    }
    if (!player.grounded) {
      player.vy += PLAYER.gravity * dt;
      player.y += player.vy * dt;
      if (player.y >= GROUND - PLAYER.height) {
        player.y = GROUND - PLAYER.height;
        player.vy = 0;
        player.grounded = true;
        player.jumps = 0;
        burst(player.x + 20, GROUND - 4, 4, 0);
      }
    }
    if (slideHeld && player.grounded && !harmless) {
      if (!player.sliding) player.slideTimer = PLAYER.slideTime;
      player.sliding = true;
    }
    if (player.sliding) {
      player.slideTimer -= dt;
      if (player.slideTimer <= 0) {
        // Holding slide keeps the duck going: letting it lapse for one step
        // while a branch still overlaps the turkey would be a phantom hit.
        if (slideHeld && player.grounded) player.slideTimer = PLAYER.slideTime;
        else player.sliding = false;
      }
      if (!player.grounded) player.sliding = false;
    }
    if (player.grounded) player.runPhase += dt * (state.speed / 34);
    if (player.invulnerable > 0) player.invulnerable = Math.max(0, player.invulnerable - dt);
    if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 3);

    // --- the world scrolls --------------------------------------------------
    const dx = state.speed * dt;
    state.scrollX += dx;
    if (!harmless) {
      state.distance += dx / PX_PER_METER;
      state.score += dx / PX_PER_METER;
    }
    if (state.distance >= GOAL_METERS && !state.won) {
      state.won = true;
      events |= EVENT_WIN;
      return events;
    }

    // The farmer drops back while the turkey runs clean, lunges on a hit.
    if (!harmless && state.farmerGap < FARMER.startGap) {
      state.farmerGap = Math.min(FARMER.startGap, state.farmerGap + FARMER.recoverPerSecond * dt);
    }

    // --- spawning -----------------------------------------------------------
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      spawnObstacle();
      // A corn arc over the fresh obstacle, sometimes.
      if (random() < 0.45) spawnCornArc(FIELD.width + 40, 0);
      state.spawnTimer += spawnInterval();
    }
    state.cornTimer -= dt;
    if (state.cornTimer <= 0) {
      spawnCornLine();
      state.cornTimer += 3.4 + random() * 2.4;
    }
    state.featherTimer -= dt;
    if (state.featherTimer <= 0) {
      spawnFeather();
      state.featherTimer += 13 + random() * 8;
    }

    // --- move and collide ---------------------------------------------------
    const box = playerBox();
    for (let index = 0; index < obstacles.length; index += 1) {
      const item = obstacles[index];
      if (!item.active) continue;
      item.x -= dx;
      if (item.x + item.width < -60) {
        item.active = false;
        continue;
      }
      if (harmless || player.invulnerable > 0) continue;
      if (overlaps(box.x, box.y, box.width, box.height, item.x, item.y, item.width, item.height, 6)) {
        item.active = false;
        state.lives -= 1;
        player.invulnerable = PLAYER.invulnerable;
        state.farmerGap = Math.max(46, state.farmerGap - FARMER.hitPull);
        state.shake = 1;
        burst(player.x + 30, player.y + 20, 12, 1);
        events |= EVENT_HIT;
        if (state.lives <= 0) {
          state.over = true;
          events |= EVENT_OVER;
          return events;
        }
      }
    }
    for (let index = 0; index < pickups.length; index += 1) {
      const item = pickups[index];
      if (!item.active) continue;
      item.x -= dx;
      item.bob += dt * 3;
      if (item.x + item.width < -60) {
        item.active = false;
        continue;
      }
      if (harmless) continue;
      if (overlaps(box.x, box.y, box.width, box.height, item.x, item.y - 4, item.width, item.height + 8, 2)) {
        item.active = false;
        if (item.kind === KIND_CORN) {
          state.score += CORN.points;
          events |= EVENT_PICKUP;
          burst(item.x + 13, item.y + 13, 5, 2);
        } else {
          state.score += FEATHER.points;
          if (state.lives < LIVES) state.lives += 1;
          events |= EVENT_FEATHER;
          burst(item.x + 15, item.y + 15, 10, 2);
        }
      }
    }
    for (let index = 0; index < particles.length; index += 1) {
      const part = particles[index];
      if (!part.active) continue;
      part.life += dt;
      if (part.life >= part.maxLife) {
        part.active = false;
        continue;
      }
      part.x += part.vx * dt - dx * 0.4;
      part.y += part.vy * dt;
      part.vy += 500 * dt;
    }
    return events;
  }

  reset();
  return { state, reset, step };
}
