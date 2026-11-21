// Synthesised sound: footsteps, pebble ticks, relic chimes, alarm stings.
// Everything is generated with the Web Audio API; the game ships no audio files.

export class SoundBank {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.master = null;
  }

  /** Create the audio context on the first user gesture. Safe to call repeatedly. */
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
      this.startAmbience();
    } catch {
      this.ctx = null;
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.5;
    return this.muted;
  }

  /** A low, slow room tone so the gallery never sounds dead. */
  startAmbience() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 52;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.035;
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 0.015;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start();
    lfo.start();
  }

  /** A short filtered noise burst: a footstep. Louder and sharper when running. */
  footstep(running, pan = 0) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const dur = 0.07;
    const buffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = running ? 900 : 420;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(running ? 0.22 : 0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    const panner = this.ctx.createStereoPanner();
    panner.pan.value = Math.max(-1, Math.min(1, pan));
    src.connect(filter);
    filter.connect(gain);
    gain.connect(panner);
    panner.connect(this.master);
    src.start(t);
  }

  /** A bright tick when a pebble lands. */
  pebbleTick(pan = 0) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    for (const [freq, at, vol] of [[2400, 0, 0.16], [1700, 0.07, 0.12]]) {
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(vol, t + at);
      gain.gain.exponentialRampToValueAtTime(0.001, t + at + 0.09);
      const panner = this.ctx.createStereoPanner();
      panner.pan.value = Math.max(-1, Math.min(1, pan));
      osc.connect(gain);
      gain.connect(panner);
      panner.connect(this.master);
      osc.start(t + at);
      osc.stop(t + at + 0.1);
    }
  }

  /** A rising chime when a relic is taken. */
  relicChime() {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, t + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.18, t + i * 0.07 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.07 + 0.5);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(t + i * 0.07);
      osc.stop(t + i * 0.07 + 0.55);
    });
  }

  /** A two-note alarm when a guard spots the player. */
  alarm() {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    for (const [freq, at] of [[392, 0], [311, 0.14]]) {
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1200;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.14, t + at);
      gain.gain.exponentialRampToValueAtTime(0.001, t + at + 0.28);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      osc.start(t + at);
      osc.stop(t + at + 0.3);
    }
  }

  /** A soft questioning blip when a guard grows suspicious. */
  suspicious() {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, t);
    osc.frequency.setValueAtTime(880, t + 0.09);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.09, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t);
    osc.stop(t + 0.22);
  }

  /** A low sting when the player is caught. */
  caught() {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    [220, 207.65, 196].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.2, t + i * 0.16);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.16 + 0.4);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(t + i * 0.16);
      osc.stop(t + i * 0.16 + 0.42);
    });
  }
}
