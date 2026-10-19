import { drawOwl } from '../core/owl';
import type { GlyphId } from '../core/glyphs';
import { glyph, placeStars } from '../core/glyphs';
import { SCENE_H, SCENE_W } from '../core/scene';
import { el, uid } from '../core/svg';
import { clamp } from '../core/tween';
import { seeded } from './sky';
import type { HintStep, PuzzleDef } from './types';
import { tr } from '../core/i18n';

/**
 * Chapter 3, level 10 — the panning shot ("ảnh phơi sáng"). The camera takes a long exposure while
 * it pans. Six people cross the street at different speeds and directions (one stands still), each
 * waving a sparkler that traces a constellation and carrying a lantern; four of the lanterns have a
 * tassel of 1–4 knots. In the photograph whatever moves at the camera's own pan speed comes out sharp
 * and everything else, the street included, is smeared sideways. Drag the pan speed: at four speeds a
 * runner with a tassel comes out sharp (its constellation as dots, its knots countable); the one
 * standing still (sharp with no pan) and one runner have no tassel and are traps. The answer is the
 * four constellations in the order of their knots.
 */

export interface RunnerDef {
  glyph: GlyphId;
  /** Speed across the street (negative: to the left), in the pan slider's units. */
  speed: number;
  /** Knots on the lantern's tassel; 0 for none. */
  knots: number;
  coat: string;
}

/** Left to right in the photograph. */
export const RUNNERS: readonly RunnerDef[] = [
  { glyph: 'crown', speed: 2.6, knots: 2, coat: '#5a8a6a' },
  { glyph: 'belt', speed: 0, knots: 0, coat: '#9a5a4d' },
  { glyph: 'cross', speed: -1.1, knots: 1, coat: '#4d6a9a' },
  { glyph: 'hook', speed: 0.8, knots: 4, coat: '#4d8a8a' },
  { glyph: 'diamond', speed: 1.7, knots: 0, coat: '#6a4d8a' },
  { glyph: 'dipper', speed: -2.4, knots: 3, coat: '#8a7a4d' },
];

/** The pan slider's range. */
export const PAN_MAX = 3.2;
/** Pixels of smear per unit of speed difference. */
export const SMEAR_K = 120;
/** Below this smear (px) a runner reads as sharp: its dots are dots and its knots can be counted. */
export const SHARP_BELOW = 12;

/** How far (px) runner `i` is smeared in the photograph at pan speed `pan`. */
export const smearOf = (i: number, pan: number): number => Math.abs(RUNNERS[i].speed - pan) * SMEAR_K;
/** The street (houses, lamp posts) stands still, so it smears by the pan itself. */
export const streetSmear = (pan: number): number => Math.abs(pan) * SMEAR_K;
/** The runners that come out sharp at pan speed `pan`. */
export const sharpAt = (pan: number): number[] => RUNNERS.flatMap((_, i) => (smearOf(i, pan) < SHARP_BELOW ? [i] : []));

/** The answer: runners with a tassel, by their number of knots. */
export const READING_ORDER: readonly number[] = RUNNERS
  .map((r, i) => ({ r, i }))
  .filter(({ r }) => r.knots > 0)
  .sort((a, b) => a.r.knots - b.r.knots)
  .map(({ i }) => i);

export const RUNNER_X = (i: number): number => 175 + i * 250;
export const GROUND_Y = 720;
export const CHOM = { y: 260, size: 140 };
export const SLIDER = { x0: 300, x1: 1300, y: 845 };
const panToX = (pan: number): number => SLIDER.x0 + ((pan + PAN_MAX) / (2 * PAN_MAX)) * (SLIDER.x1 - SLIDER.x0);
const xToPan = (x: number): number => ((x - SLIDER.x0) / (SLIDER.x1 - SLIDER.x0)) * 2 * PAN_MAX - PAN_MAX;

export const longExposure: PuzzleDef = {
  id: 'long-exposure',
  get name() {
    return tr('Ảnh phơi sáng', 'Long Exposure');
  },
  answer: READING_ORDER.map((i) => RUNNERS[i].glyph),
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    let pan = 0;
    /** For each smeared group (the street first, then the runners), the blur that smears it sideways. */
    const blurs: SVGFEGaussianBlurElement[] = [];

    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#0e1230' }, back);
    const rand = seeded(10101);
    for (let n = 0; n < 60; n += 1) el('circle', { cx: (rand() * SCENE_W).toFixed(0), cy: (rand() * 110).toFixed(0), r: (0.8 + rand() * 1.4).toFixed(1), fill: '#f6efd8', opacity: (0.25 + rand() * 0.4).toFixed(2) }, back);
    scene.grain('back', 0.3);

    // The photograph's frame.
    el('rect', { x: 40, y: 120, width: 1520, height: 680, rx: 14, fill: '#141a3c', stroke: '#6b4f24', 'stroke-width': 8 }, mid);
    const photo = el('g', {}, mid);
    const clip = uid('photo');
    el('rect', { x: 44, y: 124, width: 1512, height: 672, rx: 12 }, el('clipPath', { id: clip }, scene.defs));
    photo.setAttribute('clip-path', `url(#${clip})`);

    /** A group drawn by `draw` and smeared sideways by its own blur (a long exposure of something moving across). */
    const smeared = (draw: (g: SVGGElement) => void): void => {
      const id = uid('smear');
      const filter = el('filter', { id, x: '-60%', y: '-10%', width: '220%', height: '120%' }, scene.defs);
      blurs.push(el('feGaussianBlur', { stdDeviation: '0 0' }, filter));
      const g = el('g', { filter: `url(#${id})` }, photo);
      draw(g);
    };

    // The street: houses and lamp posts, standing still.
    smeared((g) => {
      for (let k = 0; k < 8; k += 1) {
        const x = 60 + k * 200;
        const h = 120 + ((k * 53) % 70);
        el('path', { d: `M${x} ${GROUND_Y + 20} V${GROUND_Y + 20 - h} L${x + 80} ${GROUND_Y - h - 20} L${x + 160} ${GROUND_Y + 20 - h} V${GROUND_Y + 20} Z`, fill: '#1e2550' }, g);
        el('rect', { x: x + 60, y: GROUND_Y - h + 40, width: 36, height: 30, rx: 4, fill: '#a68a4a' }, g);
      }
      el('rect', { x: 0, y: GROUND_Y + 20, width: SCENE_W, height: 100, fill: '#241f38' }, g);
    });

    // The runners: body, lantern with its tassel, sparks of the constellation above.
    RUNNERS.forEach((r, i) => {
      const x = RUNNER_X(i);
      smeared((g) => {
        el('rect', { x: x - 12, y: GROUND_Y - 52, width: 10, height: 52, rx: 4, fill: '#120d1c' }, g);
        el('rect', { x: x + 2, y: GROUND_Y - 52, width: 10, height: 52, rx: 4, fill: '#120d1c' }, g);
        el('rect', { x: x - 26, y: GROUND_Y - 128, width: 52, height: 82, rx: 16, fill: r.coat }, g);
        el('circle', { cx: x, cy: GROUND_Y - 150, r: 20, fill: '#e8c9a0' }, g);
        el('line', { x1: x + 24, y1: GROUND_Y - 112, x2: x + 44, y2: GROUND_Y - 176, stroke: r.coat, 'stroke-width': 11, 'stroke-linecap': 'round' }, g);
        el('line', { x1: x + 44, y1: GROUND_Y - 176, x2: x + 50, y2: GROUND_Y - 202, stroke: '#cfc7b0', 'stroke-width': 3 }, g);
        // Lantern in the other hand, with its tassel of knots in a row below.
        el('line', { x1: x - 24, y1: GROUND_Y - 110, x2: x - 46, y2: GROUND_Y - 92, stroke: r.coat, 'stroke-width': 11, 'stroke-linecap': 'round' }, g);
        el('ellipse', { cx: x - 52, cy: GROUND_Y - 64, rx: 20, ry: 26, fill: '#b8452f', stroke: '#7a2a1c', 'stroke-width': 3 }, g);
        if (r.knots > 0) {
          el('line', { x1: x - 52, y1: GROUND_Y - 38, x2: x - 52, y2: GROUND_Y - 26, stroke: '#e8c46a', 'stroke-width': 3 }, g);
          for (let k = 0; k < r.knots; k += 1) {
            el('circle', { cx: x - 52 - ((r.knots - 1) * 13) / 2 + k * 13, cy: GROUND_Y - 20, r: 5, fill: '#e8c46a' }, g);
          }
        }
        for (const [sx, sy] of placeStars(r.glyph, x + 30, CHOM.y, CHOM.size)) el('circle', { cx: sx.toFixed(1), cy: sy.toFixed(1), r: 6, fill: '#ffd98a' }, g);
      });
    });

    // Front: the pan slider (a camera turning left or right) and the owl.
    el('line', { x1: SLIDER.x0, y1: SLIDER.y, x2: SLIDER.x1, y2: SLIDER.y, stroke: '#3a2a22', 'stroke-width': 16, 'stroke-linecap': 'round' }, front);
    for (let k = -3; k <= 3; k += 1) {
      const x = panToX(k);
      el('line', { x1: x, y1: SLIDER.y - (k === 0 ? 24 : 14), x2: x, y2: SLIDER.y + (k === 0 ? 24 : 14), stroke: '#8a6a48', 'stroke-width': k === 0 ? 5 : 3, 'stroke-linecap': 'round' }, front);
    }
    el('path', { d: `M${SLIDER.x0 - 30} ${SLIDER.y} l26 -16 v32 Z`, fill: '#8a6a48' }, front);
    el('path', { d: `M${SLIDER.x1 + 30} ${SLIDER.y} l-26 -16 v32 Z`, fill: '#8a6a48' }, front);
    const handle = el('g', { class: 'exposure-handle interactive', tabindex: 0, role: 'slider', 'aria-label': tr('Tốc độ lia máy', 'Panning speed'), 'aria-valuemin': -PAN_MAX, 'aria-valuemax': PAN_MAX, 'data-hint': 'handle' }, front);
    el('rect', { x: -34, y: -34, width: 68, height: 68, fill: 'transparent' }, handle);
    el('rect', { x: -26, y: -18, width: 52, height: 36, rx: 8, fill: '#2b2430', stroke: '#d3a64f', 'stroke-width': 4 }, handle);
    el('circle', { r: 11, fill: '#6fb4d8', stroke: '#f6efd8', 'stroke-width': 3 }, handle);
    drawOwl(front, 1500, 860, 0.5);

    /** A horizontal blur about a third of the smear length looks like a streak of that length. */
    const blur = (k: number, smear: number) => blurs[k].setAttribute('stdDeviation', `${(smear / 3).toFixed(1)} 0`);
    const render = () => {
      handle.setAttribute('transform', `translate(${panToX(pan).toFixed(1)} ${SLIDER.y})`);
      handle.setAttribute('aria-valuenow', pan.toFixed(2));
      blur(0, streetSmear(pan));
      RUNNERS.forEach((_, i) => blur(i + 1, smearOf(i, pan)));
    };

    scene.draggable(handle, {
      move: (p) => {
        pan = clamp(xToPan(p.x), -PAN_MAX, PAN_MAX);
        render();
      },
      end: () => sound.paper(),
    });
    handle.addEventListener('keydown', (event) => {
      const d = { ArrowRight: 0.05, ArrowUp: 0.05, ArrowLeft: -0.05, ArrowDown: -0.05 }[event.key];
      if (!d) return;
      event.preventDefault();
      pan = clamp(pan + d, -PAN_MAX, PAN_MAX);
      render();
    });
    render();

    return {
      // Nothing is marked in the scene; the hint card shows the whole solution instead.
      revealHints: () => 0,
      hintSteps: (): HintStep[] => {
        const first = READING_ORDER[0];
        return [
          {
            note: tr('Kéo tốc độ lia máy thật chậm: khi máy lia đúng tốc độ (và chiều) của một người đang chạy, người đó hiện nét: đốm lửa thành chòm, nút tua trên đèn đếm được; còn lại nhoè thành vệt. Tìm đủ bốn người có tua.', 'Drag the panning speed very slowly: when the camera pans at the same speed (and way) as one of the runners, that runner comes out sharp: the sparks form a constellation and the tassel knots on the lantern can be counted; everything else blurs into streaks. Find all four runners with tassels.'),
            targets: [{ x: panToX(0), y: SLIDER.y, r: 50, verb: 'drag', to: { x: panToX(RUNNERS[first].speed), y: SLIDER.y }, object: '[data-hint="handle"]' }],
            apply: () => {
              pan = RUNNERS[first].speed;
              render();
            },
          },
          {
            note: tr('Người đứng yên (nét khi không lia) và người không có tua là bẫy. Đọc chòm của bốn người có tua theo số nút tua: 1, 2, 3, 4.', 'The runner standing still (sharp when not panning) and the one without a tassel are traps. Read the constellations of the four runners with tassels by their number of knots: 1, 2, 3, 4.'),
            targets: [{ x: RUNNER_X(first) + 30, y: CHOM.y, r: 100, verb: 'look' }],
            prepare: (picture) => {
              const overlay = picture.querySelector('.layer-overlay') ?? picture;
              const r = RUNNERS[first];
              const stars = placeStars(r.glyph, RUNNER_X(first) + 30, CHOM.y, CHOM.size);
              for (const [a, b] of glyph(r.glyph).lines) {
                el('line', { x1: stars[a][0], y1: stars[a][1], x2: stars[b][0], y2: stars[b][1], class: 'hint-line', 'pointer-events': 'none' }, overlay);
              }
              const badge = el('g', { transform: `translate(${RUNNER_X(first) + 30} ${CHOM.y - 100})`, 'pointer-events': 'none' }, overlay);
              el('circle', { r: 17, class: 'number-badge' }, badge);
              el('text', { y: 1, class: 'number-text' }, badge).textContent = String(r.knots);
            },
          },
        ];
      },
      destroy: () => undefined,
    };
  },
};
