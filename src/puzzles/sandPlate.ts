import { drawOwl } from '../core/owl';
import type { GlyphId } from '../core/glyphs';
import { glyph, placeStars } from '../core/glyphs';
import { SCENE_H, SCENE_W } from '../core/scene';
import { el } from '../core/svg';
import { clamp, tween } from '../core/tween';
import { dist, seeded } from './sky';
import type { HintStep, PuzzleDef } from './types';

/**
 * Chapter 3, level 6 — the sanded plate ("tấm đồng rắc cát"). A brass plate is strewn with
 * sand. A pitch slider beside it has six notches (plus a resting place at the bottom); at each
 * notch the plate rings with a different note and the sand gathers into the dots of a
 * constellation, shaken into nothing in between. A sheet of music on the left writes a
 * four-note tune on a staff whose six lines sit at the same heights as the notches. The answer
 * is the constellation the sand forms at each note of the tune, in the tune's order.
 */

/** Constellation formed at notch k (0 = lowest). */
export const NOTCHES: readonly GlyphId[] = ['triangle', 'belt', 'crown', 'dipper', 'cross', 'hook'];
/** The tune: notch of each note, first to last. */
export const MELODY: readonly number[] = [3, 0, 5, 2];

export const PLATE = { x: 520, y: 170, w: 560, h: 560 };
export const PLATE_C = { x: PLATE.x + PLATE.w / 2, y: PLATE.y + PLATE.h / 2 };
export const GLYPH_SIZE = 300;
export const SLIDER = { x: 1380, bottom: 770, step: 100 };
/** Slider position u: 0 is the resting place, u = k + 1 is notch k. */
export const uOf = (notch: number): number => notch + 1;
export const yOfU = (u: number): number => SLIDER.bottom - u * SLIDER.step;
/** Height of notch k on the slider, and of the staff line on the sheet that stands for it. */
export const notchY = (k: number): number => yOfU(uOf(k));
export const SLIDER_MAX = NOTCHES.length;

export const GRAINS = 260;
const GRAIN_R = 3.2;
const PER_STAR = 16;
const DECOYS = 2;
const PER_DECOY = 12;

export const READING_ORDER: readonly number[] = MELODY;

/** Final resting place of every grain at each slider position u = 0..6. */
export const TARGETS: readonly (readonly [number, number][])[] = (() => {
  const out: [number, number][][] = [];
  const inPlate = (x: number, y: number, m = 20) => x > PLATE.x + m && x < PLATE.x + PLATE.w - m && y > PLATE.y + m && y < PLATE.y + PLATE.h - m;
  for (let u = 0; u <= NOTCHES.length; u += 1) {
    const rand = seeded(9100 + u * 37);
    const spots: [number, number][] = [];
    const clusters: [number, number][] = [];
    if (u > 0) clusters.push(...placeStars(NOTCHES[u - 1], PLATE_C.x, PLATE_C.y, GLYPH_SIZE));
    const stars = clusters.length;
    for (let tries = 0; tries < 2000 && clusters.length < stars + (u > 0 ? DECOYS : 0); tries += 1) {
      const x = PLATE.x + 50 + rand() * (PLATE.w - 100);
      const y = PLATE.y + 50 + rand() * (PLATE.h - 100);
      if (clusters.some(([cx, cy]) => dist(x, y, cx, cy) < 90)) continue;
      clusters.push([x, y]);
    }
    clusters.forEach(([cx, cy], k) => {
      const n = k < stars ? PER_STAR : PER_DECOY;
      for (let g = 0; g < n; g += 1) {
        const a = rand() * Math.PI * 2;
        const r = Math.sqrt(rand()) * 11;
        spots.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
      }
    });
    // The rest lies along a nodal line of this note (a Lissajous curve), or loose when resting.
    const a = 2 + (u % 3);
    const b = 3 + ((u + 1) % 3);
    const phase = rand() * Math.PI;
    while (spots.length < GRAINS) {
      if (u === 0) {
        spots.push([PLATE.x + 20 + rand() * (PLATE.w - 40), PLATE.y + 20 + rand() * (PLATE.h - 40)]);
        continue;
      }
      const t = rand() * Math.PI * 2;
      const x = PLATE_C.x + Math.sin(a * t + phase) * (PLATE.w / 2 - 36) + (rand() - 0.5) * 6;
      const y = PLATE_C.y + Math.sin(b * t) * (PLATE.h / 2 - 36) + (rand() - 0.5) * 6;
      if (clusters.some(([cx, cy]) => dist(x, y, cx, cy) < 38)) continue;
      if (inPlate(x, y, 14)) spots.push([x, y]);
    }
    out.push(spots);
  }
  return out;
})();

/** Where grain `g` is when the slider is at u (between two notches the sand is on its way, and shaken). */
export function grainAt(g: number, u: number, shake = 0): [number, number] {
  const i = clamp(Math.floor(u), 0, NOTCHES.length);
  const j = Math.min(NOTCHES.length, i + 1);
  const f = u - i;
  const s = f * f * (3 - 2 * f);
  const [ax, ay] = TARGETS[i][g];
  const [bx, by] = TARGETS[j][g];
  const wobble = Math.sin(Math.PI * f) * 22 + shake;
  const h1 = Math.sin(g * 12.9898) * 43758.5453;
  const h2 = Math.sin(g * 78.233) * 12345.678;
  return [ax + (bx - ax) * s + (h1 - Math.floor(h1) - 0.5) * wobble, ay + (by - ay) * s + (h2 - Math.floor(h2) - 0.5) * wobble];
}

/** Which notch the slider is at when it is within `tol` of one, or -1 (resting or in between). */
export function notchAt(u: number, tol = 0.2): number {
  const k = Math.round(u) - 1;
  return k >= 0 && k < NOTCHES.length && Math.abs(u - Math.round(u)) <= tol ? k : -1;
}

export const sandPlate: PuzzleDef = {
  id: 'sand-plate',
  name: 'Tấm đồng rắc cát',
  answer: MELODY.map((k) => NOTCHES[k]),
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    let u = 0;
    let shake = 0;
    let frame = 0;
    let cancel: null | (() => void) = null;
    let lastNotch = -1;

    // Back: the workshop wall.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#201a24' }, back);
    el('rect', { x: -60, y: 790, width: SCENE_W + 120, height: 140, fill: '#33271f' }, back);
    scene.grain('back', 0.45);

    // Mid: the music stand on the left, the plate in the middle, the pitch slider on the right.
    el('rect', { x: 90, y: 100, width: 350, height: 690, rx: 10, fill: '#efe6cf', stroke: '#b9a27f', 'stroke-width': 4 }, mid);
    for (let k = 0; k < NOTCHES.length; k += 1) {
      el('line', { x1: 120, y1: notchY(k), x2: 410, y2: notchY(k), stroke: '#6b5a40', 'stroke-width': 3 }, mid);
    }
    el('line', { x1: 120, y1: notchY(5) - 12, x2: 120, y2: notchY(0) + 12, stroke: '#2b2118', 'stroke-width': 5 }, mid);
    el('line', { x1: 410, y1: notchY(5) - 12, x2: 410, y2: notchY(0) + 12, stroke: '#2b2118', 'stroke-width': 5 }, mid);
    MELODY.forEach((k, n) => {
      const x = 160 + n * 72;
      const y = notchY(k);
      el('ellipse', { cx: x, cy: y, rx: 20, ry: 14, fill: '#2b2118', transform: `rotate(-18 ${x} ${y})` }, mid);
      el('line', { x1: x + 18, y1: y - 3, x2: x + 18, y2: y - 62, stroke: '#2b2118', 'stroke-width': 5, 'stroke-linecap': 'round' }, mid);
    });

    el('rect', { x: PLATE.x - 14, y: PLATE.y - 14, width: PLATE.w + 28, height: PLATE.h + 28, rx: 18, fill: '#4a3a1e', stroke: '#2a2010', 'stroke-width': 4 }, mid);
    el('rect', { x: PLATE.x, y: PLATE.y, width: PLATE.w, height: PLATE.h, rx: 8, fill: '#a9792f', stroke: '#6b4a14', 'stroke-width': 4 }, mid);
    el('circle', { cx: PLATE_C.x, cy: PLATE_C.y, r: 10, fill: '#8a6020', 'pointer-events': 'none' }, mid);
    const sand = el('g', { 'pointer-events': 'none' }, mid);
    const grains = Array.from({ length: GRAINS }, () => el('circle', { r: GRAIN_R, fill: '#f1e4be' }, sand));

    el('line', { x1: SLIDER.x, y1: yOfU(NOTCHES.length) - 20, x2: SLIDER.x, y2: yOfU(0) + 20, stroke: '#3a2a22', 'stroke-width': 14, 'stroke-linecap': 'round' }, mid);
    for (let k = 0; k < NOTCHES.length; k += 1) {
      el('line', { x1: SLIDER.x - 36, y1: notchY(k), x2: SLIDER.x + 36, y2: notchY(k), stroke: '#8a6a48', 'stroke-width': 4, 'stroke-linecap': 'round' }, mid);
    }
    el('line', { x1: SLIDER.x - 36, y1: yOfU(0), x2: SLIDER.x + 36, y2: yOfU(0), stroke: '#5a4a38', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-dasharray': '6 8' }, mid);

    // Front: the slider handle and the owl.
    const handle = el('g', { class: 'plate-handle interactive', tabindex: 0, role: 'slider', 'aria-label': 'Núm âm cao', 'aria-valuemin': 0, 'aria-valuemax': NOTCHES.length, 'data-hint': 'handle' }, front);
    el('rect', { x: -60, y: -34, width: 120, height: 68, fill: 'transparent' }, handle);
    el('circle', { r: 24, fill: '#d3a64f', stroke: '#7e5b1c', 'stroke-width': 5 }, handle);
    el('circle', { r: 8, fill: '#f6efd8' }, handle);
    drawOwl(front, 1180, 800, 0.6);

    const render = () => {
      handle.setAttribute('transform', `translate(${SLIDER.x} ${yOfU(u).toFixed(1)})`);
      handle.setAttribute('aria-valuenow', u.toFixed(2));
      for (let g = 0; g < GRAINS; g += 1) {
        const [x, y] = grainAt(g, u, shake);
        grains[g].setAttribute('cx', x.toFixed(1));
        grains[g].setAttribute('cy', y.toFixed(1));
      }
    };
    const loop = () => {
      if (shake > 0.3) {
        shake *= 0.9;
        render();
        frame = requestAnimationFrame(loop);
      } else {
        shake = 0;
        render();
        frame = 0;
      }
    };
    const kick = () => {
      if (!frame) frame = requestAnimationFrame(loop);
    };
    const settleTo = (target: number, instant = false) => {
      cancel?.();
      cancel = null;
      const from = u;
      const to = clamp(target, 0, NOTCHES.length);
      const done = () => {
        const k = notchAt(u);
        if (k >= 0 && k !== lastNotch) sound.note(NOTCHES[k]);
        lastNotch = k;
        shake = k >= 0 ? 9 : 0;
        kick();
      };
      if (instant) {
        u = to;
        render();
        lastNotch = notchAt(u);
        return;
      }
      cancel = tween(180, (t) => {
        u = from + (to - from) * t;
        render();
        if (t >= 1) done();
      });
    };

    let grab = 0;
    scene.draggable(handle, {
      start: (p) => {
        cancel?.();
        cancel = null;
        grab = p.y - yOfU(u);
      },
      move: (p) => {
        u = clamp((SLIDER.bottom - (p.y - grab)) / SLIDER.step, 0, NOTCHES.length);
        render();
      },
      end: () => settleTo(Math.round(u)),
    });
    handle.addEventListener('keydown', (event) => {
      const d = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[event.key];
      if (!d) return;
      event.preventDefault();
      settleTo(Math.round(u) + d);
    });
    render();

    return {
      // Nothing is marked in the scene; the hint card shows the whole solution instead.
      revealHints: () => 0,
      hintSteps: (): HintStep[] => {
        const k = MELODY[0];
        return [
          {
            note: 'Kéo núm âm cao tới vạch có độ cao đúng bằng nốt đầu tiên trên bản nhạc: cát trên tấm đồng dồn thành các chấm của một chòm. Làm tương tự với các nốt còn lại.',
            targets: [{ x: SLIDER.x, y: yOfU(0), r: 60, verb: 'drag', to: { x: SLIDER.x, y: notchY(k) }, object: '[data-hint="handle"]' }],
            apply: () => settleTo(uOf(k), true),
          },
          {
            note: 'Cát tạo thành chòm này (có thể có vài đám cát lẻ không phải chòm). Đọc chòm của từng nốt theo thứ tự các nốt trên bản nhạc, từ trái sang phải.',
            targets: [{ x: PLATE_C.x, y: PLATE_C.y, r: GLYPH_SIZE * 0.6, verb: 'look' }],
            prepare: (picture) => {
              const overlay = picture.querySelector('.layer-overlay') ?? picture;
              const stars = placeStars(NOTCHES[k], PLATE_C.x, PLATE_C.y, GLYPH_SIZE);
              for (const [a, b] of glyph(NOTCHES[k]).lines) {
                el('line', { x1: stars[a][0], y1: stars[a][1], x2: stars[b][0], y2: stars[b][1], class: 'hint-line', 'pointer-events': 'none' }, overlay);
              }
              const badge = el('g', { transform: `translate(${PLATE_C.x} ${PLATE.y - 40})`, 'pointer-events': 'none' }, overlay);
              el('circle', { r: 17, class: 'number-badge' }, badge);
              el('text', { y: 1, class: 'number-text' }, badge).textContent = '1';
            },
          },
        ];
      },
      destroy: () => {
        cancel?.();
        cancelAnimationFrame(frame);
      },
    };
  },
};
