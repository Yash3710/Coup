/**
 * SoundManager — synthesizes all game sounds using Web Audio API.
 * No external audio files required.
 */
class SoundManager {
  private ctx: AudioContext | null = null;
  private _volume = 0.5;
  private _muted = false;

  private getCtx(): AudioContext | null {
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext();
      } catch (err) {
        console.warn('AudioContext not supported or failed to create:', err);
        return null;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch((err) => console.warn('AudioContext resume failed:', err));
    }
    return this.ctx;
  }

  get volume() { return this._volume; }
  set volume(v: number) { this._volume = Math.max(0, Math.min(1, v)); }

  get muted() { return this._muted; }
  set muted(m: boolean) { this._muted = m; }

  private gain(ctx: AudioContext, v?: number): GainNode {
    const g = ctx.createGain();
    g.gain.value = (v ?? 1) * this._volume;
    g.connect(ctx.destination);
    return g;
  }

  private shouldPlay(): boolean {
    return !this._muted && this._volume > 0;
  }

  /** Metallic coin clink */
  coinClink() {
    if (!this.shouldPlay()) return;
    const ctx = this.getCtx();
    if (!ctx) return;
    if (!ctx) return;
    const now = ctx.currentTime;
    const g = this.gain(ctx, 0.3);
    g.gain.setValueAtTime(0.3 * this._volume, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(2500, now);
    osc.frequency.exponentialRampToValueAtTime(4000, now + 0.02);
    osc.frequency.exponentialRampToValueAtTime(1800, now + 0.15);
    osc.connect(g);
    osc.start(now);
    osc.stop(now + 0.15);

    // Second clink
    const g2 = this.gain(ctx, 0.2);
    g2.gain.setValueAtTime(0.2 * this._volume, now + 0.06);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(3200, now + 0.06);
    osc2.frequency.exponentialRampToValueAtTime(2200, now + 0.2);
    osc2.connect(g2);
    osc2.start(now + 0.06);
    osc2.stop(now + 0.2);
  }

  /** Card flip sound */
  cardFlip() {
    if (!this.shouldPlay()) return;
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const g = this.gain(ctx, 0.15);
    g.gain.setValueAtTime(0.15 * this._volume, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    // Noise-like burst for paper/card sound
    const bufferSize = ctx.sampleRate * 0.1;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 3000;
    filter.Q.value = 1;

    noise.connect(filter);
    filter.connect(g);
    noise.start(now);
    noise.stop(now + 0.1);
  }

  /** Shuffle cards */
  shuffle() {
    if (!this.shouldPlay()) return;
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    for (let i = 0; i < 4; i++) {
      const t = now + i * 0.08;
      const g = this.gain(ctx, 0.08);
      g.gain.setValueAtTime(0.08 * this._volume, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

      const bufferSize = ctx.sampleRate * 0.06;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let j = 0; j < bufferSize; j++) {
        data[j] = (Math.random() * 2 - 1) * Math.exp(-j / (bufferSize * 0.15));
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 2000 + i * 500;
      noise.connect(filter);
      filter.connect(g);
      noise.start(t);
      noise.stop(t + 0.06);
    }
  }

  /** Card reveal */
  reveal() {
    if (!this.shouldPlay()) return;
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const g = this.gain(ctx, 0.25);
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.25 * this._volume, now + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.4);
    osc.connect(g);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  /** Challenge dramatic sound */
  challenge() {
    if (!this.shouldPlay()) return;
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const g = this.gain(ctx, 0.3);
    g.gain.setValueAtTime(0.3 * this._volume, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.3);
    osc.connect(g);
    osc.start(now);
    osc.stop(now + 0.5);

    const osc2 = ctx.createOscillator();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(600, now);
    osc2.frequency.exponentialRampToValueAtTime(200, now + 0.4);
    const g2 = this.gain(ctx, 0.15);
    g2.gain.setValueAtTime(0.15 * this._volume, now);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc2.connect(g2);
    osc2.start(now);
    osc2.stop(now + 0.4);
  }

  /** Block sound */
  block() {
    if (!this.shouldPlay()) return;
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const g = this.gain(ctx, 0.2);
    g.gain.setValueAtTime(0.2 * this._volume, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.setValueAtTime(300, now + 0.1);
    osc.connect(g);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  /** Victory fanfare */
  victory() {
    if (!this.shouldPlay()) return;
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6

    notes.forEach((freq, i) => {
      const t = now + i * 0.2;
      const g = this.gain(ctx, 0.25);
      g.gain.setValueAtTime(0.25 * this._volume, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(g);
      osc.start(t);
      osc.stop(t + 0.4);

      // Harmony
      const osc2 = ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.value = freq * 1.5;
      const g2 = this.gain(ctx, 0.1);
      g2.gain.setValueAtTime(0.1 * this._volume, t);
      g2.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc2.connect(g2);
      osc2.start(t);
      osc2.stop(t + 0.35);
    });
  }

  /** Defeat sound */
  defeat() {
    if (!this.shouldPlay()) return;
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [400, 350, 300, 200];

    notes.forEach((freq, i) => {
      const t = now + i * 0.25;
      const g = this.gain(ctx, 0.2);
      g.gain.setValueAtTime(0.2 * this._volume, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(g);
      osc.start(t);
      osc.stop(t + 0.5);
    });
  }

  /** Timer tick */
  timerTick() {
    if (!this.shouldPlay()) return;
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const g = this.gain(ctx, 0.1);
    g.gain.setValueAtTime(0.1 * this._volume, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 1000;
    osc.connect(g);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  /** Hover sound */
  hover() {
    if (!this.shouldPlay()) return;
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const g = this.gain(ctx, 0.05);
    g.gain.setValueAtTime(0.05 * this._volume, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 2000;
    osc.connect(g);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  /** Click sound */
  click() {
    if (!this.shouldPlay()) return;
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const g = this.gain(ctx, 0.15);
    g.gain.setValueAtTime(0.15 * this._volume, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);
    osc.connect(g);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  /** Deal card sound */
  deal() {
    if (!this.shouldPlay()) return;
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const g = this.gain(ctx, 0.12);
    g.gain.setValueAtTime(0.12 * this._volume, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    const bufferSize = ctx.sampleRate * 0.12;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.08));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 4000;
    filter.Q.value = 2;

    noise.connect(filter);
    filter.connect(g);
    noise.start(now);
    noise.stop(now + 0.12);
  }

  /** Explosion sound (for Coup action) */
  explosion() {
    if (!this.shouldPlay()) return;
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const g = this.gain(ctx, 0.35);
    g.gain.setValueAtTime(0.35 * this._volume, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    // Noise burst
    const bufferSize = ctx.sampleRate * 0.6;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + 0.6);

    noise.connect(filter);
    filter.connect(g);
    noise.start(now);
    noise.stop(now + 0.6);

    // Sub bass
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.5);
    const g2 = this.gain(ctx, 0.3);
    g2.gain.setValueAtTime(0.3 * this._volume, now);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.connect(g2);
    osc.start(now);
    osc.stop(now + 0.5);
  }

  /** Laser sound (for Assassinate) */
  laser() {
    if (!this.shouldPlay()) return;
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const g = this.gain(ctx, 0.2);
    g.gain.setValueAtTime(0.2 * this._volume, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(2000, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);
    osc.connect(g);
    osc.start(now);
    osc.stop(now + 0.3);
  }
}

export const soundManager = new SoundManager();
