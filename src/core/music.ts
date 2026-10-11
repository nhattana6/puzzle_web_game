import type { Sound } from './sound';

/** Slow night-sky chords, low voices first; C major with its relatives so any pentatonic twinkle fits. */
export const CHORDS: readonly (readonly number[])[] = [
  [130.81, 196.0, 329.63, 493.88], // Cmaj7: C3 G3 E4 B4
  [110.0, 164.81, 261.63, 392.0], // Am7: A2 E3 C4 G4
  [87.31, 174.61, 220.0, 329.63], // Fmaj7: F2 F3 A3 E4
  [98.0, 146.83, 246.94, 293.66], // G: G2 D3 B3 D4
];
/** High C major pentatonic notes for the twinkling stars. */
export const TWINKLES: readonly number[] = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51];
export const CHORD_SECONDS = 8;
const LOOKAHEAD = 3;
const LEVEL = 0.55;

/**
 * Background music, generated live: soft pad chords that drift every few seconds,
 * with random high notes echoing like twinkling stars. Plays while music is on and
 * the game isn't muted; browsers only let it start after the first tap or key press.
 */
export class Music {
  enabled = true;
  private playing = false;
  private master: GainNode | null = null;
  private bus: AudioNode | null = null;
  private echo: AudioNode | null = null;
  private timer = 0;
  private nextChord = 0;
  private nextTwinkle = 0;
  private chord = 0;

  constructor(private readonly sound: Sound) {}

  /** Starts or stops to match the settings. Safe to call as often as needed. */
  update(): void {
    if (this.enabled && !this.sound.muted) this.start();
    else this.stop();
  }

  private start(): void {
    const ctx = this.sound.audioContext();
    if (!ctx || this.playing) return;
    this.playing = true;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, ctx.currentTime);
    master.gain.exponentialRampToValueAtTime(LEVEL, ctx.currentTime + 4);
    master.connect(ctx.destination);
    // Everything goes through a soft low-pass; twinkles also feed a long echo.
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = 2400;
    tone.connect(master);
    const delay = ctx.createDelay(2);
    delay.delayTime.value = 0.48;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.42;
    const wet = ctx.createGain();
    wet.gain.value = 0.5;
    delay.connect(feedback).connect(delay);
    delay.connect(wet).connect(tone);
    this.master = master;
    this.bus = tone;
    this.echo = delay;
    this.nextChord = ctx.currentTime + 0.1;
    this.nextTwinkle = ctx.currentTime + 2.5;
    this.schedule();
    this.timer = window.setInterval(() => this.schedule(), 500);
  }

  private stop(): void {
    if (!this.playing) return;
    this.playing = false;
    clearInterval(this.timer);
    const ctx = this.sound.audioContext();
    const master = this.master;
    this.master = this.bus = this.echo = null;
    if (!ctx || !master) return;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), ctx.currentTime);
    master.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
    window.setTimeout(() => master.disconnect(), 1400);
  }

  private schedule(): void {
    const ctx = this.sound.audioContext();
    if (!ctx || !this.playing) return;
    const until = ctx.currentTime + LOOKAHEAD;
    while (this.nextChord < until) {
      this.playChord(ctx, CHORDS[this.chord], this.nextChord);
      this.chord = (this.chord + 1) % CHORDS.length;
      this.nextChord += CHORD_SECONDS;
    }
    while (this.nextTwinkle < until) {
      this.playTwinkle(ctx, TWINKLES[Math.floor(Math.random() * TWINKLES.length)], this.nextTwinkle);
      this.nextTwinkle += 1.4 + Math.random() * 3.4;
    }
  }

  private playChord(ctx: AudioContext, notes: readonly number[], at: number): void {
    const end = at + CHORD_SECONDS + 2.5;
    for (const freq of notes) {
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.022, at + 2.5);
      gain.gain.setValueAtTime(0.022, at + CHORD_SECONDS - 0.5);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);
      if (this.bus) gain.connect(this.bus);
      // Two slightly detuned voices per note make the pad shimmer.
      for (const [type, cents] of [['sine', -5], ['triangle', 5]] as const) {
        const osc = ctx.createOscillator();
        osc.type = type;
        osc.frequency.value = freq;
        osc.detune.value = cents;
        osc.connect(gain);
        osc.start(at);
        osc.stop(end + 0.1);
      }
    }
  }

  private playTwinkle(ctx: AudioContext, freq: number, at: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.03, at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 2.4);
    osc.connect(gain);
    if (this.bus) gain.connect(this.bus);
    if (this.echo) gain.connect(this.echo);
    osc.start(at);
    osc.stop(at + 2.5);
  }
}
