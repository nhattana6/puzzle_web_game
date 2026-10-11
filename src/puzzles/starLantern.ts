import { DEF, url } from '../core/defs';
import { SCENE_H, SCENE_W } from '../core/scene';
import { annulusPath, asButton, el, pips, starPath, uid } from '../core/svg';
import { easeInOutSine, mod, tween } from '../core/tween';
import { drawZodiac, type ZodiacId } from '../core/zodiac';
import type { PuzzleDef } from './types';

/**
 * Level 1 — the star lantern ("đèn ông sao").
 * Its paper disc is cut into three rings, and light through the cut-outs projects
 * the slices onto the wall. The rings are geared: turning the outer ring drags the
 * middle one, turning the middle drags the inner. The disc has two faces, each
 * hiding a different animal at a different ring setting. Tapping the star flips
 * the disc. A finished face projects its animal plus dots giving its place in the answer.
 */

export const RING_STEPS = 8;
/** Inner → outer ring radii, in silhouette units (100×100 box). */
export const RING_RADII: readonly [number, number][] = [[0, 20], [20, 40], [40, 64]];
/** Turning ring i also turns these rings (inner = 0, middle = 1, outer = 2). */
export const RING_LINKS: readonly (readonly number[])[] = [[0], [1, 0], [2, 1]];
export const INITIAL_STEPS: readonly number[] = [3, 6, 2];

export interface Face {
  animal: ZodiacId;
  /** Ring steps at which this face's slices line up. */
  solution: readonly number[];
  /** Place in the answer, shown as dots once the face is lined up. */
  order: number;
}

export const FACES: readonly Face[] = [
  { animal: 'rat', solution: [0, 0, 0], order: 1 },
  { animal: 'goat', solution: [6, 1, 5], order: 2 },
];

export function turnRing(steps: readonly number[], ring: number): number[] {
  const next = [...steps];
  for (const linked of RING_LINKS[ring]) next[linked] = mod(next[linked] + 1, RING_STEPS);
  return next;
}

export const isFaceAligned = (steps: readonly number[], face: Face): boolean =>
  steps.every((step, i) => mod(step - face.solution[i], RING_STEPS) === 0);

const PIVOT = { x: 50, y: 58 }; // ring centre inside the silhouette box
const WALL = { x: 800, y: 250, scale: 4 };
const DISC = { x: 800, y: 680, scale: 2 };
const STEP_DEG = 360 / RING_STEPS;

export const starLantern: PuzzleDef = {
  id: 'c1-star-lantern',
  chapter: 1,
  name: 'Đèn ông sao',
  answer: [...FACES].sort((a, b) => a.order - b.order).map((f) => f.animal),
  fireflies: [
    { id: 'c1-star-lantern/window', layer: 'back', x: 405, y: 150 },
    { id: 'c1-star-lantern/floor', layer: 'front', x: 1390, y: 870 },
  ],
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;

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
    el('ellipse', { cx: WALL.x, cy: WALL.y + 70, rx: 430, ry: 340, fill: url(lightId) }, mid);

    const clipIds = RING_RADII.map(([inner, outer]) => {
      const id = uid('ring-clip');
      const clip = el('clipPath', { id }, scene.defs);
      el('path', { d: annulusPath(PIVOT.x, PIVOT.y, inner, outer), 'clip-rule': 'evenodd' }, clip);
      return id;
    });

    const wall = el('g', { class: 'projection' }, mid);
    wall.style.color = '#ffdf9a';
    const projection = el('g', {
      transform: `translate(${WALL.x - PIVOT.x * WALL.scale} ${WALL.y - PIVOT.y * WALL.scale}) scale(${WALL.scale})`,
      filter: url(DEF.glow),
    }, wall);
    const wallFaces = FACES.map((face, f) => {
      const group = el('g', { opacity: f === 0 ? 1 : 0 }, projection);
      const slices = clipIds.map((clipId) => {
        const turn = el('g', {}, group);
        drawZodiac(el('g', { 'clip-path': url(clipId) }, turn), face.animal);
        return turn;
      });
      return { group, slices };
    });
    const wallPips = FACES.map((face) => pips(wall, face.order, WALL.x, WALL.y + 170, 9, 30, { opacity: 0, fill: '#ffe7ad', filter: url(DEF.glow) }));
    const ghost = el('g', { opacity: 0 }, projection);

    // Front: the star lantern on its stick, with the two-faced disc.
    el('rect', { x: -60, y: 850, width: SCENE_W + 120, height: 120, fill: '#1f1916' }, front);
    el('rect', { x: DISC.x - 7, y: 840, width: 14, height: 80, fill: '#6b4f36', rx: 4 }, front);
    const star = el('g', { class: 'star interactive' }, front);
    el('path', {
      d: starPath(DISC.x, DISC.y, 215, 104),
      fill: '#b7372a', stroke: '#7a2119', 'stroke-width': 7, 'stroke-linejoin': 'round', filter: url(DEF.rough),
    }, star);
    el('path', { d: starPath(DISC.x, DISC.y, 185, 90), fill: '#d9573f', opacity: 0.45, filter: url(DEF.rough) }, star);

    let steps = [...INITIAL_STEPS];
    let face = 0;
    const angles = steps.map((s) => s * STEP_DEG);
    const targets = [...angles];
    const cancels: (() => void)[] = [];
    let cancelFlip: (() => void) | null = null;
    let aligned = -1;
    let ghostOn = false;
    const drawGhost = () => {
      ghost.replaceChildren();
      drawZodiac(ghost, FACES[face].animal);
    };

    const disc = el('g', {}, front);
    const discRings = RING_RADII.map(([inner, outer], i) => {
      const ring = el('g', { class: 'ring interactive' }, disc);
      el('path', {
        d: annulusPath(DISC.x, DISC.y, inner * DISC.scale, outer * DISC.scale),
        'fill-rule': 'evenodd', fill: '#2b2622', stroke: '#8a6a45', 'stroke-width': 2,
      }, ring);
      const cuts = FACES.map((f, fi) => {
        const cut = el('g', {
          transform: `translate(${DISC.x - PIVOT.x * DISC.scale} ${DISC.y - PIVOT.y * DISC.scale}) scale(${DISC.scale})`,
          opacity: fi === 0 ? 1 : 0,
        }, ring);
        cut.style.color = '#f4c66a';
        const turn = el('g', {}, cut);
        drawZodiac(el('g', { 'clip-path': url(clipIds[i]) }, turn), f.animal);
        return { cut, turn };
      });
      // A red notch shows each ring's turn, like a mark pencilled on the paper.
      el('path', {
        d: `M${DISC.x - 7} ${DISC.y - outer * DISC.scale + 1} L${DISC.x + 7} ${DISC.y - outer * DISC.scale + 1} L${DISC.x} ${DISC.y - outer * DISC.scale + 12} Z`,
        fill: '#e0533c',
      }, ring);
      asButton(ring, `Xoay vòng giấy ${i + 1}`, () => onTurn(i));
      return { ring, cuts };
    });

    const render = () => {
      const f = FACES[face];
      angles.forEach((angle, i) => {
        // A face's slices sit upright when the ring reaches that face's solution step.
        const local = angle - f.solution[i] * STEP_DEG;
        wallFaces[face].slices[i].setAttribute('transform', `rotate(${local} ${PIVOT.x} ${PIVOT.y})`);
        discRings[i].ring.setAttribute('transform', `rotate(${angle} ${DISC.x} ${DISC.y})`);
        discRings[i].cuts[face].turn.setAttribute('transform', `rotate(${-f.solution[i] * STEP_DEG} ${PIVOT.x} ${PIVOT.y})`);
      });
    };

    const updateAligned = () => {
      const now = isFaceAligned(steps, FACES[face]) ? face : -1;
      if (now !== -1 && now !== aligned) setTimeout(() => sound.chime(), 280);
      aligned = now;
      wall.classList.toggle('aligned', aligned !== -1);
      wallPips.forEach((p, i) => p.setAttribute('opacity', i === aligned ? '1' : '0'));
    };

    function onTurn(i: number) {
      steps = turnRing(steps, i);
      sound.paper();
      for (const linked of RING_LINKS[i]) {
        const from = angles[linked];
        targets[linked] += STEP_DEG;
        const to = targets[linked];
        cancels[linked]?.();
        cancels[linked] = tween(320, (t) => {
          angles[linked] = from + (to - from) * t;
          render();
        });
      }
      updateAligned();
    }

    const showFace = (next: number) => {
      face = next;
      wallFaces.forEach((w, i) => w.group.setAttribute('opacity', i === face ? '1' : '0'));
      if (ghostOn) drawGhost();
      discRings.forEach(({ cuts }) => cuts.forEach((c, i) => c.cut.setAttribute('opacity', i === face ? '1' : '0')));
      render();
      updateAligned();
    };

    const flip = () => {
      cancelFlip?.();
      sound.paper();
      let swapped = false;
      cancelFlip = tween(460, (t) => {
        const sx = Math.max(0.02, Math.abs(Math.cos(t * Math.PI)));
        disc.setAttribute('transform', `translate(${DISC.x} 0) scale(${sx} 1) translate(${-DISC.x} 0)`);
        projection.setAttribute('opacity', sx.toFixed(2));
        if (!swapped && t >= 0.5) {
          swapped = true;
          showFace((face + 1) % FACES.length);
        }
      }, easeInOutSine);
    };
    asButton(star, 'Lật đĩa giấy', flip);

    render();
    updateAligned();

    return {
      hintTargets: () => [
        { x: DISC.x, y: DISC.y, r: 140, verb: 'rotate' },
        { x: DISC.x + 150, y: DISC.y - 60, r: 46, verb: 'tap' },
      ],
      showGhost: () => {
        ghostOn = true;
        drawGhost();
        ghost.setAttribute('opacity', '0.18');
      },
      destroy: () => {
        cancels.forEach((cancel) => cancel?.());
        cancelFlip?.();
      },
    };
  },
};
