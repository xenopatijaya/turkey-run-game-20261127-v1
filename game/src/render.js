// All drawing: the autumn farm, the barn, the kitchen, the turkey, the farmer,
// the oven, the knives, the HUD and every screen. Canvas 2D, no image files.
import { ESCAPE_DISTANCE, FARMER, GROUND_Y, STAGES, TURKEY, VIEW } from './config.js';
import { KIND_CORN, KIND_FENCE, KIND_HAY, KIND_KNIFE, KIND_OVEN, KIND_PIE, KIND_PUMPKIN } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_ESCAPED = 'escaped';

const INK = '#2b1a12';
const CREAM = '#fff3d6';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'left', weight = 800) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px Trebuchet MS, Verdana, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(str, x, y);
}

function chip(ctx, x, y, w, h, fill) {
  ctx.fillStyle = fill;
  roundRect(ctx, x, y, w, h, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(43,26,18,0.35)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width = VIEW.width;
  canvas.height = VIEW.height;

  function drawSky(stageIndex, distance) {
    const skies = [
      ['#ffb347', '#ff8c42', '#7a3b1e'],
      ['#c98a4b', '#8a5a2e', '#4a2c14'],
      ['#e8d9b0', '#d9b380', '#8a5a2e'],
    ];
    const [top, mid, bottom] = skies[stageIndex];
    const grad = ctx.createLinearGradient(0, 0, 0, VIEW.height);
    grad.addColorStop(0, top);
    grad.addColorStop(0.55, mid);
    grad.addColorStop(1, bottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    // Low autumn sun.
    ctx.fillStyle = '#fff0b8';
    ctx.beginPath();
    ctx.arc(1080, 110, 52, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,240,184,0.35)';
    ctx.beginPath();
    ctx.arc(1080, 110, 78, 0, Math.PI * 2);
    ctx.fill();
    // Drifting clouds.
    ctx.fillStyle = 'rgba(255,243,214,0.85)';
    for (let i = 0; i < 3; i += 1) {
      const cx = ((i * 430 - distance * 12) % 1500 + 1500) % 1500 - 120;
      ctx.beginPath();
      ctx.ellipse(cx, 80 + i * 46, 90, 24, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 60, 88 + i * 46, 60, 18, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawBackdrop(stageIndex, distance) {
    const par = (factor) => (distance * factor) % 320;
    if (stageIndex === 0) {
      // Farmyard: red barn, fence line, hay bales, maple trees.
      ctx.fillStyle = '#8a4b2a';
      ctx.fillRect(0, 470, VIEW.width, 150);
      ctx.fillStyle = '#7c3f21';
      for (let x = -par(30); x < VIEW.width; x += 320) {
        ctx.fillRect(x, 470, 300, 150);
      }
      // Barn.
      const bx = 900 - par(14);
      ctx.fillStyle = '#a83226';
      ctx.fillRect(bx, 380, 260, 240);
      ctx.beginPath();
      ctx.moveTo(bx - 16, 382);
      ctx.lineTo(bx + 130, 300);
      ctx.lineTo(bx + 276, 382);
      ctx.closePath();
      ctx.fillStyle = '#7c241a';
      ctx.fill();
      ctx.strokeStyle = '#fff3d6';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(bx + 130, 380); ctx.lineTo(bx + 130, 620);
      ctx.moveTo(bx, 500); ctx.lineTo(bx + 260, 500);
      ctx.stroke();
      // Maple trees.
      for (let i = 0; i < 4; i += 1) {
        const tx = ((i * 340 - distance * 22) % 1400 + 1400) % 1400 - 60;
        ctx.fillStyle = '#5d3a1a';
        ctx.fillRect(tx + 18, 470, 16, 150);
        ctx.fillStyle = i % 2 ? '#c15527' : '#d97b29';
        ctx.beginPath();
        ctx.arc(tx + 26, 440, 62, 0, Math.PI * 2);
        ctx.arc(tx - 20, 470, 44, 0, Math.PI * 2);
        ctx.arc(tx + 70, 470, 44, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (stageIndex === 1) {
      // Barn interior: plank walls, hanging lanterns, hay bales.
      ctx.fillStyle = '#6b4423';
      ctx.fillRect(0, 0, VIEW.width, 620);
      ctx.fillStyle = '#5a3719';
      for (let y = 60; y < 620; y += 90) ctx.fillRect(0, y, VIEW.width, 8);
      ctx.fillStyle = 'rgba(255,190,80,0.25)';
      for (let i = 0; i < 4; i += 1) {
        const lx = ((i * 360 - distance * 18) % 1400 + 1400) % 1400 - 60;
        ctx.beginPath();
        ctx.arc(lx, 180, 90, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#3a2410';
        ctx.fillRect(lx - 16, 150, 32, 46);
        ctx.fillStyle = '#ffbe50';
        ctx.fillRect(lx - 10, 160, 20, 26);
        ctx.fillStyle = 'rgba(255,190,80,0.25)';
      }
      ctx.fillStyle = '#d9a441';
      for (let i = 0; i < 3; i += 1) {
        const hx = ((i * 520 - distance * 26) % 1500 + 1500) % 1500 - 100;
        ctx.beginPath();
        ctx.ellipse(hx, 590, 90, 42, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Kitchen: warm wall, sunset window, shelf of labelled jars, hanging
      // copper pots, and the dinner table waiting with its cloche.
      ctx.fillStyle = '#f0dcb2';
      ctx.fillRect(0, 0, VIEW.width, 620);
      ctx.fillStyle = '#e0c48f';
      for (let y = 70; y < 620; y += 110) ctx.fillRect(0, y, VIEW.width, 4);
      // Window: sunset over the farm, herb pot on the sill.
      ctx.fillStyle = '#7a9e7e';
      ctx.fillRect(120, 90, 300, 230);
      const sunGrad = ctx.createLinearGradient(0, 106, 0, 294);
      sunGrad.addColorStop(0, '#ffd23c');
      sunGrad.addColorStop(1, '#ff8c42');
      ctx.fillStyle = sunGrad;
      ctx.fillRect(136, 106, 268, 188);
      ctx.fillStyle = '#7a3b1e';
      ctx.beginPath();
      ctx.ellipse(300, 294, 120, 26, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#fff3d6';
      ctx.fillRect(262, 106, 12, 188);
      ctx.fillRect(136, 190, 268, 12);
      ctx.fillStyle = '#c15527';
      ctx.beginPath();
      ctx.arc(150, 296, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#5d7d38';
      ctx.beginPath();
      ctx.ellipse(150, 282, 18, 8, -0.5, 0, Math.PI * 2);
      ctx.fill();
      // Wall clock.
      ctx.fillStyle = '#fff3d6';
      ctx.beginPath();
      ctx.arc(640, 130, 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#8a5a2e';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(640, 130, 34, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(640, 130); ctx.lineTo(640, 106);
      ctx.moveTo(640, 130); ctx.lineTo(658, 138);
      ctx.stroke();
      // Shelf with labelled jars.
      ctx.fillStyle = '#8a5a2e';
      ctx.fillRect(760, 200, 380, 14);
      const jarColors = ['#e2725b', '#f2c230', '#7a9e7e', '#c15527'];
      jarColors.forEach((c, i) => {
        ctx.fillStyle = c;
        roundRect(ctx, 780 + i * 90, 140, 56, 60, 8);
        ctx.fill();
        ctx.fillStyle = '#8a5a2e';
        ctx.fillRect(788 + i * 90, 132, 40, 10);
        ctx.fillStyle = '#fff3d6';
        ctx.fillRect(790 + i * 90, 162, 36, 18);
      });
      // Hanging copper pots, top right.
      for (let i = 0; i < 3; i += 1) {
        const px = 830 + i * 110;
        ctx.strokeStyle = '#8a5a2e';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(px, 0); ctx.lineTo(px, 54);
        ctx.stroke();
        ctx.fillStyle = '#b87333';
        ctx.beginPath();
        ctx.arc(px, 84, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#8a4b1d';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px, 84, 30, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Dinner table with the cloche — what the turkey is running from.
      ctx.fillStyle = '#8a5a2e';
      ctx.fillRect(900, 470, 300, 16);
      ctx.fillStyle = '#6b4423';
      ctx.fillRect(920, 486, 14, 134);
      ctx.fillRect(1166, 486, 14, 134);
      ctx.fillStyle = '#d9d9d9';
      ctx.beginPath();
      ctx.ellipse(1050, 470, 70, 34, 0, Math.PI, 0);
      ctx.fill();
      text(ctx, 'DINNER', 1050, 516, 16, '#2b1a12', 'center');
    }
    // Ground strip.
    ctx.fillStyle = stageIndex === 2 ? '#b98a5a' : '#7a9e4f';
    ctx.fillRect(0, GROUND_Y, VIEW.width, VIEW.height - GROUND_Y);
    ctx.fillStyle = stageIndex === 2 ? '#a1764a' : '#5d7d38';
    ctx.fillRect(0, GROUND_Y, VIEW.width, 10);
    if (stageIndex === 2) {
      // Checkered kitchen floor.
      for (let x = 0; x < VIEW.width; x += 64) {
        for (let y = GROUND_Y + 10; y < VIEW.height; y += 44) {
          if (((x / 64) + ((y - GROUND_Y - 10) / 44)) % 2 === 0) {
            ctx.fillStyle = 'rgba(0,0,0,0.09)';
            ctx.fillRect(x, y, 64, 44);
          }
        }
      }
    }
    if (stageIndex !== 2) {
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      for (let x = -par(40); x < VIEW.width; x += 90) {
        ctx.beginPath();
        ctx.ellipse(x, GROUND_Y + 46, 26, 7, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawTurkey(turkey, hidden, time = 0) {
    if (hidden) return; // tucked inside the haystack
    if (turkey.invuln > 0 && Math.floor(time * 12) % 2 === 0) return; // grace-period blink
    const x = turkey.x;
    const y = turkey.y;
    const bob = turkey.grounded ? Math.abs(Math.sin(turkey.runPhase)) * 4 : 0;
    const legSwing = Math.sin(turkey.runPhase) * 10;
    ctx.save();
    ctx.translate(x + TURKEY.width / 2, y + TURKEY.height - bob);
    // Legs.
    ctx.strokeStyle = '#e2725b';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-8, 0); ctx.lineTo(-8 + legSwing, 14);
    ctx.moveTo(10, 0); ctx.lineTo(10 - legSwing, 14);
    ctx.stroke();
    // Tail feather fan.
    const featherColors = ['#8a4b2a', '#c15527', '#d97b29', '#a83226', '#7a3b1e'];
    featherColors.forEach((color, i) => {
      const angle = -1.1 + i * 0.55;
      ctx.save();
      ctx.rotate(angle);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(-34, -16, 10, 26, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f2c230';
      ctx.beginPath();
      ctx.ellipse(-34, -34, 4, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    // Body.
    ctx.fillStyle = '#6b3a1f';
    ctx.beginPath();
    ctx.ellipse(0, -26, 34, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8a4b2a';
    ctx.beginPath();
    ctx.ellipse(4, -30, 26, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    // Wing.
    ctx.fillStyle = '#4a2c14';
    ctx.beginPath();
    ctx.ellipse(-4, -24, 18, 12, -0.4, 0, Math.PI * 2);
    ctx.fill();
    // Neck and head.
    ctx.fillStyle = '#6b3a1f';
    ctx.beginPath();
    ctx.ellipse(28, -52, 9, 18, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e2725b';
    ctx.beginPath();
    ctx.arc(34, -66, 13, 0, Math.PI * 2);
    ctx.fill();
    // Beak + wattle + eye.
    ctx.fillStyle = '#f2c230';
    ctx.beginPath();
    ctx.moveTo(44, -68); ctx.lineTo(58, -64); ctx.lineTo(44, -60);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#c1272d';
    ctx.beginPath();
    ctx.ellipse(38, -54, 4, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(38, -70, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(39, -70, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawFarmer(farmer, mode) {
    const x = farmer.x;
    const y = farmer.y;
    const swing = Math.sin(farmer.phase) * 12;
    ctx.save();
    ctx.translate(x + FARMER.width / 2, y + FARMER.height);
    // Legs (overalls).
    ctx.strokeStyle = '#2e4a6b';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-10, -46); ctx.lineTo(-10 + swing, 0);
    ctx.moveTo(10, -46); ctx.lineTo(10 - swing, 0);
    ctx.stroke();
    // Body: red shirt + blue overalls.
    ctx.fillStyle = '#c1272d';
    ctx.fillRect(-24, -104, 48, 60);
    ctx.fillStyle = '#2e4a6b';
    ctx.fillRect(-24, -78, 48, 34);
    ctx.fillStyle = '#f2c230';
    ctx.fillRect(-24, -80, 48, 5);
    // Arm reaching forward + pitchfork.
    ctx.strokeStyle = '#e8b88a';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(18, -92); ctx.lineTo(46, -70);
    ctx.stroke();
    ctx.strokeStyle = '#8a5a2e';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(46, -118); ctx.lineTo(46, -52);
    ctx.stroke();
    ctx.strokeStyle = '#d9d9d9';
    ctx.lineWidth = 3;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(46 + i * 6, -118); ctx.lineTo(46 + i * 6, -132);
      ctx.stroke();
    }
    // Head + straw hat.
    ctx.fillStyle = '#e8b88a';
    ctx.beginPath();
    ctx.arc(0, -116, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d9a441';
    ctx.beginPath();
    ctx.ellipse(0, -128, 30, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, -134, 16, 10, 0, Math.PI, 0);
    ctx.fill();
    // Angry eyes + moustache.
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-10, -122); ctx.lineTo(-2, -118);
    ctx.moveTo(10, -122); ctx.lineTo(2, -118);
    ctx.stroke();
    ctx.fillStyle = '#5d3a1a';
    ctx.fillRect(-9, -108, 18, 4);
    ctx.restore();
    if (mode === 'corner') {
      text(ctx, '!', x + FARMER.width / 2, y - 18, 44, '#ff3b30', 'center');
    }
    if (mode === 'search') {
      text(ctx, '?', x + FARMER.width / 2, y - 18, 40, '#f2c230', 'center');
    }
  }

  function drawOven(item, time) {
    const flicker = Math.sin(time * 9 + item.x) * 6;
    ctx.fillStyle = 'rgba(255,90,40,0.25)';
    ctx.beginPath();
    ctx.ellipse(item.x + item.width / 2, item.y + item.height / 2, 90, 70, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a3a3a';
    roundRect(ctx, item.x, item.y, item.width, item.height, 10);
    ctx.fill();
    ctx.fillStyle = '#555';
    ctx.fillRect(item.x + 8, item.y + 8, item.width - 16, 18);
    // Fire window.
    ctx.fillStyle = '#ff7a1a';
    roundRect(ctx, item.x + 16, item.y + 36, item.width - 32, 40, 6);
    ctx.fill();
    ctx.fillStyle = '#ffd23c';
    ctx.beginPath();
    ctx.moveTo(item.x + 30, item.y + 72);
    ctx.quadraticCurveTo(item.x + 40, item.y + 44 + flicker, item.x + 52, item.y + 72);
    ctx.quadraticCurveTo(item.x + 62, item.y + 50 - flicker, item.x + 74, item.y + 72);
    ctx.quadraticCurveTo(item.x + 86, item.y + 48 + flicker, item.x + 98, item.y + 72);
    ctx.closePath();
    ctx.fill();
    text(ctx, 'HOT!', item.x + item.width / 2, item.y - 10, 20, '#ff5a3c', 'center');
  }

  function drawKnife(item) {
    ctx.save();
    ctx.translate(item.x + item.width / 2, item.y + item.height / 2);
    ctx.rotate(item.angle || 0);
    ctx.fillStyle = '#d9d9d9';
    ctx.beginPath();
    ctx.moveTo(-32, -5); ctx.lineTo(14, -9); ctx.lineTo(32, 0); ctx.lineTo(14, 9); ctx.lineTo(-32, 5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#3a2410';
    roundRect(ctx, -32, -6, 20, 12, 4);
    ctx.fill();
    ctx.restore();
  }

  function drawPickup(item) {
    const bobY = item.y + Math.sin(item.bob) * 5;
    if (item.kind === KIND_CORN) {
      ctx.fillStyle = '#f2c230';
      ctx.beginPath();
      ctx.ellipse(item.x + 17, bobY + 22, 13, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#d9a41f';
      for (let r = 0; r < 3; r += 1) {
        ctx.beginPath();
        ctx.arc(item.x + 11 + r * 6, bobY + 12, 2.5, 0, Math.PI * 2);
        ctx.arc(item.x + 11 + r * 6, bobY + 22, 2.5, 0, Math.PI * 2);
        ctx.arc(item.x + 11 + r * 6, bobY + 32, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#7a9e4f';
      ctx.beginPath();
      ctx.ellipse(item.x + 17, bobY + 42, 12, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (item.kind === KIND_PIE) {
      ctx.fillStyle = '#e2725b';
      ctx.beginPath();
      ctx.moveTo(item.x, bobY + 30); ctx.lineTo(item.x + 40, bobY + 30); ctx.lineTo(item.x + 20, bobY + 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fff3d6';
      ctx.beginPath();
      ctx.arc(item.x + 20, bobY + 14, 5, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, '+1 LIFE', item.x + 20, bobY - 6, 13, '#fff3d6', 'center');
    }
  }

  function drawHay(item) {
    ctx.fillStyle = item.used ? '#b98a3a' : '#d9a441';
    ctx.beginPath();
    ctx.ellipse(item.x + item.width / 2, item.y + item.height - 6, item.width / 2, item.height / 2 - 6, 0, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#a1762a';
    ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i += 1) {
      ctx.beginPath();
      ctx.moveTo(item.x + item.width / 2 + i * 18, item.y + 14);
      ctx.lineTo(item.x + item.width / 2 + i * 22, item.y + item.height - 12);
      ctx.stroke();
    }
    if (!item.used) {
      // Dark pill so the label reads on the cream kitchen wall and the dark fence alike.
      ctx.fillStyle = 'rgba(43,26,18,0.72)';
      roundRect(ctx, item.x + item.width / 2 - 48, item.y - 26, 96, 24, 12);
      ctx.fill();
      text(ctx, 'HIDE! ↓', item.x + item.width / 2, item.y - 8, 16, '#fff3d6', 'center');
    }
  }

  function drawHud(state, stageLabel) {
    // Top bar chips.
    chip(ctx, 16, 14, 250, 46, 'rgba(43,26,18,0.72)');
    text(ctx, `SCORE ${Math.floor(state.score)}`, 30, 45, 24, CREAM);
    chip(ctx, 282, 14, 250, 46, 'rgba(43,26,18,0.72)');
    text(ctx, `DIST ${Math.floor(state.distance)} m / ${ESCAPE_DISTANCE} m`, 296, 45, 24, CREAM);
    // Lives as hearts.
    chip(ctx, 548, 14, 150, 46, 'rgba(43,26,18,0.72)');
    for (let i = 0; i < 3; i += 1) {
      ctx.fillStyle = i < state.lives ? '#ff3b30' : 'rgba(255,255,255,0.25)';
      const hx = 578 + i * 42;
      ctx.beginPath();
      ctx.arc(hx, 32, 11, 0, Math.PI * 2);
      ctx.arc(hx + 18, 32, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(hx - 8, 36); ctx.lineTo(hx + 28, 36); ctx.lineTo(hx + 10, 52);
      ctx.closePath();
      ctx.fill();
    }
    // Stage label.
    chip(ctx, 714, 14, 300, 46, 'rgba(43,26,18,0.72)');
    text(ctx, stageLabel, 728, 45, 22, '#ffd23c');
    // Farmer proximity: how close the farmer is behind the turkey.
    const danger = 1 - state.gap / 420;
    chip(ctx, 1030, 14, 234, 46, 'rgba(43,26,18,0.72)');
    text(ctx, 'FARMER', 1044, 45, 20, danger > 0.7 ? '#ff5a3c' : CREAM);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    roundRect(ctx, 1130, 28, 120, 16, 8);
    ctx.fill();
    ctx.fillStyle = danger > 0.7 ? '#ff3b30' : danger > 0.45 ? '#f2c230' : '#7a9e4f';
    roundRect(ctx, 1130, 28, Math.max(8, 120 * danger), 16, 8);
    ctx.fill();
    // Dash meter, bottom left.
    chip(ctx, 16, 660, 260, 44, 'rgba(43,26,18,0.72)');
    text(ctx, 'DASH [SHIFT]', 30, 689, 18, CREAM);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    roundRect(ctx, 150, 672, 110, 16, 8);
    ctx.fill();
    ctx.fillStyle = '#4fc3f7';
    roundRect(ctx, 150, 672, Math.max(8, 110 * (state.dash / 100)), 16, 8);
    ctx.fill();
    // Controls hint, bottom right.
    text(ctx, '← → move · SPACE jump · ↓ hide in hay · P pause · M mute', 1264, 692, 16, 'rgba(255,243,214,0.85)', 'right');
    // Stage message banner.
    if (state.messageLeft > 0 && state.message) {
      ctx.fillStyle = 'rgba(43,26,18,0.8)';
      roundRect(ctx, 390, 90, 500, 64, 14);
      ctx.fill();
      text(ctx, state.message, 640, 132, 30, '#ffd23c', 'center');
    }
    // SPOTTED warning.
    if (state.farmer.shout > 0 && !state.turkey.hidden) {
      text(ctx, 'SPOTTED! RUN!', 640, 210, 44, '#ff3b30', 'center');
    }
    if (state.turkey.hidden) {
      text(ctx, 'HIDDEN… shhh!', 640, 210, 36, '#fff3d6', 'center');
    }
    // Red flash on hit.
    if (state.flash > 0) {
      ctx.fillStyle = `rgba(255,40,20,${state.flash * 0.55})`;
      ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    }
    // Progress to the forest gate, just under the top bar.
    ctx.fillStyle = 'rgba(43,26,18,0.72)';
    roundRect(ctx, 440, 72, 400, 14, 7);
    ctx.fill();
    ctx.fillStyle = '#7a9e4f';
    roundRect(ctx, 440, 72, Math.max(8, 400 * (state.distance / ESCAPE_DISTANCE)), 14, 7);
    ctx.fill();
    // Turkey marker riding the bar.
    ctx.fillStyle = '#fff3d6';
    ctx.beginPath();
    ctx.arc(Math.min(836, Math.max(444, 440 + 400 * (state.distance / ESCAPE_DISTANCE))), 79, 6, 0, Math.PI * 2);
    ctx.fill();
    // Stage labels under the bar: the run's map at a glance.
    text(ctx, 'FARMYARD', 440, 104, 11, CREAM);
    text(ctx, 'BARN', 554, 104, 11, CREAM);
    text(ctx, 'KITCHEN', 697, 104, 11, CREAM);
    text(ctx, '🌲 WOODS', 840, 104, 11, '#7ddc7d', 'right');
  }

  function drawTitle(state, best) {
    drawSky(0, 0);
    drawBackdrop(0, 0);
    // Big title card.
    ctx.fillStyle = 'rgba(43,26,18,0.78)';
    roundRect(ctx, 240, 90, 800, 300, 22);
    ctx.fill();
    ctx.strokeStyle = '#f2c230';
    ctx.lineWidth = 4;
    roundRect(ctx, 240, 90, 800, 300, 22);
    ctx.stroke();
    text(ctx, '🦃 TURKEY ESCAPE', 640, 185, 72, '#ffd23c', 'center');
    text(ctx, 'Thanksgiving is coming. The farmer is coming faster.', 640, 235, 26, CREAM, 'center');
    text(ctx, 'Outrun the farmer. Dodge the oven and the carving knives.', 640, 272, 22, '#ffb347', 'center');
    text(ctx, 'Reach the forest gate — 1400 m — and live to gobble another day!', 640, 306, 22, '#ffb347', 'center');
    text(ctx, '▶  CLICK or press ENTER to run', 640, 356, 30, '#fff', 'center');
    // Controls row.
    text(ctx, '← →  move      SPACE  jump      SHIFT  dash      ↓  hide in hay', 640, 440, 24, INK, 'center');
    text(ctx, 'Grab corn for points · pumpkin pie restores a life · P pauses · M mutes', 640, 478, 20, INK, 'center');
    // Turkey and farmer posing at the sides, clear of the text.
    drawTurkey({ x: 130, y: GROUND_Y - TURKEY.height, grounded: true, runPhase: 1.2, hidden: false }, false);
    drawFarmer({ x: 1060, y: GROUND_Y - FARMER.height, phase: 1.2 }, 'chase');
    text(ctx, '“Come back here, dinner!”', 1255, GROUND_Y - 170, 20, '#fff', 'right');
    if (best > 0) text(ctx, `BEST SCORE: ${Math.floor(best)}`, 640, 560, 26, '#ffd23c', 'center');
    text(ctx, 'A completely original Thanksgiving chase — no turkeys were harmed.', 640, 690, 16, 'rgba(255,243,214,0.8)', 'center');
  }

  function drawEnd(state, best, escaped) {
    drawSky(escaped ? 0 : 1, state.distance);
    drawBackdrop(escaped ? 0 : 1, state.distance);
    ctx.fillStyle = 'rgba(43,26,18,0.82)';
    roundRect(ctx, 280, 110, 720, 420, 22);
    ctx.fill();
    ctx.strokeStyle = escaped ? '#7a9e4f' : '#ff5a3c';
    ctx.lineWidth = 5;
    roundRect(ctx, 280, 110, 720, 420, 22);
    ctx.stroke();
    if (escaped) {
      text(ctx, '🎉 ESCAPED!', 640, 210, 76, '#7ddc7d', 'center');
      text(ctx, 'The turkey made it to the forest!', 640, 262, 26, CREAM, 'center');
      text(ctx, 'No Thanksgiving dinner tonight — just a very smug turkey.', 640, 300, 22, '#ffb347', 'center');
    } else {
      text(ctx, '😱 CAUGHT!', 640, 210, 76, '#ff5a3c', 'center');
      text(ctx, state.caught ? 'The farmer got you. Dinner is served…' : 'Three strikes — the oven wins this time.', 640, 262, 26, CREAM, 'center');
      text(ctx, 'The turkey will be back. Turkeys always come back.', 640, 300, 22, '#ffb347', 'center');
    }
    text(ctx, `SCORE ${Math.floor(state.score)}    ·    DISTANCE ${Math.floor(state.distance)} m    ·    CORN ${state.cornEaten}`, 640, 400, 24, CREAM, 'center');
    text(ctx, `BEST ${Math.floor(Math.max(best, state.score))}`, 640, 440, 24, '#ffd23c', 'center');
    text(ctx, '▶  Press R or ENTER — or click — to run again', 640, 490, 28, '#fff', 'center');
    // Farmer and turkey pose outside the card, clear of the text.
    drawFarmer({ x: 120, y: GROUND_Y - FARMER.height, phase: 0.6 }, 'chase');
    drawTurkey({ x: 1070, y: GROUND_Y - TURKEY.height, grounded: true, runPhase: 0.6, hidden: false }, false);
  }

  function draw(state, screen, best, time) {
    ctx.clearRect(0, 0, VIEW.width, VIEW.height);
    if (screen === SCREEN_TITLE) {
      drawTitle(state, best);
      return;
    }
    if (screen === SCREEN_OVER || screen === SCREEN_ESCAPED) {
      drawEnd(state, best, screen === SCREEN_ESCAPED);
      return;
    }
    const stageIndex = state.stageIndex;
    ctx.save();
    if (state.flash > 0) {
      const mag = state.flash * 14;
      ctx.translate(Math.sin(time * 91) * mag, Math.cos(time * 113) * mag * 0.6);
    }
    drawSky(stageIndex, state.distance);
    drawBackdrop(stageIndex, state.distance);
    for (const hay of state.hides) drawHay(hay);
    for (const item of state.pickups) drawPickup(item);
    for (const item of state.obstacles) {
      if (item.kind === KIND_OVEN) drawOven(item, time);
      else if (item.kind === KIND_KNIFE) drawKnife(item);
      else if (item.kind === KIND_FENCE) {
        ctx.fillStyle = '#8a5a2e';
        ctx.fillRect(item.x, item.y, item.width, item.height);
        ctx.fillStyle = '#a1764a';
        ctx.fillRect(item.x - 4, item.y + 10, item.width + 8, 8);
        ctx.fillRect(item.x - 4, item.y + 40, item.width + 8, 8);
      } else if (item.kind === KIND_PUMPKIN) {
        ctx.fillStyle = '#d97b29';
        ctx.beginPath();
        ctx.ellipse(item.x + 31, item.y + 28, 30, 24, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#c15527';
        ctx.beginPath();
        ctx.ellipse(item.x + 31, item.y + 28, 18, 24, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#5d7d38';
        ctx.fillRect(item.x + 27, item.y - 8, 8, 12);
      }
    }
    // Particles.
    for (const p of state.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    // The farmer's line of sight: a red cone ahead of him while he hunts.
    if (state.farmer.mode !== 'search' && !state.turkey.hidden) {
      const fx = state.farmer.x + FARMER.width / 2;
      const fy = state.farmer.y + 40;
      const reach = Math.max(120, state.gap + 140);
      ctx.fillStyle = 'rgba(255,60,40,0.10)';
      ctx.beginPath();
      ctx.moveTo(fx, fy - 26);
      ctx.lineTo(fx + reach, fy - 90);
      ctx.lineTo(fx + reach, fy + 60);
      ctx.closePath();
      ctx.fill();
    }
    drawFarmer(state.farmer, state.farmer.mode);
    drawTurkey(state.turkey, state.turkey.hidden, time);
    drawHud(state, STAGES[state.stageIndex].label);
    if (screen === SCREEN_PAUSED) {
      ctx.fillStyle = 'rgba(43,26,18,0.7)';
      ctx.fillRect(0, 0, VIEW.width, VIEW.height);
      text(ctx, 'PAUSED', 640, 330, 72, CREAM, 'center');
      text(ctx, 'Press P or click to keep running', 640, 390, 26, '#ffb347', 'center');
    }
    ctx.restore();
  }

  return { draw };
}
