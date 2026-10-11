import { DEF, url } from '../core/defs';
import { glyph, placeStars, type GlyphId } from '../core/glyphs';
import { drawOwl } from '../core/owl';
import { SCENE_H, SCENE_W } from '../core/scene';
import { el, moonPhase } from '../core/svg';
import { clamp } from '../core/tween';
import { dist, seeded, skyGradient } from './sky';
import type { HintTarget, PuzzleDef } from './types';

/**
 * Level 12 — the vantage point ("điểm nhìn"). Star beads hang on threads in three
 * rows, far, middle and near. As the owl moves along its rail the near row slides
 * past faster than the far one. Each constellation is split across the rows and
 * only lines up from one spot on the rail.
 */

/** How fast each row slides as the viewpoint moves: far, middle, near. */
export const ROWS: readonly number[] = [1, 2.4, 3.8];
export const SHIFT = 130;
export const RAIL = { x0: 300, x1: 1300, y: 830 };
export const GLYPH_SIZE = 170;
/**
 * Sky position of each constellation once lined up, where to stand for it, and the
 * moon that appears beside it (the answer order). The moon order matches neither
 * the order along the rail nor left to right across the sky.
 */
export const SPOTS: readonly { id: GlyphId; x: number; y: number; eye: number; phase: number }[] = [
  { id: 'diamond', x: 260, y: 450, eye: 0.25, phase: 4 },
  { id: 'triangle', x: 620, y: 300, eye: -0.9, phase: 3 },
  { id: 'hook', x: 980, y: 470, eye: 0.85, phase: 1 },
  { id: 'cross', x: 1340, y: 310, eye: -0.35, phase: 2 },
];
export const EYE_START = 0.55;
export const SNAP = 0.06;
export const ALIGNED = 0.01;

export const eyeAt = (x: number): number => clamp((x - (RAIL.x0 + RAIL.x1) / 2) / ((RAIL.x1 - RAIL.x0) / 2), -1, 1);
export const railX = (eye: number): number => (RAIL.x0 + RAIL.x1) / 2 + (eye * (RAIL.x1 - RAIL.x0)) / 2;
/** Sideways shift of a row for this viewpoint. */
export const rowShift = (eye: number, row: number): number => -eye * ROWS[row] * SHIFT;

export interface Bead {
  row: number;
  /** Position with the viewpoint in the middle (eye = 0). */
  x: number;
  y: number;
  glyph: number | null;
}

export const beadAt = (b: Bead, eye: number): [number, number] => [b.x + rowShift(eye, b.row), b.y];

/** The constellation lined up from this viewpoint, or -1. */
export const moonSpot = (s: { x: number; y: number }): [number, number] => [s.x + GLYPH_SIZE / 2 + 24, s.y - GLYPH_SIZE / 2 + 10];

export const alignedSpot = (eye: number): number => SPOTS.findIndex((s) => Math.abs(eye - s.eye) < ALIGNED);

export function snapEye(eye: number): number {
  const near = SPOTS.find((s) => Math.abs(eye - s.eye) < SNAP);
  return near ? near.eye : eye;
}

export function beads(): Bead[] {
  const out: Bead[] = [];
  SPOTS.forEach((s, gi) => {
    placeStars(s.id, s.x, s.y, GLYPH_SIZE).forEach(([x, y], j) => {
      const row = (j + gi) % ROWS.length;
      out.push({ row, x: x - rowShift(s.eye, row), y, glyph: gi });
    });
  });
  // Loose beads in every row, never landing on a constellation from its own viewpoint.
  const rand = seeded(311);
  const targets = SPOTS.map((s) => ({ eye: s.eye, stars: [...placeStars(s.id, s.x, s.y, GLYPH_SIZE), moonSpot(s)] }));
  for (let row = 0; row < ROWS.length; row += 1) {
    let made = 0;
    let tries = 0;
    while (made < 24 && tries < 6000) {
      tries += 1;
      const b: Bead = { row, x: -520 + rand() * 2640, y: 110 + rand() * 560, glyph: null };
      const clash = targets.some((t) => {
        const [x, y] = beadAt(b, t.eye);
        return t.stars.some((s) => dist(x, y, s[0], s[1]) < 52);
      });
      if (clash) continue;
      if (out.some((o) => o.row === row && dist(o.x, o.y, b.x, b.y) < 40)) continue;
      out.push(b);
      made += 1;
    }
  }
  return out;
}

export const vantagePoint: PuzzleDef = {
  id: 'vantage-point',
  name: 'Điểm nhìn',
  answer: [...SPOTS].sort((a, b) => a.phase - b.phase).map((s) => s.id),
  guide: {
    goal: 'Tìm đúng chỗ đứng để các hạt sao treo ở ba hàng xa gần xếp thẳng thành chòm sao.',
    steps: [
      { icon: 'look', text: 'Hạt sao treo thành ba hàng: xa, giữa, gần. Đổi chỗ đứng thì hàng gần trượt nhanh hơn hàng xa.' },
      { icon: 'drag', text: 'Kéo chú cú dọc theo đường ray để đổi điểm nhìn.' },
      { icon: 'look', text: 'Đứng đúng chỗ, các hạt của một chòm khớp lại, nét nối sáng lên và một vầng trăng hiện bên cạnh. Có 4 chỗ đứng như vậy.' },
      { icon: 'moon', text: 'Đọc theo pha trăng cạnh mỗi chòm: khuyết → nửa → gần tròn → tròn (không theo chỗ đứng hay vị trí trên trời).' },
    ],
    tip: 'Thả chú cú gần đúng chỗ thì nó tự khớp vào.',
  },
  fireflies: [
    { id: 'vantage-point/dome', layer: 'back', x: 1500, y: 90 },
    { id: 'vantage-point/rail', layer: 'front', x: 1460, y: 860 },
  ],
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    const all = beads();
    let eye = EYE_START;
    let lastAligned = -1;
    const seen = new Set<number>();
    const hinted: number[] = [];

    // Back: inside the dome, with the beam the threads hang from.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: skyGradient(scene.defs, '#10132c', '#2a2146') }, back);
    for (let i = 0; i < 7; i += 1) {
      el('path', { d: `M${-100 + i * 300} 900 Q${700 + (i - 3) * 60} -300 ${1700 - i * 300} 900`, fill: 'none', stroke: '#1d1f3e', 'stroke-width': 6 }, back);
    }
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: 90, fill: '#2e2440' }, back);
    el('rect', { x: -60, y: 760, width: SCENE_W + 120, height: 200, fill: '#1c1830' }, back);
    scene.grain('back', 0.3);

    // Mid: the three rows of beads, far first, and the glow of a lined-up constellation.
    const rows = ROWS.map((_, row) => el('g', { class: `bead-row row-${row}` }, mid));
    const style = [
      { r: 5, w: 1, op: 0.35 },
      { r: 7, w: 1.6, op: 0.45 },
      { r: 9.5, w: 2.4, op: 0.55 },
    ];
    for (const b of all) {
      const s = style[b.row];
      el('line', { x1: b.x, y1: 20, x2: b.x, y2: b.y - s.r, class: 'bead-thread', 'stroke-width': s.w, opacity: s.op }, rows[b.row]);
      el('circle', { cx: b.x, cy: b.y, r: s.r, class: 'bead' }, rows[b.row]);
    }
    const glowLines = el('g', { filter: url(DEF.glow), 'pointer-events': 'none' }, mid);
    const moonSlot = el('g', { 'pointer-events': 'none' }, mid);

    // Front: the rail and the owl on its cart.
    el('rect', { x: RAIL.x0 - 60, y: RAIL.y + 18, width: RAIL.x1 - RAIL.x0 + 120, height: 14, rx: 7, fill: '#5e4630' }, front);
    for (let x = RAIL.x0 - 40; x <= RAIL.x1 + 40; x += 50) el('rect', { x, y: RAIL.y + 30, width: 14, height: 26, fill: '#3e2f22' }, front);
    const ticks = el('g', {}, front);
    const cart = el('g', { class: 'owl-cart interactive', tabindex: 0, role: 'slider', 'aria-label': 'Chú cú (điểm nhìn)', 'aria-valuemin': -100, 'aria-valuemax': 100 }, front);
    el('rect', { x: -70, y: -150, width: 140, height: 200, fill: 'transparent' }, cart);
    el('rect', { x: -50, y: -6, width: 100, height: 24, rx: 6, fill: '#8a5a3a' }, cart);
    for (const x of [-30, 30]) el('circle', { cx: x, cy: 22, r: 10, fill: '#2b2433', stroke: '#c9b48c', 'stroke-width': 3 }, cart);
    drawOwl(cart, 0, -62, 0.85);

    const render = () => {
      rows.forEach((g, row) => g.setAttribute('transform', `translate(${rowShift(eye, row).toFixed(1)} 0)`));
      cart.setAttribute('transform', `translate(${railX(eye).toFixed(1)} ${RAIL.y})`);
      cart.setAttribute('aria-valuenow', String(Math.round(eye * 100)));
      glowLines.replaceChildren();
      moonSlot.replaceChildren();
      const a = alignedSpot(eye);
      if (a >= 0) {
        const s = SPOTS[a];
        const pts = placeStars(s.id, s.x, s.y, GLYPH_SIZE);
        for (const [i, j] of glyph(s.id).lines) el('line', { x1: pts[i][0], y1: pts[i][1], x2: pts[j][0], y2: pts[j][1], class: 'bead-link' }, glowLines);
        const [mx, my] = moonSpot(s);
        moonPhase(moonSlot, s.phase, mx, my, 18, { class: 'moon-phase bead-moon' });
        seen.add(a);
        if (a !== lastAligned) sound.chime();
      }
      lastAligned = a;
      ticks.replaceChildren();
      for (const i of hinted) el('path', { d: `M${railX(SPOTS[i].eye)} ${RAIL.y + 62} l-12 20 l24 0 Z`, class: 'hint-tick' }, ticks);
    };

    let grab = 0;
    scene.draggable(cart, {
      start: (p) => (grab = p.x - railX(eye)),
      move: (p) => {
        eye = eyeAt(p.x - grab);
        render();
      },
      end: () => {
        eye = snapEye(eye);
        sound.paper();
        render();
      },
    });
    cart.addEventListener('keydown', (event) => {
      const step = { ArrowRight: 0.04, ArrowLeft: -0.04 }[event.key];
      if (!step) return;
      event.preventDefault();
      eye = snapEye(clamp(eye + step, -1, 1));
      render();
    });
    render();

    const byPhase = SPOTS.map((s, i) => ({ s, i })).sort((a, b) => a.s.phase - b.s.phase).map(({ i }) => i);
    return {
      revealHints: (count) => {
        while (hinted.length < count) {
          const next = byPhase.find((i) => !seen.has(i) && !hinted.includes(i));
          if (next === undefined) break;
          hinted.push(next);
        }
        render();
        return hinted.length;
      },
      hintTargets: () => {
        const a = alignedSpot(eye);
        const targets: HintTarget[] = [];
        if (hinted.includes(a)) targets.push({ x: SPOTS[a].x, y: SPOTS[a].y, r: 125, verb: 'look', note: 'Chòm sao khoanh đỏ đã khớp; xem pha trăng bên cạnh.' });
        const want = hinted.find((i) => i !== a && !seen.has(i)) ?? hinted.find((i) => i !== a);
        if (want !== undefined) targets.push({ x: railX(eye), y: RAIL.y - 60, r: 100, verb: 'drag', to: { x: railX(SPOTS[want].eye), y: RAIL.y - 60 }, note: 'Kéo chú cú tới vạch đỏ trên đường ray.' });
        return targets;
      },
      destroy: () => undefined,
    };
  },
};
