import { describe, expect, it } from 'vitest';
import { MAX_ZOOM, SCENE_H, SCENE_W, sceneView } from '../src/core/scene';

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
