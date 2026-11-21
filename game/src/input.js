// Keyboard and mouse input: movement keys, sneak, pause, mute and pebble tosses.
// The game listens on the window so clicks on the canvas and keys work together.

export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.sneak = false;
    this.clickQueue = [];
    this.onAnyKey = null;
    this.onPauseKey = null;
    this.onMuteKey = null;
    this.onConfirmKey = null;

    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      this.keys.add(e.code);
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.sneak = true;
      if (e.code === 'KeyP' || e.code === 'Escape') this.onPauseKey?.();
      if (e.code === 'KeyM') this.onMuteKey?.();
      if (e.code === 'Enter' || e.code === 'Space') this.onConfirmKey?.();
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
      this.onAnyKey?.();
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        this.sneak = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
      }
    });
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.sneak = false;
    });
    canvas.addEventListener('mousedown', (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
      const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
      this.clickQueue.push({ x, y });
      this.onAnyKey?.();
    });
  }

  /** Normalised movement vector from WASD / arrow keys. */
  moveVector() {
    let x = 0;
    let y = 0;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) y -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) y += 1;
    if (x !== 0 && y !== 0) {
      const inv = 1 / Math.hypot(x, y);
      x *= inv;
      y *= inv;
    }
    return { x, y };
  }

  /** True while the player holds R (restart the level). */
  get restartHeld() {
    return this.keys.has('KeyR');
  }

  /** Drain queued mouse clicks (pebble tosses). */
  drainClicks() {
    const clicks = this.clickQueue;
    this.clickQueue = [];
    return clicks;
  }
}
