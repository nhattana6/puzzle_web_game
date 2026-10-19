import { drawOwl } from '../core/owl';
import type { GlyphId } from '../core/glyphs';
import { glyph, placeStars } from '../core/glyphs';
import { SCENE_H, SCENE_W } from '../core/scene';
import { el, uid } from '../core/svg';
import { url } from '../core/defs';
import { clamp } from '../core/tween';
import { dist, seeded } from './sky';
import type { HintStep, PuzzleDef } from './types';
import { tr } from '../core/i18n';

/**
 * Chapter 2, level 3 — the marble tray ("khay bi"). A wooden tray pitted with faint
 * dimples holds eight glass marbles. Tip it toward a corner and the marbles roll there
 * and settle in that corner's dimples: five, four, six or three of them make a
 * constellation of plain dots, and the rest come to rest in dimples spread over the rest
 * of the tray (never piled in a corner, where they would read as a count). Each corner
 * has a different constellation and a row of one to four drilled holes in the rim beside
 * it; the answer reads the corners by those holes. No lines, no glow, no chime.
 */

export const TRAY = { x: 800, y: 450, half: 320, rim: 36 };
export const MARBLE_R = 17;
export const DIMPLE_R = 21;
export const MARBLES = 8;
const CONSTELLATION_SIZE = 190;
const CENTRE_DEAD = 30;

export interface Corner {
  glyph: GlyphId;
  /** Drilled holes in the rim beside this corner, which give the reading order. */
  holes: number;
  /** Which way the corner lies from the middle: -1 is left / up, 1 is right / down. */
  sx: -1 | 1;
  sy: -1 | 1;
}

/** Top-left, top-right, bottom-right, bottom-left. */
export const CORNERS: readonly Corner[] = [
  { glyph: 'hook', holes: 3, sx: -1, sy: -1 },
  { glyph: 'cross', holes: 1, sx: 1, sy: -1 },
  { glyph: 'triangle', holes: 4, sx: 1, sy: 1 },
  { glyph: 'square', holes: 2, sx: -1, sy: 1 },
];

/** The inner corner of the playing surface. */
export const cornerPoint = (c: number): [number, number] => {
  const k = CORNERS[c];
  const e = TRAY.half - TRAY.rim;
  return [TRAY.x + k.sx * e, TRAY.y + k.sy * e];
};

/** Centre of the constellation in a corner. */
export const constellationCentre = (c: number): [number, number] => {
  const [px, py] = cornerPoint(c);
  return [px - CORNERS[c].sx * 175, py - CORNERS[c].sy * 175];
};

/** Where a corner's constellation stars rest (one marble each). */
export const starSpots = (c: number): [number, number][] => {
  const [x, y] = constellationCentre(c);
  return placeStars(CORNERS[c].glyph, x, y, CONSTELLATION_SIZE);
};

/** Which corner a touch at (x, y) tips the tray toward, or -1 near the middle. */
export function cornerFor(x: number, y: number): number {
  const dx = x - TRAY.x;
  const dy = y - TRAY.y;
  if (Math.abs(dx) < CENTRE_DEAD && Math.abs(dy) < CENTRE_DEAD) return -1;
  return CORNERS.findIndex((k) => Math.sign(dx || k.sx) === k.sx && Math.sign(dy || k.sy) === k.sy);
}

/** The answer: corners by the number of holes beside them. */
export const READING_CORNERS: readonly number[] = CORNERS.map((_, i) => i).sort((a, b) => CORNERS[a].holes - CORNERS[b].holes);

/** Every constellation star's resting place, all corners. */
const needed = (): [number, number][] => CORNERS.flatMap((_, c) => starSpots(c));

/** The faint dimples across the tray: every resting place plus a scatter of others, all drawn alike. */
export const DIMPLES: readonly [number, number][] = (() => {
  const rand = seeded(3141);
  const out: [number, number][] = needed();
  const lim = TRAY.half - TRAY.rim - 30;
  for (let tries = 0; tries < 6000 && out.length < 70; tries += 1) {
    const x = TRAY.x + (rand() * 2 - 1) * lim;
    const y = TRAY.y + (rand() * 2 - 1) * lim;
    if (out.some(([ox, oy]) => dist(x, y, ox, oy) < 52)) continue;
    out.push([x, y]);
  }
  return out;
})();

/** The marbles at the start: scattered in dimples far from every constellation. */
export const START_SPOTS: readonly [number, number][] = (() => {
  const rand = seeded(2718);
  const hollows = needed();
  const free = DIMPLES.slice(hollows.length).filter(([x, y]) => hollows.every(([hx, hy]) => dist(x, y, hx, hy) > 70));
  const picked: [number, number][] = [];
  while (picked.length < MARBLES && free.length) picked.push(free.splice(Math.floor(rand() * free.length), 1)[0]);
  return picked;
})();

/** How far the marbles that are not part of a constellation rest from it, and from each other. */
export const EXTRA_CLEARANCE = 110;

const extrasCache = new Map<number, [number, number][]>();
/**
 * Where the marbles that are not part of corner c's constellation come to rest: in ordinary
 * dimples spread over the tray, far from the constellation and from each other. Never in the
 * resting places of any constellation, so they cannot half-draw another one.
 */
export function extraSpots(c: number): [number, number][] {
  const cached = extrasCache.get(c);
  if (cached) return cached;
  const stars = starSpots(c);
  const wanted = MARBLES - stars.length;
  const plain = DIMPLES.slice(needed().length).filter(([x, y]) => stars.every(([sx, sy]) => dist(x, y, sx, sy) >= EXTRA_CLEARANCE));
  const rand = seeded(500 + c);
  const picked: [number, number][] = [];
  const pool = [...plain];
  if (pool.length) picked.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  // Farthest-point picking keeps them spread out, so no cluster of them can pass for a shape.
  while (picked.length < wanted && pool.length) {
    let best = 0;
    let bestGap = -1;
    pool.forEach(([x, y], i) => {
      const gap = Math.min(...picked.map(([px, py]) => dist(x, y, px, py)));
      if (gap > bestGap) {
        bestGap = gap;
        best = i;
      }
    });
    picked.push(pool.splice(best, 1)[0]);
  }
  extrasCache.set(c, picked);
  return picked;
}

/** Where each of the eight marbles lies once the tray has been tipped to corner c: stars first. */
export function marbleSpots(c: number): [number, number][] {
  return [...starSpots(c), ...extraSpots(c)];
}

/** The spots the marbles are at for a state: null is the start, otherwise the corner they were tipped to. */
export const marblesAt = (corner: number | null): [number, number][] =>
  corner === null ? START_SPOTS.map(([x, y]) => [x, y]) : marbleSpots(corner);

/** Drilled-hole positions in the rim for corner c. */
export function holeSpots(c: number): [number, number][] {
  const k = CORNERS[c];
  const y = TRAY.y + k.sy * (TRAY.half - TRAY.rim / 2);
  const x0 = TRAY.x + k.sx * (TRAY.half - 62);
  return Array.from({ length: k.holes }, (_, i) => [x0 - k.sx * i * 26, y] as [number, number]);
}

export const marbleTray: PuzzleDef = {
  id: 'marble-tray',
  get name() {
    return tr('Khay bi', 'Marble Tray');
  },
  answer: READING_CORNERS.map((c) => CORNERS[c].glyph),
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    let corner: number | null = null;
    let tilt = -1;
    let shown: [number, number][] = marblesAt(null);
    let anim: { from: [number, number][]; to: [number, number][]; t: number } | null = null;

    // Back: the attic wall and a table under the tray.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#241a17' }, back);
    for (let x = 80; x < SCENE_W; x += 160) el('line', { x1: x, y1: -20, x2: x, y2: SCENE_H + 20, stroke: '#1a1210', 'stroke-width': 4 }, back);
    el('rect', { x: -60, y: 828, width: SCENE_W + 120, height: 120, fill: '#3a2a22' }, back);
    scene.grain('back', 0.4);

    // Mid: the tray, its rim holes, the pattern, the dimples, the marbles.
    const o = TRAY.half;
    const inner = TRAY.half - TRAY.rim;
    el('rect', { x: TRAY.x - o, y: TRAY.y - o, width: o * 2, height: o * 2, rx: 14, fill: '#6b4a30', stroke: '#4a3220', 'stroke-width': 6 }, mid);
    el('rect', { x: TRAY.x - inner, y: TRAY.y - inner, width: inner * 2, height: inner * 2, rx: 6, fill: '#4a3322' }, mid);
    const hit = el('rect', {
      x: TRAY.x - o, y: TRAY.y - o, width: o * 2, height: o * 2, rx: 14, fill: 'transparent', class: 'tray interactive',
      tabindex: 0, role: 'button', 'aria-label': tr('Khay bi: chạm hoặc kéo về một góc để nghiêng, hoặc dùng phím mũi tên', 'Marble tray: tap or drag toward a corner to tilt it, or use the arrow keys'), 'data-hint': 'tray',
    }, mid);

    // A tangle of faint grooves, so the dimples are not seen as a pattern of their own.
    const rand = seeded(99);
    const grooves = el('g', { fill: 'none', stroke: '#5a4030', 'stroke-width': 5, 'stroke-linecap': 'round', 'pointer-events': 'none' }, mid);
    for (let i = 0; i < 12; i += 1) {
      const x = TRAY.x + (rand() * 2 - 1) * inner * 0.9;
      const y = TRAY.y + (rand() * 2 - 1) * inner * 0.9;
      el('path', { d: `M${x} ${y} q${(rand() - 0.5) * 220} ${(rand() - 0.5) * 220} ${(rand() - 0.5) * 300} ${(rand() - 0.5) * 300}` }, grooves);
    }
    const dimples = el('g', { 'pointer-events': 'none' }, mid);
    for (const [x, y] of DIMPLES) el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: DIMPLE_R, fill: '#3a281b', stroke: '#2e1f15', 'stroke-width': 2 }, dimples);

    // Drilled holes in the rim: one, two, three, four.
    const rim = el('g', { 'pointer-events': 'none' }, mid);
    CORNERS.forEach((_, c) => {
      for (const [x, y] of holeSpots(c)) el('circle', { cx: x, cy: y, r: 8, fill: '#1a1009', stroke: '#8a6a48', 'stroke-width': 2 }, rim);
    });

    // The corner that is low gets a soft shade while the tray is held tipped.
    const clipId = uid('tray-clip');
    el('rect', { x: TRAY.x - inner, y: TRAY.y - inner, width: inner * 2, height: inner * 2 }, el('clipPath', { id: clipId }, scene.defs));
    const shadeGradient = uid('shade');
    const g = el('radialGradient', { id: shadeGradient }, scene.defs);
    el('stop', { offset: 0, 'stop-color': '#000', 'stop-opacity': 0.4 }, g);
    el('stop', { offset: 1, 'stop-color': '#000', 'stop-opacity': 0 }, g);
    const shades = CORNERS.map((_, c) => {
      const [px, py] = cornerPoint(c);
      const node = el('circle', { cx: px, cy: py, r: 300, fill: url(shadeGradient), 'clip-path': url(clipId), 'pointer-events': 'none' }, mid);
      node.style.display = 'none';
      return node;
    });

    const marbleGradient = uid('glass');
    const glass = el('radialGradient', { id: marbleGradient, cx: 0.35, cy: 0.3, r: 0.8 }, scene.defs);
    el('stop', { offset: 0, 'stop-color': '#f4fbff' }, glass);
    el('stop', { offset: 0.35, 'stop-color': '#9ec4e8' }, glass);
    el('stop', { offset: 1, 'stop-color': '#2f4f86' }, glass);
    const marbleLayer = el('g', { 'pointer-events': 'none' }, mid);
    const marbles = Array.from({ length: MARBLES }, (_, i) => {
      const m = el('g', { 'data-marble': i }, marbleLayer);
      el('circle', { cx: 3, cy: 4, r: MARBLE_R, fill: '#000', opacity: 0.35 }, m);
      el('circle', { r: MARBLE_R, fill: url(marbleGradient) }, m);
      return m;
    });

    drawOwl(front, 1330, 800, 0.9);

    const render = () => {
      marbles.forEach((m, i) => m.setAttribute('transform', `translate(${shown[i][0].toFixed(1)} ${shown[i][1].toFixed(1)})`));
    };
    const showShade = () => shades.forEach((s, c) => { s.style.display = c === tilt ? '' : 'none'; });

    /** Rolls the marbles to the corner's resting places. */
    const tipTo = (c: number) => {
      if (c < 0 || c === corner) return;
      corner = c;
      anim = { from: shown.map(([x, y]) => [x, y] as [number, number]), to: marbleSpots(c), t: 0 };
      sound.paper();
    };

    let last = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (anim) {
        anim.t += dt;
        let done = true;
        const a = anim;
        shown = a.from.map(([fx, fy], i) => {
          const k = clamp((a.t - i * 0.05) / 0.75, 0, 1);
          if (k < 1) done = false;
          const e = 1 - (1 - k) ** 3;
          return [fx + (a.to[i][0] - fx) * e, fy + (a.to[i][1] - fy) * e] as [number, number];
        });
        render();
        if (done) {
          anim = null;
          sound.knock();
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    scene.draggable(hit, {
      start: (p) => {
        tilt = cornerFor(p.x, p.y);
        tipTo(tilt);
        showShade();
      },
      move: (p) => {
        const c = cornerFor(p.x, p.y);
        if (c < 0 || c === tilt) return;
        tilt = c;
        tipTo(c);
        showShade();
      },
      end: () => {
        tilt = -1;
        showShade();
      },
    });
    // Keys: an arrow sets one axis and tips toward the corner the two axes name.
    const axes = { h: -1, v: -1 };
    hit.addEventListener('keydown', (event) => {
      const key = event.key;
      if (key === 'ArrowLeft') axes.h = -1;
      else if (key === 'ArrowRight') axes.h = 1;
      else if (key === 'ArrowUp') axes.v = -1;
      else if (key === 'ArrowDown') axes.v = 1;
      else return;
      event.preventDefault();
      tipTo(CORNERS.findIndex((k) => k.sx === axes.h && k.sy === axes.v));
    });
    render();

    return {
      // Nothing is marked in the scene; the hint card shows the whole solution instead.
      revealHints: () => 0,
      hintSteps: (): HintStep[] => {
        const first = READING_CORNERS[0];
        const [cx, cy] = constellationCentre(first);
        const rollTo = marbleSpots(first);
        const stars = starSpots(first);
        return [
          {
            note: tr('Chạm hoặc kéo trên khay về phía một góc để nghiêng khay. Bi lăn về góc đó và nằm vào các hõm.', 'Tap or drag on the tray toward a corner to tilt it. The marbles roll to that corner and settle in the hollows.'),
            targets: [{
              x: cx, y: cy, r: 70, verb: 'tap',
              act: (picture) => {
                const nodes = [...picture.querySelectorAll<SVGGElement>('[data-marble]')];
                const from = marblesAt(null);
                return (p) => nodes.forEach((n, i) => {
                  const x = from[i][0] + (rollTo[i][0] - from[i][0]) * p;
                  const y = from[i][1] + (rollTo[i][1] - from[i][1]) * p;
                  n.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
                });
              },
            }],
            apply: () => {
              corner = first;
              anim = null;
              shown = marbleSpots(first);
              render();
            },
          },
          {
            note: tr('Một số viên bi nằm thành chòm chỉ bằng chấm; các viên còn lại nằm rải rác, là nhiễu. Làm tương tự với ba góc còn lại, rồi đọc theo số lỗ khoan trên thành khay cạnh mỗi góc: 1 lỗ trước, rồi 2, 3, 4.', 'Some marbles settle into a constellation made only of dots; the rest are scattered noise. Do the same with the other three corners, then read by the number of holes drilled in the tray rim beside each corner: 1 hole first, then 2, 3, 4.'),
            targets: [
              { x: cx, y: cy, r: 150, verb: 'look' },
              ...holeSpots(first).slice(0, 1).map(([x, y]) => ({ x, y, r: 50, verb: 'look' as const })),
            ],
            prepare: (picture) => {
              const overlay = picture.querySelector('.layer-overlay') ?? picture;
              for (const [a, b] of glyph(CORNERS[first].glyph).lines) {
                el('line', { x1: stars[a][0], y1: stars[a][1], x2: stars[b][0], y2: stars[b][1], class: 'hint-line', 'pointer-events': 'none' }, overlay);
              }
            },
          },
        ];
      },
      destroy: () => cancelAnimationFrame(frame),
    };
  },
};
