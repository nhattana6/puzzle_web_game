import { describe, expect, it } from 'vitest';
import { FRAME_MAX_ZOOM, MAX_ZOOM, SCENE_H, SCENE_W, boxDistance, frameFor, isDoubleTap, nearestBox, sceneView } from '../src/core/scene';

describe('scene zoom view', () => {
  it('shows exactly the scene in a 16:9 frame at zoom 1', () => {
    expect(sceneView(1, 800, 450, 16 / 9)).toEqual({ x: 0, y: 0, w: SCENE_W, h: SCENE_H });
  });

  it('shows the whole scene with bands in a tall phone frame at zoom 1', () => {
    const v = sceneView(1, 800, 450, 0.9);
    expect(v.w).toBe(SCENE_W);
    expect(v.h).toBeCloseTo(SCENE_W / 0.9);
    expect(v.y).toBeCloseTo(SCENE_H / 2 - v.h / 2); // centred: bands above and below
  });

  it('zooms around the centre and keeps the view inside the scene', () => {
    const v = sceneView(2, 800, 450, 16 / 9);
    expect(v).toEqual({ x: 400, y: 225, w: 800, h: 450 });
    const corner = sceneView(2, 0, 0, 16 / 9);
    expect(corner.x).toBe(0);
    expect(corner.y).toBe(0);
    const far = sceneView(2, 5000, 5000, 16 / 9);
    expect(far.x + far.w).toBe(SCENE_W);
    expect(far.y + far.h).toBe(SCENE_H);
  });

  it('fills a tall frame once zoomed in far enough, and can pan across the scene', () => {
    const v = sceneView(2, 200, 450, 0.9);
    expect(v.h).toBeLessThanOrEqual(SCENE_H);
    expect(v.x).toBe(0);
    const right = sceneView(2, 1600, 450, 0.9);
    expect(right.x + right.w).toBeCloseTo(SCENE_W);
  });

  it('never zooms out past the whole scene or in past the limit', () => {
    expect(sceneView(0.2, 800, 450, 16 / 9).w).toBe(SCENE_W);
    expect(sceneView(99, 800, 450, 16 / 9).w).toBeCloseTo(SCENE_W / MAX_ZOOM);
  });
});

describe('touch assist', () => {
  const box = (l: number, t: number, w: number, h: number) => ({ left: l, top: t, right: l + w, bottom: t + h });

  it('measures distance to a box: zero inside, straight along an edge, diagonal past a corner', () => {
    const b = box(100, 100, 20, 20);
    expect(boxDistance(110, 110, b)).toBe(0);
    expect(boxDistance(90, 110, b)).toBe(10);
    expect(boxDistance(130, 110, b)).toBe(10);
    expect(boxDistance(90, 90, b)).toBeCloseTo(Math.hypot(10, 10));
  });

  it('picks the thing a finger near it means, within the slop only', () => {
    const boxes = [box(100, 100, 12, 12), box(300, 100, 12, 12)];
    expect(nearestBox(125, 106, boxes)).toBe(0); // 13 px right of the first
    expect(nearestBox(106, 130, boxes)).toBe(0); // 18 px below it
    expect(nearestBox(106, 150, boxes)).toBe(-1); // 38 px: too far
    expect(nearestBox(250, 106, boxes)).toBe(-1); // between them, near neither
    expect(nearestBox(106, 106, [])).toBe(-1);
  });

  it('takes the nearer of two, and the smaller when they are equally near', () => {
    const boxes = [box(100, 100, 12, 12), box(130, 100, 12, 12)];
    expect(nearestBox(118, 106, boxes)).toBe(0); // 6 px from the first, 12 from the second
    expect(nearestBox(125, 106, boxes)).toBe(1);
    const mixed = [box(100, 100, 100, 100), box(210, 140, 10, 10)];
    expect(nearestBox(205, 145, mixed)).toBe(1); // 5 px from each: the small one wins
    expect(nearestBox(150, 150, mixed)).toBe(0); // inside the big one beats a near small one
  });

  it('is a double tap when two taps are close in time and place', () => {
    const a = { t: 1000, x: 100, y: 100 };
    expect(isDoubleTap(null, a)).toBe(false);
    expect(isDoubleTap(a, { t: 1200, x: 110, y: 105 })).toBe(true);
    expect(isDoubleTap(a, { t: 1400, x: 100, y: 100 })).toBe(false); // too slow
    expect(isDoubleTap(a, { t: 1100, x: 160, y: 100 })).toBe(false); // too far
  });
});

describe('framing a level on a phone', () => {
  const phone = 370 / 395;

  it('closes in on a compact set of things, centred on them, with a margin', () => {
    const f = frameFor({ x: 400, y: 100, w: 800, h: 500 }, phone)!;
    expect(f.cx).toBe(800);
    expect(f.cy).toBe(350);
    // 800 wide plus 5% each side is 880: the 1600-wide base fits it 1.8 times.
    expect(f.zoom).toBeCloseTo(1600 / 880);
    // The framed view really holds the box with its margin.
    const v = sceneView(f.zoom, f.cx, f.cy, phone);
    expect(v.x).toBeLessThanOrEqual(400 - 40 + 1e-6);
    expect(v.x + v.w).toBeGreaterThanOrEqual(1200 + 40 - 1e-6);
  });

  it('never closes in past the maximum', () => {
    expect(frameFor({ x: 700, y: 400, w: 100, h: 60 }, phone)!.zoom).toBe(FRAME_MAX_ZOOM);
  });

  it('leaves the whole scene when there is hardly anything to gain', () => {
    expect(frameFor({ x: 0, y: 0, w: SCENE_W, h: SCENE_H }, phone)).toBeNull();
    expect(frameFor({ x: 50, y: 50, w: 1500, h: 800 }, phone)).toBeNull();
  });

  it('is held back by the height too: a tall box cannot zoom as far as a wide one', () => {
    const tall = frameFor({ x: 600, y: 150, w: 400, h: 600 }, 16 / 9)!;
    expect(tall.zoom).toBeCloseTo(SCENE_H / 660);
    expect(frameFor({ x: 600, y: 300, w: 400, h: 300 }, 16 / 9)!.zoom).toBeGreaterThan(tall.zoom);
  });
});
