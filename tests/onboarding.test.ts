import { describe, expect, it } from 'vitest';
import { CLOUDS_START, GLYPH_SPOTS, INTRO, INTRO_GLYPH, introPose, nightClouds } from '../src/puzzles/nightClouds';
import { SCENE_H } from '../src/core/scene';
import { INTRO_TIP, opensFirstLevel } from '../src/ui/chapters';

describe('first-run demonstration on level 1', () => {
  const [x, y] = CLOUDS_START[0];

  it('starts and ends with the cloud where the level put it, no finger showing and the slot empty', () => {
    for (const t of [0, INTRO.back[1], INTRO.rest - 0.01]) {
      const pose = introPose(t);
      expect(pose.cloud).toEqual([x, y]);
      expect(pose.slot).toBe(false);
    }
    expect(introPose(0).finger.opacity).toBe(0);
    expect(introPose(INTRO.fadeOut[1]).finger.opacity).toBe(0);
  });

  it('drags the cloud down off the window under a pressed finger that stays on the cloud', () => {
    const mid = introPose((INTRO.slide[0] + INTRO.slide[1]) / 2);
    expect(mid.cloud[1]).toBeGreaterThan(y);
    expect(mid.cloud[1]).toBeLessThan(SCENE_H - 40);
    expect(mid.finger.pressed).toBe(true);
    expect(mid.finger.along).toBe(0);
    expect(introPose((INTRO.release[1] + INTRO.glide[0]) / 2)).toMatchObject({ cloud: [x, SCENE_H - 40], finger: { pressed: false, along: 0 } });
  });

  it('then carries the finger to the keypad key, presses it, and shows the constellation in the first slot', () => {
    const gliding = introPose((INTRO.glide[0] + INTRO.glide[1]) / 2);
    expect(gliding.finger.along).toBeGreaterThan(0);
    expect(gliding.finger.along).toBeLessThan(1);
    expect(gliding.cloud[1]).toBe(SCENE_H - 40); // the cloud stays away while the finger goes
    const pressing = introPose((INTRO.keyPress[0] + INTRO.keyPress[1]) / 2);
    expect(pressing.finger).toMatchObject({ along: 1, pressed: true });
    expect(introPose(INTRO.slot[0] + 0.1).slot).toBe(true);
    expect(introPose(INTRO.slot[0] - 0.1).slot).toBe(false); // the slot fills only once the key is pressed
    expect(introPose(INTRO.slot[1] + 0.05).slot).toBe(false);
  });

  it('shows the constellation behind the first cloud, the first one to read', () => {
    expect(INTRO_GLYPH).toBe(GLYPH_SPOTS[0].id);
    expect(INTRO_GLYPH).toBe(nightClouds.answer[0]);
    expect(GLYPH_SPOTS[0].x).toBeLessThan(GLYPH_SPOTS[1].x); // reading order is left to right
  });

  it('lets the cloud float back after the finger has gone', () => {
    const returning = introPose((INTRO.back[0] + INTRO.back[1]) / 2);
    expect(returning.cloud[1]).toBeLessThan(SCENE_H - 40);
    expect(returning.cloud[1]).toBeGreaterThan(y);
  });

  it('moves the cloud and fades the finger smoothly: no jumps between neighbouring instants', () => {
    let last = introPose(0);
    for (let t = 0.05; t < INTRO.rest; t += 0.05) {
      const pose = introPose(t);
      expect(Math.abs(pose.cloud[1] - last.cloud[1])).toBeLessThan(120);
      expect(Math.abs(pose.finger.opacity - last.finger.opacity)).toBeLessThan(0.15);
      expect(Math.abs(pose.finger.along - last.finger.along)).toBeLessThan(0.3);
      last = pose;
    }
  });
});

describe('where a first visit starts', () => {
  const fresh = { solved: [] as string[], seenTips: [] as string[], wrongAnswers: {} as Record<string, number> };

  it('goes straight into the first level for a player who has done nothing yet', () => {
    expect(opensFirstLevel(fresh)).toBe(true);
  });

  it('shows the map once the player has made the first move, solved a level or tried an answer', () => {
    expect(opensFirstLevel({ ...fresh, seenTips: [INTRO_TIP] })).toBe(false);
    expect(opensFirstLevel({ ...fresh, solved: ['night-clouds'] })).toBe(false);
    expect(opensFirstLevel({ ...fresh, wrongAnswers: { 'night-clouds': 1 } })).toBe(false);
    expect(opensFirstLevel({ ...fresh, seenTips: ['zoom'] })).toBe(true); // other tips do not count
  });
});
