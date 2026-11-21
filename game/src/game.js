// Game state machine: title, playing, paused, caught, level complete, victory.
// Owns the level, the player, the guards and the score; the renderer draws it.
// A ?shot=1..4 query poses a frozen scene so screenshots show the game at its best.

import { LEVELS, VIEW_W, VIEW_H } from './config.js';
import { Level } from './level.js';
import { Player } from './player.js';
import { Guard } from './guard.js';
import { Renderer } from './render.js';
import { SoundBank } from './audio.js';
import { Input } from './input.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.canvas.width = VIEW_W;
    this.canvas.height = VIEW_H;
    this.renderer = new Renderer(canvas);
    this.sounds = new SoundBank();
    this.input = new Input(canvas);
    this.levelIndex = 0;
    this.score = 0;
    this.elapsed = 0;
    this.levelElapsed = 0;
    this.ghost = true;
    this.muted = false;
    this.screen = 'title';
    this.pebble = null;
    this.frozen = false;
    this.loadLevel(0);

    this.input.onAnyKey = () => this.sounds.unlock();
    this.input.onConfirmKey = () => this.confirm();
    this.input.onPauseKey = () => this.togglePause();
    this.input.onMuteKey = () => {
      this.muted = this.sounds.toggleMute();
    };

    const params = new URLSearchParams(window.location.search);
    const shot = Number(params.get('shot') || 0);
    if (shot >= 1 && shot <= 4) this.applyShot(shot);

    this.lastTime = performance.now();
    const loop = (now) => {
      const dt = Math.min(0.05, (now - this.lastTime) / 1000);
      this.lastTime = now;
      if (!this.frozen) this.update(dt);
      this.renderer.draw(this.state());
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  state() {
    return {
      screen: this.screen,
      level: this.level,
      levelIndex: this.levelIndex,
      player: this.player,
      guards: this.guards,
      pebble: this.pebble,
      relicsLeft: this.level.relicsLeft(),
      elapsed: this.elapsed,
      score: this.score,
      ghost: this.ghost,
      muted: this.muted,
    };
  }

  loadLevel(index) {
    this.levelIndex = index;
    this.level = new Level(LEVELS[index]);
    this.player = new Player(this.level);
    this.guards = this.level.def.guards.map((def) => new Guard(def, this.level));
    this.pebble = null;
    this.levelElapsed = 0;
  }

  restartLevel() {
    this.loadLevel(this.levelIndex);
    this.screen = 'playing';
  }

  restartGame() {
    this.score = 0;
    this.elapsed = 0;
    this.ghost = true;
    this.loadLevel(0);
    this.screen = 'title';
  }

  confirm() {
    this.sounds.unlock();
    if (this.screen === 'title') this.screen = 'playing';
    else if (this.screen === 'levelComplete') {
      if (this.levelIndex + 1 >= LEVELS.length) {
        this.screen = 'victory';
      } else {
        this.loadLevel(this.levelIndex + 1);
        this.screen = 'playing';
      }
    } else if (this.screen === 'victory') this.restartGame();
    else if (this.screen === 'caught') this.restartLevel();
  }

  togglePause() {
    if (this.screen === 'playing') this.screen = 'paused';
    else if (this.screen === 'paused') this.screen = 'playing';
  }

  update(dt) {
    if (this.screen === 'playing') {
      this.elapsed += dt;
      this.levelElapsed += dt;
      this.player.update(dt, this.input, this.sounds, (landing) => this.tossPebble(landing));
      for (const guard of this.guards) {
        guard.update(dt, this.player, this.sounds);
        if (guard.alerted) this.ghost = false;
      }
      // Running is loud: guards in earshot turn toward the noise.
      if (this.player.running && this.player.moving) {
        for (const guard of this.guards) {
          guard.hearNoise(this.player.x, this.player.y, 135);
        }
      }
      const relic = this.player.tryPickupRelic();
      if (relic) {
        this.score += 150;
        this.sounds.relicChime();
        document.getElementById('status').textContent = `Relic taken. ${this.level.relicsLeft()} left.`;
      }
      for (const guard of this.guards) {
        if (guard.alerted && Math.hypot(guard.x - this.player.x, guard.y - this.player.y) < 24) {
          this.screen = 'caught';
          this.sounds.caught();
          return;
        }
      }
      if (this.player.atExit()) {
        const timeBonus = Math.max(0, 600 - Math.floor(this.levelElapsed) * 5);
        this.score += 1000 + timeBonus + (this.ghost ? 250 : 0);
        if (this.levelIndex + 1 >= LEVELS.length) this.screen = 'victory';
        else this.screen = 'levelComplete';
      }
    }
    if (this.screen === 'playing' && this.input.restartHeld) this.restartLevel();
    if (this.screen === 'caught' && this.input.restartHeld) this.restartLevel();
  }

  tossPebble(landing) {
    this.pebble = { x: landing.x, y: landing.y, at: performance.now() };
    const pan = Math.max(-1, Math.min(1, (landing.x - this.player.x) / 400));
    this.sounds.pebbleTick(pan);
    for (const guard of this.guards) guard.hearNoise(landing.x, landing.y, 230);
  }

  // -- screenshot poses: frozen scenes, one per shot -------------------------
  applyShot(shot) {
    this.frozen = true;
    if (shot === 1) {
      // Cover: Wren sneaking behind a crate as a warden's cone sweeps past.
      this.screen = 'playing';
      this.player.x = 9.5 * 40;
      this.player.y = 7.5 * 40;
      this.player.sneaking = true;
      this.player.facing = Math.PI;
      const guard = this.guards[0];
      guard.x = 16.5 * 40;
      guard.y = 4.5 * 40;
      guard.facing = Math.PI;
      guard.state = 'patrol';
      const guard2 = this.guards[1];
      guard2.x = 19.5 * 40;
      guard2.y = 10.5 * 40;
      guard2.facing = -Math.PI / 2;
    } else if (shot === 2) {
      // Hidden in the ferns while a warden grows suspicious nearby.
      this.loadLevel(1);
      this.screen = 'playing';
      this.player.x = 3.5 * 40;
      this.player.y = 4.5 * 40;
      this.player.sneaking = true;
      this.player.facing = 0;
      this.player.hidden = true;
      const guard = this.guards[0];
      guard.x = 15.5 * 40;
      guard.y = 4.5 * 40;
      guard.facing = Math.PI;
      guard.detection = 0.55;
      guard.state = 'suspicious';
      guard.investigatePoint = { x: 5.5 * 40, y: 4.5 * 40 };
      this.pebble = { x: 7.5 * 40, y: 5.5 * 40, at: performance.now() };
    } else if (shot === 3) {
      // Spotted: a warden gives chase as Wren runs for the exit, relics in hand.
      this.screen = 'playing';
      this.level.relics[0].taken = true;
      this.level.relics[1].taken = true;
      this.player.x = 18.5 * 40;
      this.player.y = 12.5 * 40;
      this.player.facing = 0;
      this.player.running = true;
      const guard = this.guards[1];
      guard.x = 16.5 * 40;
      guard.y = 11.5 * 40;
      guard.facing = 0.4;
      guard.detection = 1.1;
      guard.state = 'chase';
      guard.lastSeen = { x: this.player.x, y: this.player.y };
    } else if (shot === 4) {
      // Victory: every relic stolen, never once spotted.
      this.loadLevel(2);
      for (const relic of this.level.relics) relic.taken = true;
      this.score = 2450;
      this.elapsed = 187;
      this.ghost = true;
      this.screen = 'victory';
    }
  }
}
