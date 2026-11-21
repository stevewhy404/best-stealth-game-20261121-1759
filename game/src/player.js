// The player: Wren, a thief in a hooded cloak. Walk, sneak, toss pebbles to
// lure guards away, and gather the moon-lantern relics without being caught.

import { TILE, TUNE } from './config.js';

export class Player {
  constructor(level) {
    this.level = level;
    this.reset();
  }

  reset() {
    this.x = this.level.playerStart.x;
    this.y = this.level.playerStart.y;
    this.radius = 12;
    this.facing = 0;
    this.sneaking = false;
    this.running = false;
    this.moving = false;
    this.pebbles = TUNE.pebbleCount;
    this.stepTimer = 0;
    this.hidden = false;
    this.noisePulse = 0;
    this.noiseX = 0;
    this.noiseY = 0;
  }

  update(dt, input, sounds, onPebble) {
    const vec = input.moveVector();
    this.moving = vec.x !== 0 || vec.y !== 0;
    this.sneaking = input.sneak;
    this.running = this.moving && !this.sneaking;
    const speed = this.sneaking ? TUNE.sneakSpeed : TUNE.walkSpeed;
    if (this.moving) {
      const moved = this.level.moveCircle(this.x, this.y, this.radius, vec.x * speed * dt, vec.y * speed * dt);
      this.x = moved.x;
      this.y = moved.y;
      this.facing = Math.atan2(vec.y, vec.x);
      this.stepTimer -= dt;
      if (this.stepTimer <= 0) {
        this.stepTimer = this.sneaking ? 0.62 : 0.38;
        sounds.footstep(this.running, 0);
      }
      if (this.running) {
        this.noisePulse = 0.25;
        this.noiseX = this.x;
        this.noiseY = this.y;
      }
    }
    this.noisePulse = Math.max(0, this.noisePulse - dt);
    this.hidden = this.level.inBush(this.x, this.y);

    for (const click of input.drainClicks()) {
      this.tossPebble(click.x, click.y, onPebble);
    }
  }

  /** Toss a pebble toward a clicked point: guards nearby go to look at it. */
  tossPebble(tx, ty, onPebble) {
    if (this.pebbles <= 0) return;
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > TUNE.pebbleRange || dist < 10) return;
    this.pebbles -= 1;
    const landing = { x: this.x + (dx / dist) * dist, y: this.y + (dy / dist) * dist };
    onPebble?.(landing);
  }

  /** Pick up any relic within reach; returns the relic taken, or null. */
  tryPickupRelic() {
    for (const relic of this.level.relics) {
      if (relic.taken) continue;
      if (Math.hypot(relic.x - this.x, relic.y - this.y) < TILE * 0.75) {
        relic.taken = true;
        return relic;
      }
    }
    return null;
  }

  atExit() {
    const exit = this.level.exit;
    if (!exit || this.level.relicsLeft() > 0) return false;
    return Math.hypot(exit.x - this.x, exit.y - this.y) < TILE * 0.8;
  }
}
