import { DEF, url } from '../core/defs';
import { SCENE_H, SCENE_W } from '../core/scene';
import { annulusPath, asButton, el, starPath, uid } from '../core/svg';
import { mod, tween } from '../core/tween';
import { drawZodiac } from '../core/zodiac';
import type { PuzzleDef } from './types';

/**
 * Chapter 1 tutorial — the star lantern ("đèn ông sao").
 * Its paper disc is cut into three rings. Each ring carries a slice of a silhouette;
 * light through the cut-outs projects the slices onto the wall. Turn every ring
 * upright and the slices join into one animal.
 */

export const RING_STEPS = 8;
/** Inner → outer ring radii, in silhouette units (100×100 box). */
export const RING_RADII: readonly [number, number][] = [[0, 20], [20, 40], [40, 64]];
export const INITIAL_STEPS: readonly number[] = [3, 6, 2];

export const isLanternAligned = (steps: readonly number[]): boolean =>
  steps.every((step) => mod(step, RING_STEPS) === 0);

const PIVOT = { x: 50, y: 58 }; // ring centre inside the silhouette box
const WALL = { x: 800, y: 260, scale: 4 };
const DISC = { x: 800, y: 680, scale: 2 };

export const starLantern: PuzzleDef = {
  id: 'c1-star-lantern',
  chapter: 1,
  name: 'Đèn ông sao',
  answer: ['rat'],
  fireflies: [
    { id: 'c1-star-lantern/window', layer: 'back', x: 405, y: 150 },
    { id: 'c1-star-lantern/floor', layer: 'front', x: 1390, y: 850 },
  ],
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    const animal = this.answer[0];

    // Back: a dark room at night, a window with the moon.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#2f2723' }, back);
    for (const x of [110, 1490]) el('rect', { x: x - 18, y: -60, width: 36, height: SCENE_H + 120, fill: '#1f1916' }, back);
    el('rect', { x: 180, y: 80, width: 300, height: 250, fill: '#1b2230', stroke: '#1f1916', 'stroke-width': 16 }, back);
    el('circle', { cx: 400, cy: 150, r: 34, fill: '#efe6d2', filter: url(DEF.glow), opacity: 0.9 }, back);
    for (const x of [255, 330, 405]) el('line', { x1: x, y1: 80, x2: x, y2: 330, stroke: '#1f1916', 'stroke-width': 6 }, back);
    el('line', { x1: 180, y1: 205, x2: 480, y2: 205, stroke: '#1f1916', 'stroke-width': 6 }, back);
    scene.grain('back', 0.9);

    // Mid: the pool of lantern light on the wall and the projected slices.
    const lightId = uid('lantern-light');
    const gradient = el('radialGradient', { id: lightId }, scene.defs);
    el('stop', { offset: 0, 'stop-color': '#f4c66a', 'stop-opacity': 0.42 }, gradient);
    el('stop', { offset: 0.6, 'stop-color': '#f4c66a', 'stop-opacity': 0.12 }, gradient);
    el('stop', { offset: 1, 'stop-color': '#f4c66a', 'stop-opacity': 0 }, gradient);
    el('ellipse', { cx: WALL.x, cy: WALL.y + 60, rx: 420, ry: 330, fill: url(lightId) }, mid);

    const clipIds = RING_RADII.map(([inner, outer]) => {
      const id = uid('ring-clip');
      const clip = el('clipPath', { id }, scene.defs);
      el('path', { d: annulusPath(PIVOT.x, PIVOT.y, inner, outer), 'clip-rule': 'evenodd' }, clip);
      return id;
    });

    const projection = el('g', {
      transform: `translate(${WALL.x - PIVOT.x * WALL.scale} ${WALL.y - PIVOT.y * WALL.scale}) scale(${WALL.scale})`,
      filter: url(DEF.glow),
      class: 'projection',
    }, mid);
    projection.style.color = '#ffdf9a';
    const wallSlices = clipIds.map((clipId) => {
      const turn = el('g', {}, projection);
      drawZodiac(el('g', { 'clip-path': url(clipId) }, turn), animal);
      return turn;
    });
    const ghost = el('g', { opacity: 0, class: 'ghost' }, projection);
    drawZodiac(ghost, animal);

    // Front: the star lantern on its stick, with the turning disc.
    el('rect', { x: -60, y: 850, width: SCENE_W + 120, height: 120, fill: '#1f1916' }, front);
    el('rect', { x: DISC.x - 7, y: 840, width: 14, height: 80, fill: '#6b4f36', rx: 4 }, front);
    el('path', {
      d: starPath(DISC.x, DISC.y, 215, 104),
      fill: '#b7372a', stroke: '#7a2119', 'stroke-width': 7, 'stroke-linejoin': 'round', filter: url(DEF.rough),
    }, front);
    el('path', { d: starPath(DISC.x, DISC.y, 185, 90), fill: '#d9573f', opacity: 0.45, filter: url(DEF.rough) }, front);

    const steps = [...INITIAL_STEPS];
    const angles = steps.map((s) => s * (360 / RING_STEPS));
    const targets = [...angles];
    const cancels: (() => void)[] = [];
    let aligned = false;

    const discRings = RING_RADII.map(([inner, outer], i) => {
      const ring = el('g', { class: 'ring interactive' }, front);
      el('path', {
        d: annulusPath(DISC.x, DISC.y, inner * DISC.scale, outer * DISC.scale),
        'fill-rule': 'evenodd', fill: '#2b2622', stroke: '#8a6a45', 'stroke-width': 2,
      }, ring);
      const cut = el('g', {
        transform: `translate(${DISC.x - PIVOT.x * DISC.scale} ${DISC.y - PIVOT.y * DISC.scale}) scale(${DISC.scale})`,
      }, ring);
      cut.style.color = '#f4c66a';
      drawZodiac(el('g', { 'clip-path': url(clipIds[i]) }, cut), animal);
      // A red notch shows each ring's turn, like a mark pencilled on the paper.
      el('path', {
        d: `M${DISC.x - 6} ${DISC.y - outer * DISC.scale + 1} L${DISC.x + 6} ${DISC.y - outer * DISC.scale + 1} L${DISC.x} ${DISC.y - outer * DISC.scale + 10} Z`,
        fill: '#e0533c',
      }, ring);
      asButton(ring, `Xoay vòng giấy ${i + 1}`, () => turnRing(i));
      return ring;
    });

    const render = () => {
      angles.forEach((angle, i) => {
        wallSlices[i].setAttribute('transform', `rotate(${angle} ${PIVOT.x} ${PIVOT.y})`);
        discRings[i].setAttribute('transform', `rotate(${angle} ${DISC.x} ${DISC.y})`);
      });
    };

    function turnRing(i: number) {
      steps[i] = mod(steps[i] + 1, RING_STEPS);
      const from = angles[i];
      targets[i] += 360 / RING_STEPS;
      const to = targets[i];
      sound.paper();
      cancels[i]?.();
      cancels[i] = tween(320, (t) => {
        angles[i] = from + (to - from) * t;
        render();
      });
      const nowAligned = isLanternAligned(steps);
      if (nowAligned && !aligned) {
        setTimeout(() => sound.chime(), 280);
      }
      aligned = nowAligned;
      projection.classList.toggle('aligned', aligned);
    }

    render();

    return {
      hintTargets: () => [{ x: DISC.x, y: DISC.y, r: 140, verb: 'rotate' }],
      showGhost: () => ghost.setAttribute('opacity', '0.18'),
      destroy: () => cancels.forEach((cancel) => cancel?.()),
    };
  },
};
