// Canvas rendering: the gallery floor, walls and cover, lamp light, vision cones,
// the thief and the wardens, the darkness that hides the player, HUD and menus.

import { TILE, TUNE, VIEW_W, VIEW_H } from './config.js';
import { GUARD_STATE } from './guard.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.lightCanvas = document.createElement('canvas');
    this.lightCanvas.width = VIEW_W;
    this.lightCanvas.height = VIEW_H;
    this.time = 0;
  }

  draw(state) {
    const ctx = this.ctx;
    this.time += 0.016;
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    this.drawFloor(ctx, state.level);
    this.drawExit(ctx, state.level, state.relicsLeft === 0);
    this.drawRelics(ctx, state.level);
    this.drawCover(ctx, state.level);
    this.drawLamps(ctx, state.level);
    this.drawPebble(ctx, state);
    this.drawGuards(ctx, state);
    this.drawPlayer(ctx, state);
    this.drawLighting(ctx, state);
    this.drawCones(ctx, state);
    this.drawNoise(ctx, state);
    this.drawHud(ctx, state);
    if (state.screen === 'title') this.drawTitle(ctx, state);
    else if (state.screen === 'paused') this.drawPaused(ctx, state);
    else if (state.screen === 'caught') this.drawCaught(ctx, state);
    else if (state.screen === 'levelComplete') this.drawLevelComplete(ctx, state);
    else if (state.screen === 'victory') this.drawVictory(ctx, state);
  }

  drawFloor(ctx, level) {
    for (let r = 0; r < level.rows; r++) {
      for (let c = 0; c < level.cols; c++) {
        const ch = level.def.map[r]?.[c] ?? '#';
        const x = c * TILE;
        const y = r * TILE;
        if (ch === '#') {
          ctx.fillStyle = '#232838';
          ctx.fillRect(x, y, TILE, TILE);
          ctx.fillStyle = '#2e3448';
          ctx.fillRect(x, y, TILE, 5);
          ctx.fillStyle = '#1a1e2c';
          ctx.fillRect(x, y + TILE - 4, TILE, 4);
        } else {
          const odd = (c + r) % 2 === 0;
          ctx.fillStyle = odd ? '#2b2f42' : '#272b3c';
          ctx.fillRect(x, y, TILE, TILE);
          ctx.fillStyle = 'rgba(255,255,255,0.03)';
          ctx.fillRect(x + 3, y + 3, TILE - 6, TILE - 6);
        }
        if (ch === 'B') {
          ctx.fillStyle = '#1d3a24';
          ctx.beginPath();
          ctx.arc(x + 12, y + 14, 13, 0, Math.PI * 2);
          ctx.arc(x + 27, y + 12, 14, 0, Math.PI * 2);
          ctx.arc(x + 20, y + 28, 13, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#2c5a34';
          ctx.beginPath();
          ctx.arc(x + 14, y + 12, 6, 0, Math.PI * 2);
          ctx.arc(x + 26, y + 24, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  drawExit(ctx, level, open) {
    const exit = level.exit;
    if (!exit) return;
    const x = exit.x - TILE / 2;
    const y = exit.y - TILE / 2;
    ctx.fillStyle = open ? '#1f7a4d' : '#3a4152';
    ctx.fillRect(x + 4, y, TILE - 8, TILE);
    ctx.fillStyle = open ? '#37d67a' : '#565e73';
    ctx.fillRect(x + 8, y + 6, TILE - 16, TILE - 12);
    ctx.fillStyle = open ? '#d8ffe9' : '#8b93a7';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(open ? 'EXIT' : 'LOCK', exit.x, exit.y);
    if (open) {
      const pulse = 0.5 + Math.sin(this.time * 3) * 0.2;
      ctx.fillStyle = `rgba(55, 214, 122, ${pulse * 0.35})`;
      ctx.fillRect(x - 4, y - 4, TILE + 8, TILE + 8);
    }
  }

  drawRelics(ctx, level) {
    for (const relic of level.relics) {
      if (relic.taken) continue;
      const bob = Math.sin(this.time * 2 + relic.x) * 3;
      const glow = 0.5 + Math.sin(this.time * 2.5 + relic.y) * 0.2;
      const grad = ctx.createRadialGradient(relic.x, relic.y + bob, 2, relic.x, relic.y + bob, 34);
      grad.addColorStop(0, `rgba(255, 214, 120, ${0.55 * glow})`);
      grad.addColorStop(1, 'rgba(255, 214, 120, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(relic.x, relic.y + bob, 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd678';
      ctx.beginPath();
      ctx.arc(relic.x, relic.y + bob, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff3c4';
      ctx.beginPath();
      ctx.arc(relic.x, relic.y + bob, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#b98a2e';
      ctx.lineWidth = 2;
      ctx.strokeRect(relic.x - 12, relic.y + bob - 12, 24, 24);
    }
  }

  drawCover(ctx, level) {
    for (const key of level.crates) {
      const [c, r] = key.split(',').map(Number);
      const x = c * TILE;
      const y = r * TILE;
      ctx.fillStyle = '#6b4a26';
      ctx.fillRect(x + 3, y + 3, TILE - 6, TILE - 6);
      ctx.fillStyle = '#8a5f31';
      ctx.fillRect(x + 6, y + 6, TILE - 12, TILE - 12);
      ctx.strokeStyle = '#4a3016';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 3, y + 3, TILE - 6, TILE - 6);
      ctx.beginPath();
      ctx.moveTo(x + 3, y + 3);
      ctx.lineTo(x + TILE - 3, y + TILE - 3);
      ctx.moveTo(x + TILE - 3, y + 3);
      ctx.lineTo(x + 3, y + TILE - 3);
      ctx.stroke();
    }
  }

  drawLamps(ctx, level) {
    for (const lamp of level.lamps) {
      const grad = ctx.createRadialGradient(lamp.x, lamp.y, 4, lamp.x, lamp.y, lamp.radius);
      grad.addColorStop(0, 'rgba(255, 196, 110, 0.5)');
      grad.addColorStop(1, 'rgba(255, 196, 110, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(lamp.x, lamp.y, lamp.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3a2c14';
      ctx.beginPath();
      ctx.arc(lamp.x, lamp.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd27a';
      ctx.beginPath();
      ctx.arc(lamp.x, lamp.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawPebble(ctx, state) {
    const pebble = state.pebble;
    if (!pebble) return;
    const age = (performance.now() - pebble.at) / 1000;
    if (age > 6) return;
    ctx.strokeStyle = `rgba(255, 220, 130, ${1 - age / 6})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(pebble.x, pebble.y, 6 + age * 22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#cfd6e4';
    ctx.beginPath();
    ctx.arc(pebble.x, pebble.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  drawGuards(ctx, state) {
    for (const guard of state.guards) {
      const alerted = guard.alerted;
      const suspicious = guard.suspicious;
      ctx.fillStyle = alerted ? '#e5484d' : suspicious ? '#f5a524' : '#c94f5e';
      ctx.beginPath();
      ctx.arc(guard.x, guard.y, guard.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f3d9a4';
      ctx.beginPath();
      ctx.arc(guard.x, guard.y, 5, 0, Math.PI * 2);
      ctx.fill();
      // Facing tick so the guard's direction reads at a glance.
      ctx.strokeStyle = '#f3d9a4';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(guard.x, guard.y);
      ctx.lineTo(guard.x + Math.cos(guard.facing) * 18, guard.y + Math.sin(guard.facing) * 18);
      ctx.stroke();
      // Detection meter arc above the guard.
      if (guard.detection > 0.02) {
        ctx.strokeStyle = 'rgba(0,0,0,0.6)';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(guard.x, guard.y - 20, 9, -Math.PI / 2, Math.PI * 1.5);
        ctx.stroke();
        ctx.strokeStyle = guard.detection >= TUNE.alarmedAt ? '#ff3b30' : '#ffc531';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(guard.x, guard.y - 20, 9, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, guard.detection));
        ctx.stroke();
      }
      // "!" when chasing, "?" when suspicious.
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (alerted) {
        ctx.fillStyle = '#ff3b30';
        ctx.fillText('!', guard.x, guard.y - 36);
      } else if (suspicious) {
        ctx.fillStyle = '#ffc531';
        ctx.fillText('?', guard.x, guard.y - 36);
      }
    }
  }

  drawPlayer(ctx, state) {
    const p = state.player;
    const hidden = p.hidden;
    ctx.save();
    if (hidden) ctx.globalAlpha = 0.55;
    // Lantern glow around the thief.
    const grad = ctx.createRadialGradient(p.x, p.y, 4, p.x, p.y, 60);
    grad.addColorStop(0, 'rgba(140, 190, 255, 0.28)');
    grad.addColorStop(1, 'rgba(140, 190, 255, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 60, 0, Math.PI * 2);
    ctx.fill();
    // Hooded cloak: a circle with a pointed hood toward the facing.
    ctx.fillStyle = p.sneaking ? '#4a6fa5' : '#5b7fb8';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2c3e5e';
    ctx.beginPath();
    ctx.moveTo(p.x + Math.cos(p.facing) * 16, p.y + Math.sin(p.facing) * 16);
    ctx.lineTo(p.x + Math.cos(p.facing + 2.4) * 10, p.y + Math.sin(p.facing + 2.4) * 10);
    ctx.lineTo(p.x + Math.cos(p.facing - 2.4) * 10, p.y + Math.sin(p.facing - 2.4) * 10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffe9b0';
    ctx.beginPath();
    ctx.arc(p.x + Math.cos(p.facing) * 4, p.y + Math.sin(p.facing) * 4, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (hidden) {
      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#9fe8a8';
      ctx.textAlign = 'center';
      ctx.fillText('HIDDEN', p.x, p.y - 22);
    }
  }

  drawLighting(ctx, state) {
    const light = this.lightCanvas.getContext('2d');
    light.clearRect(0, 0, VIEW_W, VIEW_H);
    light.globalCompositeOperation = 'source-over';
    light.fillStyle = 'rgba(4, 7, 18, 0.64)';
    light.fillRect(0, 0, VIEW_W, VIEW_H);
    light.globalCompositeOperation = 'destination-out';
    const punch = (x, y, radius, strength) => {
      const grad = light.createRadialGradient(x, y, 4, x, y, radius);
      grad.addColorStop(0, `rgba(0,0,0,${strength})`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      light.fillStyle = grad;
      light.beginPath();
      light.arc(x, y, radius, 0, Math.PI * 2);
      light.fill();
    };
    punch(state.player.x, state.player.y, 175, 0.95);
    for (const lamp of state.level.lamps) punch(lamp.x, lamp.y, lamp.radius, 0.9);
    for (const relic of state.level.relics) {
      if (!relic.taken) punch(relic.x, relic.y, 95, 0.85);
    }
    if (state.level.exit && state.relicsLeft === 0) punch(state.level.exit.x, state.level.exit.y, 95, 0.85);
    ctx.drawImage(this.lightCanvas, 0, 0);
  }

  drawCones(ctx, state) {
    for (const guard of state.guards) {
      const alerted = guard.alerted;
      const color = alerted ? '255, 59, 48' : guard.suspicious ? '255, 197, 49' : '255, 214, 110';
      const alpha = alerted ? 0.34 : 0.22;
      ctx.fillStyle = `rgba(${color}, ${alpha})`;
      ctx.beginPath();
      ctx.moveTo(guard.x, guard.y);
      ctx.arc(guard.x, guard.y, TUNE.coneRange, guard.facing - TUNE.coneHalfAngle, guard.facing + TUNE.coneHalfAngle);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = `rgba(${color}, 0.5)`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  drawNoise(ctx, state) {
    const p = state.player;
    if (p.noisePulse > 0) {
      ctx.strokeStyle = `rgba(255, 255, 255, ${p.noisePulse * 2.2})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.noiseX, p.noiseY, TUNE.runNoiseRadius * (1 - p.noisePulse), 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  drawHud(ctx, state) {
    ctx.fillStyle = 'rgba(5, 8, 18, 0.78)';
    ctx.fillRect(0, 0, VIEW_W, 34);
    ctx.fillStyle = '#e8ecf4';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Level ${state.levelIndex + 1}: ${state.level.name}`, 12, 17);
    const relicText = `Relics ${state.level.relicsTotal - state.relicsLeft}/${state.level.relicsTotal}`;
    ctx.fillText(relicText, 300, 17);
    ctx.fillText(`Pebbles ${state.player.pebbles}`, 420, 17);
    ctx.fillText(`Time ${Math.floor(state.elapsed)}s`, 540, 17);
    // The eye: the highest detection across guards, green to red.
    const maxDetect = Math.max(0, ...state.guards.map((g) => g.detection));
    const eyeColor = maxDetect >= TUNE.alarmedAt ? '#ff3b30' : maxDetect >= TUNE.suspiciousAt ? '#ffc531' : '#37d67a';
    ctx.fillStyle = eyeColor;
    ctx.beginPath();
    ctx.arc(700, 17, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0a0d16';
    ctx.beginPath();
    ctx.arc(700, 17, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8ecf4';
    ctx.fillText(maxDetect >= TUNE.alarmedAt ? 'SPOTTED!' : maxDetect >= TUNE.suspiciousAt ? 'Suspicious' : 'Unseen', 716, 17);
    ctx.fillText(state.muted ? 'M: sound off' : 'M: sound on', 860, 17);

    ctx.fillStyle = 'rgba(5, 8, 18, 0.7)';
    ctx.fillRect(0, VIEW_H - 26, VIEW_W, 26);
    ctx.fillStyle = '#aab3c5';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      'WASD / arrows move · Shift sneak · Click toss a pebble · P pause · R restart · M mute',
      VIEW_W / 2,
      VIEW_H - 13,
    );
  }

  overlayPanel(ctx, title, lines, accent) {
    ctx.fillStyle = 'rgba(4, 6, 14, 0.82)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = accent;
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, VIEW_W / 2, 150);
    ctx.fillStyle = '#e8ecf4';
    ctx.font = '17px sans-serif';
    lines.forEach((line, i) => {
      ctx.fillText(line, VIEW_W / 2, 220 + i * 30);
    });
  }

  drawTitle(ctx, state) {
    this.overlayPanel(
      ctx,
      'THE QUIET GALLERY',
      [
        'A stealth game: steal the moon-lantern relics and slip out unseen.',
        `${state.level.name} — ${state.level.intro}`,
        '',
        'Stay out of the golden vision cones. Crouch behind crates,',
        'vanish inside the tall ferns, and toss pebbles to lure guards away.',
        'Running is loud. Lamp light makes you easy to spot.',
        '',
        'Press Enter or click to begin.',
      ],
      '#ffd678',
    );
  }

  drawPaused(ctx) {
    this.overlayPanel(ctx, 'PAUSED', ['Take a breath. The wardens wait.', '', 'Press P to keep sneaking.'], '#8fb4ff');
  }

  drawCaught(ctx, state) {
    this.overlayPanel(
      ctx,
      'CAUGHT!',
      [
        'A warden laid hands on Wren in the lamplight.',
        `Relics taken this level: ${state.level.relicsTotal - state.relicsLeft} of ${state.level.relicsTotal}.`,
        '',
        'Press R to try the level again.',
      ],
      '#ff5b5b',
    );
  }

  drawLevelComplete(ctx, state) {
    this.overlayPanel(
      ctx,
      'GALLERY CLEARED',
      [
        `${state.level.name} — every relic safe in Wren's pack.`,
        `Time: ${Math.floor(state.elapsed)}s · Score so far: ${state.score}.`,
        '',
        'Press Enter for the next gallery.',
      ],
      '#37d67a',
    );
  }

  drawVictory(ctx, state) {
    this.overlayPanel(
      ctx,
      'THE QUIET GALLERY',
      [
        'Every relic stolen. Every warden left wondering.',
        `Final score: ${state.score} · Total time: ${Math.floor(state.elapsed)}s.`,
        state.ghost ? 'Ghost run — never once spotted. A perfect shadow.' : 'Spotted along the way — but never caught for long.',
        '',
        'Press Enter to play again.',
      ],
      '#ffd678',
    );
  }
}
