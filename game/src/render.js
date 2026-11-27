// Drawing only: the world's state and the current screen in, pixels out.
// The 1280x720 playfield is scaled to fit the window and centred, the
// margin filled with the backdrop colour. A dusk farmyard in flat shapes:
// gradient sky, low sun, barn and windmill silhouettes, fences and trees
// scrolling past at two depths, then the turkey, the farmer on its tail,
// the obstacles and the HUD. Canvas text for the HUD and the panels.

import { FARMER, FIELD, FONT, GOAL_METERS, LIVES, PALETTE, PLAYER } from './config.js';
import {
  KIND_BRANCH,
  KIND_CORN,
  KIND_FEATHER,
  KIND_FENCE,
  KIND_HAY,
  KIND_KNIFE,
  KIND_OVEN,
  KIND_PUMPKIN,
} from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';

const PANEL = { width: 660, top: 150, line: 32, bottom: 76 };
const GROUND = FIELD.groundY;

function cachedLabel(prefix) {
  let value = -1;
  let text = '';
  return function label(next) {
    if (next !== value) {
      value = next;
      text = prefix + next;
    }
    return text;
  };
}

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };
  const scoreLabel = cachedLabel('Score ');
  const levelLabel = cachedLabel('Level ');
  const finalLabel = cachedLabel('Score ');
  const bestLabel = cachedLabel('Best ');
  const distanceLabel = cachedLabel('');
  let skyGradient = null;
  let groundGradient = null;

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
    skyGradient = context.createLinearGradient(0, 0, 0, GROUND);
    skyGradient.addColorStop(0, PALETTE.skyTop);
    skyGradient.addColorStop(0.55, PALETTE.skyMid);
    skyGradient.addColorStop(1, PALETTE.skyLow);
    groundGradient = context.createLinearGradient(0, GROUND, 0, FIELD.height);
    groundGradient.addColorStop(0, PALETTE.groundTop);
    groundGradient.addColorStop(1, PALETTE.ground);
  }

  const fonts = new Map();
  function text(value, x, y, size, color, align) {
    if (!fonts.has(size)) fonts.set(size, `bold ${size}px ${FONT}`);
    context.font = fonts.get(size);
    context.fillStyle = color;
    context.textAlign = align;
    context.fillText(value, x, y);
  }

  function plainText(value, x, y, size, color, align) {
    if (!fonts.has(`p${size}`)) fonts.set(`p${size}`, `${size}px ${FONT}`);
    context.font = fonts.get(`p${size}`);
    context.fillStyle = color;
    context.textAlign = align;
    context.fillText(value, x, y);
  }

  // --- scenery --------------------------------------------------------------

  function drawSky(state) {
    context.fillStyle = skyGradient;
    context.fillRect(0, 0, FIELD.width, GROUND + 2);
    // Low sun with a glow, sinking over the farm.
    const sunX = 1020;
    const sunY = 430;
    const glow = context.createRadialGradient(sunX, sunY, 10, sunX, sunY, 150);
    glow.addColorStop(0, PALETTE.sunGlow);
    glow.addColorStop(1, 'rgba(255, 207, 94, 0)');
    context.fillStyle = glow;
    context.fillRect(sunX - 150, sunY - 150, 300, 300);
    context.fillStyle = PALETTE.sun;
    context.beginPath();
    context.arc(sunX, sunY, 52, 0, Math.PI * 2);
    context.fill();
    // Drifting clouds, slow parallax.
    context.fillStyle = 'rgba(247, 234, 210, 0.16)';
    for (let index = 0; index < 4; index += 1) {
      const cx = ((index * 340 - state.scrollX * 0.08) % 1400 + 1400) % 1400 - 60;
      const cy = 70 + index * 46;
      context.beginPath();
      context.ellipse(cx, cy, 90, 20, 0, 0, Math.PI * 2);
      context.ellipse(cx + 50, cy + 8, 60, 16, 0, 0, Math.PI * 2);
      context.fill();
    }
  }

  function drawFarHills(state) {
    context.fillStyle = PALETTE.hillFar;
    context.beginPath();
    context.moveTo(0, GROUND);
    for (let x = 0; x <= FIELD.width; x += 80) {
      const hill = Math.sin((x + state.scrollX * 0.12) * 0.006) * 34;
      context.lineTo(x, GROUND - 96 - hill);
    }
    context.lineTo(FIELD.width, GROUND);
    context.closePath();
    context.fill();
    // The barn and windmill the turkey is running away from.
    const barnX = 150 - ((state.scrollX * 0.12) % 1600);
    context.fillStyle = PALETTE.barn;
    context.fillRect(barnX, GROUND - 170, 150, 76);
    context.beginPath();
    context.moveTo(barnX - 12, GROUND - 170);
    context.lineTo(barnX + 75, GROUND - 218);
    context.lineTo(barnX + 162, GROUND - 170);
    context.closePath();
    context.fill();
    context.fillRect(barnX + 62, GROUND - 140, 26, 46);
    const millX = barnX + 320;
    context.fillRect(millX - 8, GROUND - 210, 16, 116);
    context.save();
    context.translate(millX, GROUND - 214);
    context.rotate(state.elapsed * 0.4);
    for (let arm = 0; arm < 4; arm += 1) {
      context.rotate(Math.PI / 2);
      context.fillRect(-3, -58, 6, 58);
    }
    context.restore();
  }

  function drawMidground(state) {
    // Fence posts and oak trees scrolling at half speed.
    context.fillStyle = PALETTE.hillNear;
    for (let index = 0; index < 10; index += 1) {
      const spacing = 190;
      const tx = ((index * spacing - state.scrollX * 0.5) % (spacing * 10) + spacing * 10) % (spacing * 10) - 40;
      context.beginPath();
      context.arc(tx, GROUND - 92, 42, 0, Math.PI * 2);
      context.fill();
      context.fillRect(tx - 6, GROUND - 96, 12, 96);
    }
    context.strokeStyle = PALETTE.fence;
    context.lineWidth = 5;
    context.beginPath();
    for (let index = 0; index < 14; index += 1) {
      const spacing = 110;
      const fx = ((index * spacing - state.scrollX) % (spacing * 14) + spacing * 14) % (spacing * 14) - 20;
      context.moveTo(fx, GROUND - 34);
      context.lineTo(fx, GROUND - 4);
    }
    context.stroke();
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(0, GROUND - 30);
    context.lineTo(FIELD.width, GROUND - 30);
    context.moveTo(0, GROUND - 12);
    context.lineTo(FIELD.width, GROUND - 12);
    context.stroke();
  }

  function drawGround(state) {
    context.fillStyle = groundGradient;
    context.fillRect(0, GROUND, FIELD.width, FIELD.height - GROUND);
    context.fillStyle = PALETTE.grass;
    context.fillRect(0, GROUND, FIELD.width, 10);
    // Grass tufts scrolling with the world.
    context.strokeStyle = PALETTE.grassDark;
    context.lineWidth = 3;
    context.beginPath();
    for (let index = 0; index < 26; index += 1) {
      const spacing = 64;
      const gx = ((index * spacing - state.scrollX) % (spacing * 26) + spacing * 26) % (spacing * 26) - 20;
      context.moveTo(gx, GROUND + 12);
      context.lineTo(gx - 5, GROUND + 26);
      context.moveTo(gx + 6, GROUND + 12);
      context.lineTo(gx + 11, GROUND + 24);
    }
    context.stroke();
  }

  // --- the turkey -----------------------------------------------------------

  function drawTurkey(player, time, allowBlink) {
    const cx = player.x + player.width / 2;
    const sliding = player.sliding;
    const airborne = !player.grounded;
    const bodyY = player.y + player.height;
    const squash = sliding ? 0.55 : 1;
    const legSwing = airborne ? 0 : Math.sin(player.runPhase) * 10;
    const bob = airborne ? 0 : Math.abs(Math.sin(player.runPhase)) * -3;
    // Blink while invulnerable after a hit — but never on an end screen,
    // or the turkey would vanish from its own caught/escaped portrait.
    const blink = allowBlink && player.invulnerable > 0 && Math.floor(player.invulnerable * 10) % 2 === 0;
    if (blink) return;

    context.save();
    context.translate(cx, bodyY + bob);
    context.scale(1, squash);
    // Fanned tail behind (to the left: the turkey faces right). Five
    // feathers along an arc from the rear to the top of the body.
    for (let index = 0; index < 5; index += 1) {
      const angle = -2.8 + index * 0.22;
      const fx = Math.cos(angle) * 30;
      const fy = -26 + Math.sin(angle) * 30;
      context.fillStyle = PALETTE.tail[index];
      context.save();
      context.translate(fx, fy);
      context.rotate(angle + Math.PI / 2);
      context.beginPath();
      context.ellipse(0, 0, 10, 28, 0, 0, Math.PI * 2);
      context.fill();
      context.restore();
    }
    // Legs: running scissor, tucked when airborne, hidden when sliding.
    if (!sliding) {
      context.strokeStyle = PALETTE.leg;
      context.lineWidth = 5;
      context.lineCap = 'round';
      context.beginPath();
      context.moveTo(-6, -8);
      context.lineTo(-6 + legSwing, 0);
      context.moveTo(8, -8);
      context.lineTo(8 - legSwing, 0);
      context.stroke();
    }
    // Body.
    context.fillStyle = PALETTE.turkeyBody;
    context.beginPath();
    context.ellipse(0, -26, 30, 22, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = PALETTE.turkeyDark;
    context.beginPath();
    context.ellipse(-4, -18, 24, 12, 0, 0, Math.PI);
    context.fill();
    // Wing, flapping harder in the air.
    const flap = airborne ? Math.sin(time * 22) * 0.7 : Math.sin(player.runPhase) * 0.18;
    context.save();
    context.translate(-2, -28);
    context.rotate(flap - 0.3);
    context.fillStyle = PALETTE.turkeyLight;
    context.beginPath();
    context.ellipse(-4, 0, 18, 9, 0, 0, Math.PI * 2);
    context.fill();
    context.restore();
    // Head, beak, wattle, eye — facing right, toward freedom.
    context.fillStyle = PALETTE.head;
    context.beginPath();
    context.arc(26, -52, 12, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = PALETTE.beak;
    context.beginPath();
    context.moveTo(36, -54);
    context.lineTo(50, -49);
    context.lineTo(36, -45);
    context.closePath();
    context.fill();
    context.fillStyle = PALETTE.wattle;
    context.beginPath();
    context.ellipse(33, -40, 4, 8, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#1c1030';
    context.beginPath();
    context.arc(29, -55, 2.4, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  // --- the farmer -----------------------------------------------------------

  function drawFarmer(state) {
    const closeness = 1 - state.farmerGap / FARMER.startGap;
    const fx = PLAYER.x - 108 + closeness * 62;
    const fy = GROUND;
    const scale = 0.92 + closeness * 0.16;
    const swing = Math.sin(state.elapsed * 11) * 8;
    context.save();
    context.translate(fx, fy);
    context.scale(scale, scale);
    // Legs.
    context.strokeStyle = PALETTE.farmerOveralls;
    context.lineWidth = 9;
    context.lineCap = 'round';
    context.beginPath();
    context.moveTo(-4, -34);
    context.lineTo(-4 + swing, 0);
    context.moveTo(8, -34);
    context.lineTo(8 - swing, 0);
    context.stroke();
    // Overalls and shirt.
    context.fillStyle = PALETTE.farmerOveralls;
    context.fillRect(-14, -72, 32, 40);
    context.fillStyle = PALETTE.farmerShirt;
    context.fillRect(-16, -92, 36, 24);
    // Pitchfork, raised and ready.
    context.strokeStyle = '#7a6a52';
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(20, -92);
    context.lineTo(34, -128);
    context.moveTo(28, -128);
    context.lineTo(40, -128);
    context.moveTo(34, -128);
    context.lineTo(34, -112);
    context.stroke();
    // Head and straw hat.
    context.fillStyle = PALETTE.farmerSkin;
    context.beginPath();
    context.arc(2, -102, 12, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = PALETTE.farmerHat;
    context.beginPath();
    context.ellipse(2, -110, 20, 5, 0, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.arc(2, -112, 11, Math.PI, 0);
    context.fill();
    // Angry moustache.
    context.fillStyle = '#3a2a1a';
    context.fillRect(-6, -98, 16, 3);
    context.restore();
    if (closeness > 0.62) {
      text('HE IS RIGHT BEHIND YOU!', FIELD.width / 2, 108, 26, PALETTE.danger, 'center');
    }
  }

  // --- obstacles and pickups -------------------------------------------------

  function drawObstacle(item, time) {
    if (item.kind === KIND_FENCE) {
      context.fillStyle = PALETTE.fence;
      context.fillRect(item.x, item.y, 6, item.height);
      context.fillRect(item.x + item.width - 6, item.y, 6, item.height);
      context.fillRect(item.x, item.y + 8, item.width, 8);
      context.fillRect(item.x, item.y + 32, item.width, 8);
    } else if (item.kind === KIND_HAY) {
      context.fillStyle = PALETTE.hay;
      context.beginPath();
      context.ellipse(item.x + item.width / 2, item.y + item.height / 2, item.width / 2, item.height / 2, 0, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = PALETTE.hayDark;
      context.lineWidth = 3;
      context.beginPath();
      context.ellipse(item.x + item.width / 2, item.y + item.height / 2, item.width / 2 - 10, item.height / 2 - 10, 0, 0, Math.PI * 2);
      context.stroke();
      context.beginPath();
      context.moveTo(item.x + 12, item.y + 18);
      context.lineTo(item.x + item.width - 12, item.y + item.height - 18);
      context.moveTo(item.x + item.width - 12, item.y + 18);
      context.lineTo(item.x + 12, item.y + item.height - 18);
      context.stroke();
    } else if (item.kind === KIND_PUMPKIN) {
      context.fillStyle = PALETTE.pumpkin;
      context.beginPath();
      context.ellipse(item.x + item.width / 2, item.y + item.height / 2 + 6, 30, 22, 0, 0, Math.PI * 2);
      context.ellipse(item.x + item.width / 2 - 16, item.y + item.height / 2 + 8, 16, 18, 0, 0, Math.PI * 2);
      context.ellipse(item.x + item.width / 2 + 16, item.y + item.height / 2 + 8, 16, 18, 0, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = PALETTE.pumpkinDark;
      context.fillRect(item.x + item.width / 2 - 3, item.y - 6, 6, 12);
    } else if (item.kind === KIND_BRANCH) {
      // A low branch on a trunk stub: slide under it.
      context.fillStyle = '#4a3a26';
      context.fillRect(item.x + item.width - 12, item.y - 40, 12, 110);
      context.fillStyle = PALETTE.grassDark;
      context.beginPath();
      context.ellipse(item.x + item.width / 2, item.y + 22, item.width / 2 + 8, 34, 0, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = PALETTE.grass;
      context.beginPath();
      context.ellipse(item.x + item.width / 2 - 8, item.y + 30, 22, 16, 0, 0, Math.PI * 2);
      context.fill();
    } else if (item.kind === KIND_OVEN) {
      context.fillStyle = PALETTE.oven;
      context.fillRect(item.x, item.y, item.width, item.height);
      context.fillStyle = '#2e2e34';
      context.fillRect(item.x + 10, item.y + 10, item.width - 20, item.height - 20);
      // Fire licking out of the oven door.
      const flicker = Math.sin(time * 13 + item.x) * 4;
      context.fillStyle = PALETTE.ovenFire;
      context.beginPath();
      context.moveTo(item.x + 22, item.y + 14);
      context.quadraticCurveTo(item.x + 34, item.y - 16 + flicker, item.x + 46, item.y + 14);
      context.moveTo(item.x + 62, item.y + 14);
      context.quadraticCurveTo(item.x + 74, item.y - 22 - flicker, item.x + 86, item.y + 14);
      context.fill();
      context.fillStyle = PALETTE.ovenGlow;
      context.beginPath();
      context.arc(item.x + 34, item.y + 8, 5, 0, Math.PI * 2);
      context.arc(item.x + 74, item.y + 6, 4, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = PALETTE.knife;
      context.fillRect(item.x + item.width / 2 - 14, item.y - 8, 28, 8);
    } else if (item.kind === KIND_KNIFE) {
      context.fillStyle = PALETTE.knifeHandle;
      context.fillRect(item.x + 4, item.y + item.height - 20, 18, 20);
      context.fillStyle = PALETTE.knife;
      context.beginPath();
      context.moveTo(item.x, item.y + item.height - 20);
      context.lineTo(item.x + item.width, item.y + item.height - 20);
      context.lineTo(item.x + item.width / 2, item.y);
      context.closePath();
      context.fill();
    }
  }

  function drawPickup(item) {
    const bobY = Math.sin(item.bob) * 4;
    if (item.kind === KIND_CORN) {
      context.fillStyle = PALETTE.corn;
      context.beginPath();
      context.ellipse(item.x + 13, item.y + 13 + bobY, 9, 13, 0, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = PALETTE.cornHusk;
      context.beginPath();
      context.moveTo(item.x + 5, item.y + 20 + bobY);
      context.lineTo(item.x + 13, item.y + 30 + bobY);
      context.lineTo(item.x + 21, item.y + 20 + bobY);
      context.closePath();
      context.fill();
    } else if (item.kind === KIND_FEATHER) {
      context.fillStyle = PALETTE.featherGold;
      context.save();
      context.translate(item.x + 15, item.y + 15 + bobY);
      context.rotate(Math.sin(item.bob * 0.7) * 0.4);
      context.beginPath();
      context.ellipse(0, 0, 7, 16, 0, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#fff3b0';
      context.fillRect(-1, -14, 2, 28);
      context.restore();
    }
  }

  function drawParticles(state) {
    for (const part of state.particles) {
      if (!part.active) continue;
      const alpha = 1 - part.life / part.maxLife;
      context.globalAlpha = alpha;
      context.fillStyle = part.kind === 0 ? '#c9a98a' : part.kind === 1 ? '#e8a33c' : '#f2c94c';
      context.beginPath();
      context.arc(part.x, part.y, part.size, 0, Math.PI * 2);
      context.fill();
    }
    context.globalAlpha = 1;
  }

  // --- HUD and panels ---------------------------------------------------------

  function drawFeatherIcon(x, y, filled) {
    context.fillStyle = filled ? PALETTE.featherGold : 'rgba(247, 234, 210, 0.25)';
    context.save();
    context.translate(x, y);
    context.rotate(-0.5);
    context.beginPath();
    context.ellipse(0, 0, 6, 13, 0, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  function drawHud(state, muted) {
    context.textBaseline = 'top';
    text(scoreLabel(Math.floor(state.score)), 24, 18, 28, PALETTE.text, 'left');
    plainText(levelLabel(state.level), 24, 52, 20, PALETTE.muted, 'left');
    // Distance progress: a bar from the farm to the forest gate.
    const barX = 430;
    const barW = 420;
    const barY = 24;
    const progress = Math.min(1, state.distance / GOAL_METERS);
    context.fillStyle = 'rgba(24, 16, 40, 0.7)';
    context.fillRect(barX - 8, barY - 6, barW + 16, 40);
    context.fillStyle = '#3c2a4d';
    context.fillRect(barX, barY + 6, barW, 12);
    context.fillStyle = PALETTE.good;
    context.fillRect(barX, barY + 6, barW * progress, 12);
    context.fillStyle = PALETTE.text;
    context.beginPath();
    context.arc(barX + barW * progress, barY + 12, 9, 0, Math.PI * 2);
    context.fill();
    plainText('FOREST GATE', barX + barW + 12, barY + 4, 16, PALETTE.muted, 'left');
    plainText(distanceLabel(Math.floor(state.distance)) + 'm / ' + GOAL_METERS + 'm', barX, barY + 26, 14, PALETTE.muted, 'left');
    // Lives as golden feathers, top right.
    const firstLife = FIELD.width - 24 - LIVES * 30;
    plainText('Lives', firstLife - 14, 22, 20, PALETTE.text, 'right');
    for (let life = 0; life < LIVES; life += 1) {
      drawFeatherIcon(firstLife + 14 + life * 30, 34, life < state.lives);
    }
    if (muted) plainText('MUTED (M)', FIELD.width - 24, 56, 16, PALETTE.muted, 'right');
  }

  function drawPanel(title, lines, prompt) {
    const height = PANEL.top + lines.length * PANEL.line + PANEL.bottom;
    const x = (FIELD.width - PANEL.width) / 2;
    const y = (FIELD.height - height) / 2;
    context.fillStyle = PALETTE.panel;
    context.fillRect(x, y, PANEL.width, height);
    context.strokeStyle = PALETTE.panelEdge;
    context.lineWidth = 3;
    context.strokeRect(x, y, PANEL.width, height);
    context.textBaseline = 'alphabetic';
    text(title, FIELD.width / 2, y + 78, 46, PALETTE.text, 'center');
    for (let index = 0; index < lines.length; index += 1) {
      plainText(lines[index], FIELD.width / 2, y + PANEL.top + index * PANEL.line, 21, PALETTE.muted, 'center');
    }
    text(prompt, FIELD.width / 2, y + height - 38, 23, PALETTE.corn, 'center');
  }

  const TITLE_LINES = [
    'Thanksgiving is coming — and Tom is on the menu.',
    'Run 1200m through the farmyard to the forest gate.',
    'Jump fences, hay bales and the oven — slide under branches.',
    'Grab corn for points, golden feathers for a life back.',
    'Three stumbles and the farmer catches you. Space / click to jump,',
    'Down / S to slide, P to pause, M to mute.',
    '',
  ];
  const PAUSED_LINES = ['The farmer waits for no turkey. Well — right now he does.'];
  const OVER_LINES = ['', ''];
  const WIN_LINES = ['', '', ''];

  /** Paint one frame: the farm, then the HUD or a panel for the screen. */
  function draw(state, screen, best, muted) {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = PALETTE.backdrop;
    context.fillRect(0, 0, canvas.width, canvas.height);
    const shakeX = state.shake > 0 ? (Math.random() - 0.5) * 10 * state.shake : 0;
    const shakeY = state.shake > 0 ? (Math.random() - 0.5) * 8 * state.shake : 0;
    context.setTransform(view.scale, 0, 0, view.scale, view.x + shakeX * view.scale, view.y + shakeY * view.scale);
    drawSky(state);
    drawFarHills(state);
    drawMidground(state);
    drawGround(state);
    for (let index = 0; index < state.obstacles.length; index += 1) {
      const item = state.obstacles[index];
      if (item.active) drawObstacle(item, state.elapsed);
    }
    for (let index = 0; index < state.pickups.length; index += 1) {
      const item = state.pickups[index];
      if (item.active) drawPickup(item);
    }
    drawParticles(state);
    drawFarmer(state);
    drawTurkey(state.player, state.elapsed, screen === SCREEN_PLAY);
    if (screen === SCREEN_TITLE) {
      TITLE_LINES[6] = bestLabel(Math.floor(best));
      drawPanel("TOM'S GREAT ESCAPE", TITLE_LINES, 'Press Space or click to run');
      return;
    }
    drawHud(state, muted);
    if (screen === SCREEN_PAUSED) drawPanel('Paused', PAUSED_LINES, 'Press P to resume');
    else if (screen === SCREEN_OVER) {
      OVER_LINES[0] = finalLabel(Math.floor(state.score));
      OVER_LINES[1] = bestLabel(Math.floor(best));
      drawPanel('CAUGHT FOR DINNER', OVER_LINES, 'Press Space or click to run again');
    } else if (screen === SCREEN_WIN) {
      WIN_LINES[0] = finalLabel(Math.floor(state.score));
      WIN_LINES[1] = 'Distance ' + Math.floor(state.distance) + 'm — the forest gate!';
      WIN_LINES[2] = bestLabel(Math.floor(best));
      drawPanel('ESCAPED!', WIN_LINES, 'Press Space or click to run again');
    }
  }

  resize();
  window.addEventListener('resize', resize);
  return { draw };
}
