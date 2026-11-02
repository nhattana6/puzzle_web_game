import { describe, expect, it } from 'vitest';
import { INTRO, introPose, CLOUDS_START } from '../src/puzzles/nightClouds';
import { SCENE_H } from '../src/core/scene';
import { INTRO_TIP, opensFirstLevel } from '../src/ui/chapters';

describe('first-run demonstration on level 1', () => {
  const [x, y] = CLOUDS_START[0];

  it('starts and ends with the cloud where the level put it, and no finger showing', () => {
    for (const t of [0, INTRO.back[1], INTRO.rest - 0.01]) {
      const pose = introPose(t);
      expect(pose.cloud).toEqual([x, y]);
    }
    expect(introPose(0).finger.opacity).toBe(0);
    expect(introPose(INTRO.fadeOut[1]).finger.opacity).toBe(0);
  });

  it('drags the cloud down off the window under a pressed finger, holds it there, then lets it float back', () => {
    const mid = introPose((INTRO.slide[0] + INTRO.slide[1]) / 2);
    expect(mid.cloud[1]).toBeGreaterThan(y);
    expect(mid.cloud[1]).toBeLessThan(SCENE_H - 40);
    expect(mid.finger.pressed).toBe(true);
    expect(mid.finger).toMatchObject({ x, y: mid.cloud[1] });
    const held = introPose((INTRO.hold[0] + INTRO.hold[1]) / 2);
    expect(held.cloud).toEqual([x, SCENE_H - 40]);
    expect(held.finger.pressed).toBe(false);
    const returning = introPose((INTRO.back[0] + INTRO.back[1]) / 2);
    expect(returning.cloud[1]).toBeLessThan(SCENE_H - 40);
    expect(returning.cloud[1]).toBeGreaterThan(y);
  });

  it('only moves the cloud and fades the finger smoothly: no jumps between neighbouring instants', () => {
    let last = introPose(0);
    for (let t = 0.05; t < INTRO.rest; t += 0.05) {
      const pose = introPose(t);
      expect(Math.abs(pose.cloud[1] - last.cloud[1])).toBeLessThan(120);
      expect(Math.abs(pose.finger.opacity - last.finger.opacity)).toBeLessThan(0.15);
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
