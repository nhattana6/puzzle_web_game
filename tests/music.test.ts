import { describe, expect, it } from 'vitest';
import { CHORDS, Music, TWINKLES } from '../src/core/music';
import { Sound } from '../src/core/sound';

describe('background music', () => {
  it('does nothing, without throwing, where there is no audio', () => {
    const sound = new Sound();
    const music = new Music(sound);
    expect(() => music.update()).not.toThrow();
    sound.muted = true;
    expect(() => music.update()).not.toThrow();
  });

  it('keeps the pad low and the twinkles high', () => {
    for (const chord of CHORDS) expect(Math.max(...chord)).toBeLessThan(500);
    for (const f of TWINKLES) expect(f).toBeGreaterThan(500);
  });
});
