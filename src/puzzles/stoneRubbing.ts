import { drawOwl } from '../core/owl';
import type { GlyphId } from '../core/glyphs';
import { glyph, placeStars } from '../core/glyphs';
import { url } from '../core/defs';
import { SCENE_H, SCENE_W } from '../core/scene';
import { el, uid } from '../core/svg';
import { clamp } from '../core/tween';
import { dist, seeded } from './sky';
import type { HintStep, PuzzleDef } from './types';

/**
 * Chapter 3, level 1 — the stone slab ("bia đá"). A sheet of paper is pinned over an old
 * carved slab; nothing shows on it. Rub a graphite stick across the paper and the carved
 * grooves stay white while the rest goes grey, so the carved constellations (plain dots, no
 * lines) come up. Five are carved; two have a small crossed ring above them, meaning
 * "struck out". Read the three that are not struck out, left to right.
 */

export const PAPER = { x: 240, y: 90, w: 1120, h: 720 };
/** Half the width of the mark the stick leaves. */
export const RUB_R = 46;
/** A star counts as rubbed when a mark's centre passes this close to it. */
export const COVER_R = 36;
export const GLYPH_SIZE = 140;
export const STAR_R = 9;
/** Where the stick lies at the start (its contact point). */
export const STICK_START: readonly [number, number] = [1470, 690];

export interface CarvingDef {
  glyph: GlyphId;
  x: number;
  y: number;
  /** Struck out: a crossed ring is carved above it, and it is not part of the answer. */
  struck: boolean;
}

/**
 * Left to right. Rows alternate high and low so that one pass along the middle misses
 * everything; the struck ones are the second and the last.
 */
export const CARVINGS: readonly CarvingDef[] = [
  { glyph: 'crown', x: 352, y: 330, struck: false },
  { glyph: 'cross', x: 576, y: 590, struck: true },
  { glyph: 'dipper', x: 800, y: 350, struck: false },
  { glyph: 'triangle', x: 1024, y: 580, struck: false },
  { glyph: 'hook', x: 1248, y: 360, struck: true },
];

/** The answer: the carvings that are not struck out, left to right. */
export const READING_ORDER: readonly number[] = CARVINGS.flatMap((c, i) => (c.struck ? [] : [i]));

export const carvingStars = (i: number): [number, number][] =>
  placeStars(CARVINGS[i].glyph, CARVINGS[i].x, CARVINGS[i].y, GLYPH_SIZE);

/** Centre and radius of the crossed ring that strikes carving `i` out. */
export const markSpot = (i: number): { x: number; y: number; r: number } => ({
  x: CARVINGS[i].x,
  y: CARVINGS[i].y - GLYPH_SIZE / 2 - 54,
  r: 28,
});

/** Stray carved dots that belong to no constellation. Generated once, the same on every visit. */
export const SPECKS: readonly [number, number][] = (() => {
  const rand = seeded(3101);
  const out: [number, number][] = [];
  const marks = CARVINGS.flatMap((c, i) => (c.struck ? [markSpot(i)] : []));
  for (let tries = 0; tries < 4000 && out.length < 12; tries += 1) {
    const x = PAPER.x + 50 + rand() * (PAPER.w - 100);
    const y = PAPER.y + 50 + rand() * (PAPER.h - 100);
    if (CARVINGS.some((c) => dist(x, y, c.x, c.y) < 145)) continue;
    if (marks.some((m) => dist(x, y, m.x, m.y) < 70)) continue;
    if (out.some(([ox, oy]) => dist(x, y, ox, oy) < 110)) continue;
    out.push([x, y]);
  }
  return out;
})();

/** One continuous pass of the stick, as the points its tip went through. */
export type Stroke = readonly (readonly [number, number])[];

const covered = (strokes: readonly Stroke[], x: number, y: number): boolean =>
  strokes.some((s) => s.some(([px, py]) => dist(px, py, x, y) <= COVER_R));

/** Which carvings have come up under the strokes (most of their stars rubbed). */
export function revealedCarvings(strokes: readonly Stroke[]): number[] {
  return CARVINGS.flatMap((_, i) => {
    const stars = carvingStars(i);
    const seen = stars.filter(([x, y]) => covered(strokes, x, y)).length;
    return seen >= Math.ceil(stars.length * 0.8) ? [i] : [];
  });
}

/** Points along the straight pass from a to b, close enough together to leave no gap. */
export function interpolate(a: readonly [number, number], b: readonly [number, number], step = 10): [number, number][] {
  const n = Math.max(1, Math.ceil(dist(a[0], a[1], b[0], b[1]) / step));
  return Array.from({ length: n }, (_, k) => [a[0] + ((b[0] - a[0]) * (k + 1)) / n, a[1] + ((b[1] - a[1]) * (k + 1)) / n]);
}

/** A back-and-forth sweep of the whole paper, as the hint card shows it done. */
export function sweepPlan(): [number, number][] {
  const rows = [290, 360, 430, 520, 590, 660];
  const left = PAPER.x - 20;
  const right = PAPER.x + PAPER.w + 20;
  const pts: [number, number][] = [[left, rows[0]]];
  rows.forEach((y, r) => {
    const from: [number, number] = [r % 2 === 0 ? left : right, y];
    const to: [number, number] = [r % 2 === 0 ? right : left, y];
    if (r > 0) pts.push(...interpolate(pts[pts.length - 1], from));
    pts.push(...interpolate(from, to));
  });
  return pts;
}

const ease = (k: number) => (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2);
/** Same timing as the hint card's own slide: rest, glide, hold. */
const slide = (p: number) => (p < 0.2 ? 0 : p > 0.75 ? 1 : ease((p - 0.2) / 0.55));

const pathOf = (strokes: readonly Stroke[]): string =>
  strokes.filter((s) => s.length).map((s) => `M${s[0][0].toFixed(0)} ${s[0][1].toFixed(0)} l0 0 ${s.slice(1).map(([x, y]) => `L${x.toFixed(0)} ${y.toFixed(0)}`).join(' ')}`).join(' ');

export const stoneRubbing: PuzzleDef = {
  id: 'stone-rubbing',
  name: 'Bia đá',
  answer: READING_ORDER.map((i) => CARVINGS[i].glyph),
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    const colours = { paper: '#efe6cf', fibre: '#d9ccab', stone: '#6a6772', grooves: '#efe6cf' };
    let strokes: [number, number][][] = [];
    let pos: [number, number] = [STICK_START[0], STICK_START[1]];

    // Back: a dark workshop wall and the table the slab leans on.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#1b1823' }, back);
    el('rect', { x: -60, y: 846, width: SCENE_W + 120, height: 120, fill: '#33261f' }, back);
    scene.grain('back', 0.45);

    // Mid: the stone slab, the paper over it and, on the paper, the rubbed version of the slab.
    const stone = el('g', { 'pointer-events': 'none' }, mid);
    el('rect', { x: PAPER.x - 52, y: PAPER.y - 46, width: PAPER.w + 104, height: PAPER.h + 92, rx: 26, fill: colours.stone, stroke: '#8d8a97', 'stroke-width': 5 }, stone);
    const grit = seeded(41);
    for (let i = 0; i < 90; i += 1) {
      const side = i % 4;
      const x = side < 2 ? PAPER.x - 48 + grit() * 40 : PAPER.x + PAPER.w + 8 + grit() * 40;
      const y = PAPER.y - 40 + grit() * (PAPER.h + 80);
      el('circle', { cx: x.toFixed(0), cy: y.toFixed(0), r: (1 + grit() * 3).toFixed(1), fill: '#4b4953', opacity: 0.7 }, stone);
    }
    el('rect', { x: PAPER.x, y: PAPER.y, width: PAPER.w, height: PAPER.h, rx: 5, fill: colours.paper, stroke: '#cbbb94', 'stroke-width': 3 }, mid);
    const fibres = el('g', { 'pointer-events': 'none' }, mid);
    const fr = seeded(77);
    for (let i = 0; i < 70; i += 1) {
      const x = PAPER.x + 10 + fr() * (PAPER.w - 20);
      const y = PAPER.y + 10 + fr() * (PAPER.h - 20);
      el('line', { x1: x.toFixed(0), y1: y.toFixed(0), x2: (x + 8 + fr() * 14).toFixed(0), y2: (y + fr() * 6 - 3).toFixed(0), stroke: colours.fibre, 'stroke-width': 1.5, opacity: 0.55 }, fibres);
    }

    // The rubbed paper: graphite shading with the carved shapes left white, shown only where the stick has been.
    const hatchId = uid('graphite');
    const hatch = el('pattern', { id: hatchId, width: 9, height: 9, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(35)' }, scene.defs);
    el('rect', { width: 9, height: 9, fill: '#4f535e' }, hatch);
    el('line', { x1: 0, y1: 4.5, x2: 9, y2: 4.5, stroke: '#3b3e48', 'stroke-width': 2.2 }, hatch);
    const maskId = uid('rub');
    const mask = el('mask', { id: maskId, maskUnits: 'userSpaceOnUse', x: PAPER.x, y: PAPER.y, width: PAPER.w, height: PAPER.h }, scene.defs);
    const markPath = el('path', {
      fill: 'none', stroke: '#fff', 'stroke-width': RUB_R * 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'data-hint': 'rub-path',
    }, mask);
    const rubbed = el('g', { mask: url(maskId), 'pointer-events': 'none' }, mid);
    el('rect', { x: PAPER.x, y: PAPER.y, width: PAPER.w, height: PAPER.h, fill: url(hatchId), opacity: 0.93 }, rubbed);
    const grooves = el('g', { fill: colours.grooves, stroke: colours.grooves }, rubbed);
    CARVINGS.forEach((c, i) => {
      for (const [x, y] of carvingStars(i)) el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: STAR_R, stroke: 'none' }, grooves);
      if (!c.struck) return;
      const m = markSpot(i);
      el('circle', { cx: m.x, cy: m.y, r: m.r, fill: 'none', 'stroke-width': 7 }, grooves);
      const k = m.r * 0.5;
      el('path', { d: `M${m.x - k} ${m.y - k} L${m.x + k} ${m.y + k} M${m.x + k} ${m.y - k} L${m.x - k} ${m.y + k}`, fill: 'none', 'stroke-width': 8, 'stroke-linecap': 'round' }, grooves);
    });
    for (const [x, y] of SPECKS) el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: STAR_R, stroke: 'none' }, grooves);

    // Pins holding the paper.
    for (const [x, y, a] of [[PAPER.x + 6, PAPER.y + 6, -40], [PAPER.x + PAPER.w - 6, PAPER.y + 6, 40], [PAPER.x + 6, PAPER.y + PAPER.h - 6, 40], [PAPER.x + PAPER.w - 6, PAPER.y + PAPER.h - 6, -40]] as const) {
      el('rect', { x: x - 34, y: y - 11, width: 68, height: 22, rx: 3, fill: '#d8c08a', opacity: 0.8, transform: `rotate(${a} ${x} ${y})`, 'pointer-events': 'none' }, mid);
    }

    // Front: the owl at the table's edge, and the graphite stick to rub with.
    drawOwl(front, 110, 846, 0.7);
    const stick = el('g', { class: 'rub-stick interactive', tabindex: 0, role: 'button', 'aria-label': 'Thỏi than chì', 'data-hint': 'stick' }, front);
    const body = el('g', { transform: 'rotate(26)', 'pointer-events': 'none' }, stick);
    el('rect', { x: -26, y: -190, width: 52, height: 190, rx: 8, fill: '#3a3b44', stroke: '#16171c', 'stroke-width': 3 }, body);
    el('rect', { x: -26, y: -190, width: 52, height: 120, rx: 8, fill: '#a9825a', stroke: '#6e5236', 'stroke-width': 3 }, body);
    el('line', { x1: -26, y1: -128, x2: 26, y2: -128, stroke: '#6e5236', 'stroke-width': 3 }, body);
    el('rect', { x: -60, y: -190, width: 120, height: 210, fill: 'transparent' }, stick);

    const renderStick = () => stick.setAttribute('transform', `translate(${pos[0].toFixed(1)} ${pos[1].toFixed(1)})`);
    const renderMarks = () => markPath.setAttribute('d', pathOf(strokes));
    const near = (x: number, y: number) =>
      x > PAPER.x - RUB_R && x < PAPER.x + PAPER.w + RUB_R && y > PAPER.y - RUB_R && y < PAPER.y + PAPER.h + RUB_R;
    /** Moves the stick, leaving a mark along the way when it is on the paper. */
    const moveTo = (x: number, y: number, rubbing: boolean) => {
      const from: [number, number] = [pos[0], pos[1]];
      pos = [clamp(x, 0, SCENE_W), clamp(y, 40, SCENE_H)];
      if (rubbing && (near(pos[0], pos[1]) || near(from[0], from[1]))) {
        const cur = strokes[strokes.length - 1];
        cur.push(...interpolate(from, pos));
        renderMarks();
      }
      renderStick();
    };

    let grab = [0, 0];
    scene.draggable(stick, {
      start: (p) => {
        grab = [p.x - pos[0], p.y - pos[1]];
        strokes.push([[pos[0], pos[1]]]);
        front.appendChild(stick);
      },
      move: (p) => moveTo(p.x - grab[0], p.y - grab[1], true),
      end: () => sound.paper(),
    });
    stick.addEventListener('keydown', (event) => {
      const moves: Record<string, [number, number]> = { ArrowLeft: [-30, 0], ArrowRight: [30, 0], ArrowUp: [0, -30], ArrowDown: [0, 30] };
      const m = moves[event.key];
      if (!m) return;
      event.preventDefault();
      if (!strokes.length) strokes.push([[pos[0], pos[1]]]);
      moveTo(pos[0] + m[0], pos[1] + m[1], true);
    });
    renderStick();

    return {
      // Nothing is marked in the scene; the hint card shows the whole solution instead.
      revealHints: () => 0,
      hintSteps: (): HintStep[] => {
        const to = { x: 420, y: 330 };
        return [
          {
            note: 'Kéo thỏi than chì lên tờ giấy và chà qua lại từng hàng. Chỗ khắc chìm không ăn than nên để lại vệt trắng.',
            targets: [
              { x: STICK_START[0], y: STICK_START[1], r: 80, verb: 'drag', to, object: '[data-hint="stick"]' },
              {
                x: to.x, y: to.y, r: 0, verb: 'look',
                act: (picture) => {
                  const path = picture.querySelector('[data-hint="rub-path"]');
                  return (p) => {
                    const s = slide(p);
                    const x = STICK_START[0] + (to.x - STICK_START[0]) * s;
                    const y = STICK_START[1] + (to.y - STICK_START[1]) * s;
                    path?.setAttribute('d', s > 0 ? `M${STICK_START[0]} ${STICK_START[1]} L${x.toFixed(0)} ${y.toFixed(0)}` : '');
                  };
                },
              },
            ],
            apply: () => {
              strokes = [sweepPlan()];
              pos = [PAPER.x + PAPER.w - 30, 660];
              renderMarks();
              renderStick();
            },
          },
          {
            note: 'Bỏ hai chòm có vòng gạch chéo phía trên. Đọc ba chòm còn lại từ trái sang phải; nối các chấm trong đầu.',
            targets: READING_ORDER.map((i) => ({ x: CARVINGS[i].x, y: CARVINGS[i].y, r: GLYPH_SIZE * 0.7, verb: 'look' as const })),
            prepare: (picture) => {
              const overlay = picture.querySelector('.layer-overlay') ?? picture;
              READING_ORDER.forEach((i, n) => {
                const stars = carvingStars(i);
                for (const [a, b] of glyph(CARVINGS[i].glyph).lines) {
                  el('line', { x1: stars[a][0], y1: stars[a][1], x2: stars[b][0], y2: stars[b][1], class: 'hint-line', 'pointer-events': 'none' }, overlay);
                }
                const badge = el('g', { transform: `translate(${CARVINGS[i].x} ${CARVINGS[i].y - GLYPH_SIZE / 2 - 40})`, 'pointer-events': 'none' }, overlay);
                el('circle', { r: 17, class: 'number-badge' }, badge);
                el('text', { y: 1, class: 'number-text' }, badge).textContent = String(n + 1);
              });
            },
          },
        ];
      },
      destroy: () => undefined,
    };
  },
};
