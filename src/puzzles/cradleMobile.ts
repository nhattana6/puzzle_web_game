import { drawOwl } from '../core/owl';
import { glyph, placeStars, type GlyphId } from '../core/glyphs';
import { SCENE_H, SCENE_W } from '../core/scene';
import { el } from '../core/svg';
import { clamp } from '../core/tween';
import { seeded } from './sky';
import type { HintStep, PuzzleDef } from './types';

/**
 * Chapter 2, level 9 — the cradle mobile ("đồ chơi treo nôi"). Four wooden bars hang from a
 * rail by a fixed loop of string that is not at their balance point, so each tilts. Each bar
 * carries wooden stars on strings of different lengths, and a few of them are noise. On the
 * shelf are four acorns of different weights (the number of dots on each); an acorn sits in
 * one of the notches along a bar and its weight pulls the bar level. The stars hang from rings
 * that slide: on a tilted bar they all run down to its low end and bunch there, so no shape can
 * be read; only when the bar is level do they spread back out into a constellation of plain dots. Which acorn a bar needs depends on how heavy the bar is (its stars) and how far its
 * loop is from the balance point, and an acorn only fits where a notch lands near enough, so
 * the four acorns go one to a bar in only one way. The tiers are read top to bottom.
 */

export interface MobileTier {
  glyph: GlyphId;
  /** Centre of the constellation once the bar is level. */
  cx: number;
  barY: number;
  /** Extra stars, as offsets from (cx, barY) when level: not part of the shape. */
  noise: readonly (readonly [number, number])[];
  /** Where the loop sits along the bar, measured from the stars' balance point. Never zero. */
  loop: number;
}

/** Top to bottom; also left to right down the stairs. */
export const TIERS: readonly MobileTier[] = [
  { glyph: 'dipper', cx: 440, barY: 190, noise: [[-130, 45], [125, 80]], loop: -38 },
  { glyph: 'square', cx: 720, barY: 360, noise: [[-120, 85], [130, 40]], loop: -37 },
  { glyph: 'crown', cx: 1000, barY: 530, noise: [[-135, 70], [115, 95]], loop: -56 },
  { glyph: 'belt', cx: 1280, barY: 700, noise: [[-125, 55], [135, 85]], loop: 28 },
];

export const RAIL_Y = 62;
export const HALF_BAR = 175;
export const SHAPE_SIZE = 100;
export const TILT_PER_PX = 0.3;
export const MAX_TILT = 32;
/** Level when the balance point is within this many pixels of the loop. */
export const LEVEL_TOL = 5;
/** Notches along each bar, measured from the stars' balance point. */
export const NOTCHES: readonly number[] = Array.from({ length: 13 }, (_, i) => -150 + i * 25);
/** The acorns on the shelf, by weight. */
export const WEIGHTS: readonly number[] = [1, 2, 3, 4];
/** The one way they go: the acorn weight each bar takes, top to bottom. */
export const SOLUTION_WEIGHTS: readonly number[] = [3, 2, 4, 1];

export const acornRadius = (w: number): number => 12 + 5 * w;
const SHELF = { x: 250, y: 800, w: 560 };
export const shelfSpot = (i: number): [number, number] => [SHELF.x + 70 + i * 135, SHELF.y - acornRadius(WEIGHTS[i]) * 0.7];

/** The stars of a tier when level: the shape's stars first, then the noise. */
export function finalStars(t: number): [number, number][] {
  const tier = TIERS[t];
  const shape = placeStars(tier.glyph, tier.cx, tier.barY + 78, SHAPE_SIZE);
  const noise = tier.noise.map(([dx, dy]) => [tier.cx + dx, tier.barY + dy + 20] as [number, number]);
  return [...shape, ...noise];
}
export const shapeCount = (t: number): number => glyph(TIERS[t].glyph).stars.length;
export const starCount = (t: number): number => finalStars(t).length;

/** The mean x of a tier's stars when level. */
export const stringX = (t: number): number => {
  const s = finalStars(t);
  return s.reduce((a, [x]) => a + x, 0) / s.length;
};
/** Where the rope from the rail hangs: over the loop. */
export const ropeX = (t: number): number => stringX(t) + TIERS[t].loop;
/** A star's place along the bar, measured from the stars' balance point. */
export const localU = (t: number, j: number): number => finalStars(t)[j][0] - stringX(t);
/** How long the star's string is. */
export const stringLength = (t: number, j: number): number => finalStars(t)[j][1] - TIERS[t].barY;

export interface Load {
  /** Acorn weight. */
  w: number;
  /** Notch position along the bar. */
  n: number;
}

/** How far the whole bar's balance point is to the right of its loop, with the acorns on it. */
export function offsetWith(t: number, load: readonly Load[]): number {
  const total = load.reduce((s, l) => s + l.w, 0);
  const c = load.reduce((s, l) => s + l.w * l.n, 0) / (starCount(t) + total);
  return c - TIERS[t].loop;
}
export const isLevel = (offset: number): boolean => Math.abs(offset) <= LEVEL_TOL;
/** How the bar hangs (degrees, clockwise positive) for that offset: the heavy side goes down; level means exactly flat. */
export const tiltFor = (offset: number): number => (isLevel(offset) ? 0 : clamp(offset * TILT_PER_PX, -MAX_TILT, MAX_TILT));

/** The tilt (degrees) at which the stars have all run to the low end. */
export const CLUMP_TILT = 7.5;
/** How far the stars have slid toward the low end (0 spread out, 1 bunched). */
export const slideFor = (theta: number): number => clamp((Math.abs(theta) - TILT_PER_PX * LEVEL_TOL) / (CLUMP_TILT - TILT_PER_PX * LEVEL_TOL), 0, 1);
/** Spacing of the bunched stars along the bar. */
export const CLUMP_GAP = 22;
/** The order the stars sit in when bunched, fixed per tier and mixed so it gives nothing away. */
export function clumpOrder(t: number): number[] {
  const rand = seeded(900 + t * 17);
  const order = finalStars(t).map((_, j) => j);
  for (let i = order.length - 1; i > 0; i -= 1) {
    const k = Math.floor(rand() * (i + 1));
    [order[i], order[k]] = [order[k], order[i]];
  }
  return order;
}

/** Notches where acorn weight w alone levels bar t. */
export const fitting = (t: number, w: number): number[] => NOTCHES.filter((n) => isLevel(offsetWith(t, [{ w, n }])));
/** The notch of the intended solution for bar t. */
export const solutionNotch = (t: number): number => {
  const w = SOLUTION_WEIGHTS[t];
  const cands = fitting(t, w);
  return cands.reduce((best, n) => (Math.abs(offsetWith(t, [{ w, n }])) < Math.abs(offsetWith(t, [{ w, n: best }])) ? n : best), cands[0]);
};

/** How far along the bar (from the loop) star j sits when the bar is tilted `theta` degrees. */
export function alongFor(t: number, j: number, theta: number): number {
  const home = localU(t, j) - TIERS[t].loop;
  const s = slideFor(theta);
  if (s === 0) return home;
  const rank = clumpOrder(t).indexOf(j);
  const end = Math.sign(theta) * (HALF_BAR - 22 - rank * CLUMP_GAP) - TIERS[t].loop;
  return home + (end - home) * s;
}

/** Where star j of tier t hangs when the bar is tilted `theta` degrees about its loop. */
export function starWorld(t: number, j: number, theta: number): [number, number] {
  const r = (theta * Math.PI) / 180;
  const along = alongFor(t, j, theta);
  return [ropeX(t) + along * Math.cos(r), TIERS[t].barY + along * Math.sin(r) + stringLength(t, j)];
}
/** Where the star's string meets the bar. */
export function attachWorld(t: number, j: number, theta: number): [number, number] {
  const [x, y] = starWorld(t, j, theta);
  return [x, y - stringLength(t, j)];
}
/** Where an acorn of weight w sits when in notch n of bar t, which hangs at `theta` degrees (its centre). */
export function acornWorld(t: number, n: number, w: number, theta: number): [number, number] {
  const r = (theta * Math.PI) / 180;
  const along = n - TIERS[t].loop;
  const lift = 7 + acornRadius(w) * 0.85;
  return [ropeX(t) + along * Math.cos(r) + lift * Math.sin(r), TIERS[t].barY + along * Math.sin(r) - lift * Math.cos(r)];
}

/** The answer: tiers from top to bottom. */
export const READING_TIERS: readonly number[] = TIERS.map((_, i) => i);

interface TierNodes {
  bar: Element | null;
  strings: (Element | null)[];
  stars: (Element | null)[];
}

/** Moves one tier's drawn parts to tilt theta; used by the scene and by the hint pictures. */
function layoutTier(nodes: TierNodes, t: number, theta: number): void {
  nodes.bar?.setAttribute('transform', `translate(${ropeX(t).toFixed(1)} ${TIERS[t].barY}) rotate(${theta.toFixed(2)}) translate(${(-TIERS[t].loop).toFixed(1)} 0)`);
  nodes.strings.forEach((line, j) => {
    const [ax, ay] = attachWorld(t, j, theta);
    const [x, y] = starWorld(t, j, theta);
    line?.setAttribute('x1', ax.toFixed(1));
    line?.setAttribute('y1', ay.toFixed(1));
    line?.setAttribute('x2', x.toFixed(1));
    line?.setAttribute('y2', y.toFixed(1));
    nodes.stars[j]?.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
  });
}

export const cradleMobile: PuzzleDef = {
  id: 'cradle-mobile',
  name: 'Đồ chơi treo nôi',
  answer: READING_TIERS.map((t) => TIERS[t].glyph),
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    /** Where each acorn is: on a bar notch, or free at a position (on the shelf or in the hand). */
    const placed: ({ bar: number; n: number } | null)[] = WEIGHTS.map(() => null);
    const free: [number, number][] = WEIGHTS.map((_, i) => shelfSpot(i));
    const target = TIERS.map(() => 0);
    const shown = TIERS.map(() => 0);
    let raf = 0;

    const loadOf = (t: number): Load[] =>
      placed.flatMap((p, i) => (p && p.bar === t ? [{ w: WEIGHTS[i], n: p.n }] : []));
    const retarget = () => TIERS.forEach((_, t) => { target[t] = tiltFor(offsetWith(t, loadOf(t))); });
    retarget();
    shown.forEach((_, t) => { shown[t] = target[t]; });

    // Back: the nursery wall.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#241a17' }, back);
    for (let x = 80; x < SCENE_W; x += 160) el('line', { x1: x, y1: -20, x2: x, y2: SCENE_H + 20, stroke: '#1a1210', 'stroke-width': 4 }, back);
    el('rect', { x: -60, y: 850, width: SCENE_W + 120, height: 120, fill: '#3a2a22' }, back);
    scene.grain('back', 0.4);

    // Mid: the rail, then each tier's rope, bar with its notches, strings and stars.
    el('rect', { x: 250, y: RAIL_Y - 22, width: 1320, height: 26, rx: 8, fill: '#5a3f2a', stroke: '#3a2818', 'stroke-width': 4 }, mid);
    const tierNodes: TierNodes[] = TIERS.map((tier, t) => {
      const sx = ropeX(t);
      el('line', { x1: sx, y1: RAIL_Y, x2: sx, y2: tier.barY, stroke: '#8a6a48', 'stroke-width': 4 }, mid);
      const stringsLayer = el('g', { 'pointer-events': 'none' }, mid);
      const finals = finalStars(t);
      const strings = finals.map((_, j) => el('line', { stroke: '#8a6a48', 'stroke-width': 2, 'data-string': `${t}-${j}` }, stringsLayer));
      const bar = el('g', { 'data-bar': t, 'pointer-events': 'none' }, mid);
      el('rect', { x: -HALF_BAR, y: -7, width: HALF_BAR * 2, height: 14, rx: 7, fill: '#a6794a', stroke: '#6b4a2a', 'stroke-width': 3 }, bar);
      for (const n of NOTCHES) el('rect', { x: n - 1.5, y: -7, width: 3, height: 9, fill: '#6b4a2a' }, bar);
      el('circle', { cx: -HALF_BAR, cy: 0, r: 9, fill: '#6b4a2a' }, bar);
      el('circle', { cx: HALF_BAR, cy: 0, r: 9, fill: '#6b4a2a' }, bar);
      const starLayer = el('g', { 'pointer-events': 'none' }, mid);
      const stars = finals.map((_, j) => {
        const g = el('g', { 'data-star': `${t}-${j}` }, starLayer);
        el('circle', { r: 11, fill: '#f3d9a4', stroke: '#8a6a48', 'stroke-width': 3 }, g);
        return g;
      });
      // The loop of string around the bar.
      el('circle', { cx: sx, cy: tier.barY, r: 11, fill: 'none', stroke: '#e2c28a', 'stroke-width': 4, 'pointer-events': 'none' }, mid);
      return { bar, strings, stars };
    });

    // The shelf and the acorns on it.
    el('rect', { x: SHELF.x, y: SHELF.y, width: SHELF.w, height: 22, rx: 6, fill: '#5a3f2a', stroke: '#3a2818', 'stroke-width': 4 }, mid);
    const acornNodes = WEIGHTS.map((w, i) => {
      const r = acornRadius(w);
      const g = el('g', { class: 'acorn interactive', tabindex: 0, role: 'button', 'aria-label': `Quả nặng ${w} chấm`, 'data-hint': `acorn-${i}` }, mid);
      el('circle', { r: r + 10, fill: 'transparent' }, g);
      el('ellipse', { cx: 0, cy: r * 0.15, rx: r * 0.9, ry: r, fill: '#a0703c', stroke: '#6b4a2a', 'stroke-width': 3 }, g);
      el('path', { d: `M${-r} ${-r * 0.35} Q0 ${-r * 1.5} ${r} ${-r * 0.35} Z`, fill: '#6b4a2a' }, g);
      el('rect', { x: -2.5, y: -r * 1.35, width: 5, height: r * 0.4, rx: 2, fill: '#4a3220' }, g);
      for (let d = 0; d < w; d += 1) {
        el('circle', { cx: (d - (w - 1) / 2) * 11, cy: r * 0.45, r: 4, fill: '#f6efd8' }, g);
      }
      return g;
    });
    drawOwl(front, 120, 790, 0.9);

    const render = () => {
      TIERS.forEach((_, t) => layoutTier(tierNodes[t], t, shown[t]));
      acornNodes.forEach((node, i) => {
        const p = placed[i];
        const [x, y] = p ? acornWorld(p.bar, p.n, WEIGHTS[i], shown[p.bar]) : free[i];
        node.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${p ? shown[p.bar].toFixed(1) : 0})`);
      });
    };
    render();

    // The bars swing to their new tilt rather than jump.
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      let moving = false;
      TIERS.forEach((_, t) => {
        if (Math.abs(target[t] - shown[t]) > 0.02) {
          shown[t] += (target[t] - shown[t]) * Math.min(1, dt * 7);
          moving = true;
        }
      });
      if (moving) render();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    /** The nearest free notch to a point, within reach, or null. */
    const notchNear = (i: number, x: number, y: number): { bar: number; n: number } | null => {
      let best: { bar: number; n: number } | null = null;
      let bestD = 60;
      TIERS.forEach((_, t) => {
        for (const n of NOTCHES) {
          if (placed.some((p, k) => k !== i && p && p.bar === t && p.n === n)) continue;
          const [px, py] = acornWorld(t, n, WEIGHTS[i], shown[t]);
          const d = Math.hypot(px - x, py - y);
          if (d < bestD) {
            bestD = d;
            best = { bar: t, n };
          }
        }
      });
      return best;
    };

    acornNodes.forEach((node, i) => {
      let grab = [0, 0];
      scene.draggable(node, {
        start: (p) => {
          const at = placed[i] ? acornWorld(placed[i]!.bar, placed[i]!.n, WEIGHTS[i], shown[placed[i]!.bar]) : free[i];
          free[i] = [at[0], at[1]];
          placed[i] = null;
          grab = [p.x - at[0], p.y - at[1]];
          node.parentNode?.appendChild(node);
          retarget();
          render();
        },
        move: (p) => {
          free[i] = [clamp(p.x - grab[0], 40, SCENE_W - 40), clamp(p.y - grab[1], 60, SCENE_H - 20)];
          render();
        },
        end: () => {
          const spot = notchNear(i, free[i][0], free[i][1]);
          if (spot) {
            placed[i] = spot;
            sound.knock();
          } else {
            free[i] = shelfSpot(i);
            sound.paper();
          }
          retarget();
          render();
        },
      });
      // Keys: up and down choose a bar (or the shelf), left and right a notch.
      node.addEventListener('keydown', (event) => {
        const cur = placed[i];
        const keyMap: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
        const m = keyMap[event.key];
        if (!m) return;
        event.preventDefault();
        let bar = cur ? cur.bar : -1;
        let n = cur ? NOTCHES.indexOf(cur.n) : Math.floor(NOTCHES.length / 2);
        bar = clamp(bar + m[0], -1, TIERS.length - 1);
        n = clamp(n + m[1], 0, NOTCHES.length - 1);
        if (bar < 0) {
          placed[i] = null;
          free[i] = shelfSpot(i);
        } else if (!placed.some((p, k) => k !== i && p && p.bar === bar && p.n === NOTCHES[n])) {
          placed[i] = { bar, n: NOTCHES[n] };
        }
        retarget();
        render();
      });
    });

    return {
      // Nothing is marked in the scene; the hint card shows the whole solution instead.
      revealHints: () => 0,
      hintSteps: (): HintStep[] => {
        const bar = 0;
        const w = SOLUTION_WEIGHTS[bar];
        const acorn = WEIGHTS.indexOf(w);
        const from = shelfSpot(acorn);
        const dest = acornWorld(bar, solutionNotch(bar), w, 0);
        return [
          {
            note: 'Thanh nghiêng thì các ngôi sao trượt dồn về đầu thấp. Đặt quả nặng lên một nấc để thanh nằm ngang: quả càng nhẹ càng phải đặt xa vòng dây, thanh càng nặng (nhiều sao) càng cần quả to. Mỗi thanh cần một quả khác nhau, làm tương tự với các thanh còn lại.',
            targets: [{ x: from[0], y: from[1], r: 50, verb: 'drag', to: { x: dest[0], y: dest[1] }, object: `[data-hint="acorn-${acorn}"]` }],
            apply: () => {
              SOLUTION_WEIGHTS.forEach((sw, t) => {
                placed[WEIGHTS.indexOf(sw)] = { bar: t, n: solutionNotch(t) };
              });
              retarget();
              TIERS.forEach((_, t) => { shown[t] = target[t]; });
              render();
            },
          },
          {
            note: 'Cả bốn thanh nằm ngang thì các ngôi sao trải ra thành chòm. Đọc các tầng từ trên xuống dưới (cũng là từ trái sang phải); bỏ những ngôi sao lẻ ở xa.',
            targets: TIERS.map((tier) => ({ x: tier.cx, y: tier.barY + 78, r: 90, verb: 'look' as const })),
          },
        ];
      },
      destroy: () => cancelAnimationFrame(raf),
    };
  },
};
