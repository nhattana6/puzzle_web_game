import { glyph, type GlyphId } from './glyphs';

/** Tiny WebAudio synth: every sound is generated, so the game ships no audio files. */
export class Sound {
  /** Mutes everything: effects and music. */
  muted = false;
  private ctx: AudioContext | null = null;

  /** The shared audio context (also used by the music), created and resumed on demand; null where audio is unavailable. */
  audioContext(): AudioContext | null {
    try {
      this.ctx ??= new AudioContext();
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return this.ctx;
    } catch {
      return null;
    }
  }

  /** Context for sound effects: none while muted. */
  private context(): AudioContext | null {
    return this.muted ? null : this.audioContext();
  }

  /** Pauses all audio while the page is hidden, and picks up again when it returns. */
  setHidden(hidden: boolean): void {
    if (!this.ctx) return;
    void (hidden ? this.ctx.suspend() : this.ctx.resume()).catch(() => undefined);
  }

  private tone(freq: number, duration: number, opts: { type?: OscillatorType; gain?: number; delay?: number; slideTo?: number } = {}): void {
    const ctx = this.context();
    if (!ctx) return;
    const start = ctx.currentTime + (opts.delay ?? 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = opts.type ?? 'triangle';
    osc.frequency.setValueAtTime(freq, start);
    if (opts.slideTo) osc.frequency.exponentialRampToValueAtTime(opts.slideTo, start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(opts.gain ?? 0.18, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  }

  /** Paper rustle: a short burst of filtered noise. */
  paper(): void {
    const ctx = this.context();
    if (!ctx) return;
    const length = Math.floor(ctx.sampleRate * 0.12);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    source.buffer = buffer;
    filter.type = 'bandpass';
    filter.frequency.value = 2600;
    gain.gain.value = 0.12;
    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start();
  }

  /** Wooden "mõ" knock. */
  knock(): void {
    this.tone(720, 0.09, { type: 'sine', gain: 0.25, slideTo: 380 });
  }

  /** A very short, quiet click: something small went past (a painted tooth passing its pointer). */
  tick(): void {
    this.tone(1900, 0.04, { type: 'square', gain: 0.035 });
  }

  /** A small high bell that matches none of the keypad's notes. */
  ding(): void {
    this.tone(2349, 0.55, { type: 'sine', gain: 0.07 });
    this.tone(3136, 0.35, { type: 'sine', gain: 0.04, delay: 0.03 });
  }

  note(id: GlyphId, delay = 0): void {
    this.tone(glyph(id).frequency, 0.6, { delay, gain: 0.16 });
  }

  /** Something lined up in the scene. */
  chime(): void {
    this.tone(1568, 0.9, { type: 'sine', gain: 0.08 });
    this.tone(2093, 1.1, { type: 'sine', gain: 0.05, delay: 0.08 });
  }

  wrong(): void {
    this.tone(196, 0.25, { type: 'sine', gain: 0.2 });
    this.tone(175, 0.35, { type: 'sine', gain: 0.18, delay: 0.14 });
  }

  /** Plays the answer as a melody, then resolves on the first note an octave up. */
  melody(ids: readonly GlyphId[]): void {
    ids.forEach((id, i) => this.note(id, i * 0.3));
    if (ids.length > 0) {
      this.tone(glyph(ids[0]).frequency * 2, 1.2, { delay: ids.length * 0.3, gain: 0.12 });
    }
  }
}
