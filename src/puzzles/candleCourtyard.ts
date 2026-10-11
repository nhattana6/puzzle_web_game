import { DEF, url } from '../core/defs';
import { SCENE_H, SCENE_W } from '../core/scene';
import { asButton, el, pips, uid } from '../core/svg';
import { clamp, tween } from '../core/tween';
import { drawZodiac, type ZodiacId } from '../core/zodiac';
import type { HintTarget, PuzzleDef } from './types';

/**
 * Level 3 — the courtyard at dusk ("bóng sân chiều").
 * Four paper cut-outs hang on a string; each carries one vertical slice of three
 * animals. A cut-out hung in the wrong place throws its slice off to the side, so
 * the cut-outs must first be put back in order (tap two to swap them). Then the
 * candle has to be slid to three different spots: at each one the shadows of one
 * animal fall together, with dots giving its place in the answer.
 * The answer order is deliberately neither the left-to-right order on the wall
 * nor the order the candle meets them.
 */

export const CANDLE_MIN = 180;
export const CANDLE_MAX = 1420;
export const CANDLE_START = 220;
/** How strongly a shadow moves with the candle, by place on the string (left → right). */
export const DEPTHS: readonly number[] = [0.3, 0.7, 1.15, 1.6];
/** Sideways throw of a slice per place it is away from home. */
export const MISPLACE = 150;
export const SNAP = 18;
/** Which cut-out hangs in each place at the start. Solved order is [0, 1, 2, 3]. */
export const INITIAL_ORDER: readonly number[] = [2, 0, 3, 1];

export interface CourtyardTarget {
  animal: ZodiacId;
  wallX: number;
  candleX: number;
  /** Place in the answer, shown as dots when the shadow is complete. */
  order: number;
}

export const TARGETS: readonly CourtyardTarget[] = [
  { animal: 'goat', wallX: 330, candleX: 1150, order: 2 },
  { animal: 'ox', wallX: 800, candleX: 330, order: 3 },
  { animal: 'dog', wallX: 1270, candleX: 740, order: 1 },
];

export const shadowOffset = (candleX: number, focusX: number, depth: number): number =>
  (focusX - candleX) * depth;

export const isOrderRestored = (order: readonly number[]): boolean => order.every((tag, place) => tag === place);

/** Horizontal shift of a cut-out's slice on the wall, relative to the finished shadow. */
export function sliceShift(candleX: number, target: CourtyardTarget, tag: number, order: readonly number[]): number {
  const place = order.indexOf(tag);
  return shadowOffset(candleX, target.candleX, DEPTHS[place]) + (place - tag) * MISPLACE;
}

/** The animal whose shadow is complete, if any. */
export function alignedTarget(candleX: number, order: readonly number[]): CourtyardTarget | null {
  if (!isOrderRestored(order)) return null;
  return TARGETS.find((t) => Math.abs(candleX - t.candleX) <= SNAP) ?? null;
}

/**
 * Each hint shows where one more cut-out belongs. Prefer one that is hanging in the
 * wrong place right now (lowest number first); once those are all shown, any other.
 */
export function nextTagToReveal(order: readonly number[], revealed: ReadonlySet<number>): number | null {
  const hidden = order.map((_, tag) => tag).filter((tag) => !revealed.has(tag));
  return hidden.find((tag) => order.indexOf(tag) !== tag) ?? hidden[0] ?? null;
}

export type CourtyardHint = { kind: 'tag'; tag: number } | { kind: 'spot'; target: number };

/**
 * Each hint helps with one thing still wrong: first one misplaced cut-out (where it
 * belongs); once the cut-outs are in order, one candle spot not found yet.
 */
export function nextCourtyardHint(
  order: readonly number[],
  revealed: readonly CourtyardHint[],
  found: ReadonlySet<number>,
): CourtyardHint | null {
  const tagsShown = new Set(revealed.flatMap((h) => (h.kind === 'tag' ? [h.tag] : [])));
  const tag = nextTagToReveal(order, tagsShown);
  if (tag !== null && order.indexOf(tag) !== tag) return { kind: 'tag', tag };
  const spotsShown = new Set(revealed.flatMap((h) => (h.kind === 'spot' ? [h.target] : [])));
  const spot = TARGETS.findIndex((_, i) => !spotsShown.has(i) && !found.has(i));
  return spot !== -1 ? { kind: 'spot', target: spot } : null;
}

export function swapTags(order: readonly number[], a: number, b: number): number[] {
  const next = [...order];
  [next[a], next[b]] = [next[b], next[a]];
  return next;
}

const WALL_Y = 330;
const SHADOW_SCALE = 2.6;
const BAND = 100 / DEPTHS.length;
const FLOOR_Y = 790;
const PLACES = [
  { x: 470, y: 477 },
  { x: 690, y: 488 },
  { x: 910, y: 488 },
  { x: 1130, y: 477 },
];
const TAG_SIZE = 58;

export const candleCourtyard: PuzzleDef = {
  id: 'c1-candle-courtyard',
  name: 'Bóng sân chiều',
  answer: [...TARGETS].sort((a, b) => a.order - b.order).map((t) => t.animal),
  guide: {
    goal: 'Làm cho bóng trên tường ghép thành 3 con giáp.',
    steps: [
      { icon: 'tap', text: '4 tấm giấy cắt đang treo sai chỗ. Bấm một tấm rồi bấm một tấm khác để đổi chỗ hai tấm.' },
      { icon: 'drag', text: 'Kéo cây nến dọc thanh gỗ. Bóng của mỗi tấm giấy dịch đi một khoảng khác nhau.' },
      { icon: 'marks', text: 'Khi các tấm đúng thứ tự và nến đúng chỗ, bóng một con giáp liền lại, có dấu ◆ phía trên. Có 3 chỗ đặt nến như vậy.' },
    ],
    tip: 'Tấm giấy treo sai chỗ làm mảnh bóng của nó lệch hẳn sang một bên. Mỗi lần gợi ý cho biết chỗ đúng (số 1–4 trên dây) của một tấm; khi giấy đã đúng hết thì cho biết một chỗ đặt nến. Thứ tự ◆ không giống thứ tự trái → phải.',
  },
  fireflies: [
    { id: 'c1-candle-courtyard/roof', layer: 'back', x: 1450, y: 60 },
    { id: 'c1-candle-courtyard/rail', layer: 'front', x: 120, y: 860 },
  ],
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    let candleX = CANDLE_START;
    let order = [...INITIAL_ORDER];
    let aligned: CourtyardTarget | null = null;
    let selected: number | null = null;
    let cancelSnap: (() => void) | null = null;
    const cancelSwaps: (() => void)[] = [];

    // Back: plaster wall lit by the candle, tiled roof edge.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#4a3d33' }, back);
    const lightId = uid('candle-light');
    const gradient = el('radialGradient', { id: lightId }, scene.defs);
    el('stop', { offset: 0, 'stop-color': '#f8e6bb', 'stop-opacity': 0.95 }, gradient);
    el('stop', { offset: 0.45, 'stop-color': '#dcbc8c', 'stop-opacity': 0.6 }, gradient);
    el('stop', { offset: 1, 'stop-color': '#4a3d33', 'stop-opacity': 0 }, gradient);
    const light = el('ellipse', { cx: candleX, cy: 620, rx: 780, ry: 600, fill: url(lightId) }, back);

    const shadows = el('g', { filter: url(DEF.softShadow), opacity: 0.82 }, back);
    shadows.style.color = '#221a15';
    const bandClips = DEPTHS.map((_, i) => {
      const id = uid('band');
      const clip = el('clipPath', { id }, scene.defs);
      el('rect', { x: i * BAND - 0.05, y: -20, width: BAND + 0.1, height: 140 }, clip);
      return id;
    });
    const slices = TARGETS.map((target) =>
      DEPTHS.map((_, tag) => {
        const slice = el('g', {}, shadows);
        drawZodiac(el('g', { 'clip-path': url(bandClips[tag]) }, slice), target.animal);
        return slice;
      }),
    );
    // Light leaking through small holes in the cut-outs: the order dots.
    const targetPips = TARGETS.map((t) => pips(back, t.order, t.wallX, 192, 8, 26, { opacity: 0, fill: '#fff4d2', filter: url(DEF.glow) }));

    let roof = 'M-60 -60 L1660 -60 L1660 96';
    for (let x = 1660; x > -60; x -= 64) roof += ` Q${x - 32} 136 ${x - 64} 96`;
    el('path', { d: `${roof} Z`, fill: '#2b2622' }, back);
    el('rect', { x: -60, y: 96, width: SCENE_W + 120, height: 10, fill: '#5a4636' }, back);
    scene.grain('back', 0.8);

    // Mid: the string with four paper cut-outs, swaying a little.
    el('path', { d: 'M40 400 Q800 540 1560 400', fill: 'none', stroke: '#2b2622', 'stroke-width': 3 }, mid);
    // Hint: numbered pegs on the string, and on each cut-out the number of the peg it belongs on.
    const numbers = el('g', { opacity: 0, class: 'place-numbers' }, mid);
    PLACES.forEach((place, i) => {
      const peg = el('g', { transform: `translate(${place.x} ${place.y - 64})` }, numbers);
      el('circle', { r: 17, class: 'number-badge' }, peg);
      el('text', { y: 1, class: 'number-text' }, peg).textContent = String(i + 1);
    });
    const tagPos = INITIAL_ORDER.map(() => ({ x: 0, y: 0 }));
    order.forEach((tag, place) => (tagPos[tag] = { ...PLACES[place] }));
    const tags = DEPTHS.map((_, tag) => {
      const g = el('g', { class: 'tag interactive' }, mid);
      el('line', { x1: 0, y1: -26, x2: 0, y2: 0, stroke: '#2b2622', 'stroke-width': 2 }, g);
      el('rect', {
        x: -TAG_SIZE / 2, y: 0, width: TAG_SIZE, height: TAG_SIZE * 1.25, rx: 3,
        fill: '#eadcbc', stroke: '#8a6a45', 'stroke-width': 2, filter: url(DEF.rough), class: 'tag-paper',
      }, g);
      for (let h = 0; h < 5; h += 1) {
        el('circle', {
          cx: -TAG_SIZE / 3 + ((h * 37 + tag * 13) % TAG_SIZE) * 0.66,
          cy: 12 + ((h * 53 + tag * 29) % TAG_SIZE),
          r: 3 + ((h + tag) % 3) * 2,
          fill: '#4a3d33',
        }, g);
      }
      const badge = el('g', { opacity: 0, transform: `translate(${TAG_SIZE / 2 - 2} 6)`, class: 'tag-number' }, g);
      el('circle', { r: 14, class: 'number-badge' }, badge);
      el('text', { y: 1, class: 'number-text' }, badge).textContent = String(tag + 1);
      asButton(g, `Tấm giấy cắt ${tag + 1}`, () => onTag(tag));
      return { g, badge };
    });

    /** What hints have pointed out so far, one entry per hint bought. */
    const revealed: CourtyardHint[] = [];
    /** Candle spots the player has already lit up. */
    const found = new Set<number>();
    /** A cut-out already hanging on its own peg shows its number in gold. */
    const markPlaced = () => tags.forEach(({ badge }, tag) => badge.classList.toggle('placed', order[tag] === tag));
    markPlaced();

    function onTag(tag: number) {
      if (selected === null) {
        selected = tag;
        sound.paper();
      } else if (selected === tag) {
        selected = null;
      } else {
        const a = order.indexOf(selected);
        const b = order.indexOf(tag);
        order = swapTags(order, a, b);
        selected = null;
        sound.knock();
        for (const moved of [order[a], order[b]]) {
          const from = { ...tagPos[moved] };
          const to = PLACES[order.indexOf(moved)];
          cancelSwaps[moved]?.();
          cancelSwaps[moved] = tween(380, (t) => {
            tagPos[moved] = { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t - Math.sin(t * Math.PI) * 50 };
          });
        }
        render();
      }
      tags.forEach(({ g }, i) => g.classList.toggle('selected', i === selected));
      markPlaced();
    }

    // Front: floor, rail and the candle.
    el('rect', { x: -60, y: FLOOR_Y, width: SCENE_W + 120, height: 200, fill: '#2b2622' }, front);
    el('rect', { x: CANDLE_MIN - 50, y: FLOOR_Y + 14, width: CANDLE_MAX - CANDLE_MIN + 100, height: 14, rx: 7, fill: '#6b4f36' }, front);
    const railMarks = TARGETS.map((target) =>
      el('circle', { cx: target.candleX, cy: FLOOR_Y + 21, r: 10, fill: '#f4c66a', filter: url(DEF.glow), opacity: 0 }, front));
    const candle = el('g', { class: 'candle interactive', tabindex: 0, role: 'slider', 'aria-label': 'Nến' }, front);
    el('rect', { x: -60, y: 600, width: 120, height: 215, fill: 'transparent' }, candle);
    el('ellipse', { cx: 0, cy: FLOOR_Y + 8, rx: 38, ry: 9, fill: '#8a6a45' }, candle);
    el('rect', { x: -15, y: 712, width: 30, height: 84, rx: 4, fill: '#efe6d2', stroke: '#b9a27f', 'stroke-width': 2 }, candle);
    el('line', { x1: 0, y1: 712, x2: 0, y2: 700, stroke: '#2b2622', 'stroke-width': 2 }, candle);
    el('path', { d: 'M0 650 Q17 682 0 706 Q-17 682 0 650 Z', fill: '#f4c66a', filter: url(DEF.glow), class: 'flame' }, candle);
    candle.setAttribute('aria-valuemin', String(CANDLE_MIN));
    candle.setAttribute('aria-valuemax', String(CANDLE_MAX));

    const render = () => {
      candle.setAttribute('transform', `translate(${candleX.toFixed(1)} 0)`);
      candle.setAttribute('aria-valuenow', String(Math.round(candleX)));
      light.setAttribute('cx', candleX.toFixed(1));
      TARGETS.forEach((target, t) => {
        DEPTHS.forEach((_, tag) => {
          const dx = target.wallX - 50 * SHADOW_SCALE + sliceShift(candleX, target, tag, order);
          slices[t][tag].setAttribute('transform', `translate(${dx.toFixed(1)} ${WALL_Y - 55 * SHADOW_SCALE}) scale(${SHADOW_SCALE})`);
        });
      });
      const now = alignedTarget(candleX, order);
      if (now) found.add(TARGETS.indexOf(now));
      if (now && now !== aligned) sound.chime();
      aligned = now;
      targetPips.forEach((p, i) => p.setAttribute('opacity', TARGETS[i] === aligned ? '1' : '0'));
    };

    const moveTo = (x: number) => {
      candleX = clamp(x, CANDLE_MIN, CANDLE_MAX);
      render();
    };

    const snap = () => {
      const target = TARGETS.find((t) => Math.abs(candleX - t.candleX) <= SNAP * 1.6);
      if (!target) return;
      const from = candleX;
      cancelSnap?.();
      cancelSnap = tween(220, (t) => moveTo(from + (target.candleX - from) * t));
    };

    let grab = 0;
    scene.draggable(candle, {
      start: (p) => {
        cancelSnap?.();
        grab = p.x - candleX;
      },
      move: (p) => moveTo(p.x - grab),
      end: snap,
    });
    candle.addEventListener('keydown', (event) => {
      const step = event.shiftKey ? 40 : 10;
      if (event.key === 'ArrowLeft') moveTo(candleX - step);
      else if (event.key === 'ArrowRight') moveTo(candleX + step);
      else return;
      event.preventDefault();
    });

    let frame = 0;
    const sway = (now: number) => {
      tags.forEach(({ g }, tag) => {
        const angle = Math.sin(now / 900 + tag * 1.7) * 2.2;
        const { x, y } = tagPos[tag];
        g.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${angle.toFixed(2)} 0 -26)`);
      });
      frame = requestAnimationFrame(sway);
    };
    frame = requestAnimationFrame(sway);
    render();

    return {
      revealHints: (count) => {
        while (revealed.length < count) {
          const hint = nextCourtyardHint(order, revealed, found);
          if (!hint) break;
          revealed.push(hint);
          if (hint.kind === 'tag') {
            tags[hint.tag].badge.setAttribute('opacity', '1');
            numbers.setAttribute('opacity', '1');
          } else {
            railMarks[hint.target].setAttribute('opacity', '1');
          }
        }
        return revealed.length;
      },
      hintTargets: () => revealed.flatMap((hint): HintTarget[] => {
        if (hint.kind === 'tag') {
          if (order[hint.tag] === hint.tag) return [];
          const { x, y } = tagPos[hint.tag];
          return [{ x, y: y + 36, r: 52, verb: 'tap' }];
        }
        if (found.has(hint.target)) return [];
        return [{ x: TARGETS[hint.target].candleX, y: FLOOR_Y + 21, r: 40, verb: 'drag' }];
      }),
      destroy: () => {
        cancelSnap?.();
        cancelSwaps.forEach((cancel) => cancel?.());
        cancelAnimationFrame(frame);
      },
    };
  },
};
