import { url } from '../core/defs';
import { SCENE_H, SCENE_W } from '../core/scene';
import { el, moonPhase, uid } from '../core/svg';
import { clamp } from '../core/tween';
import { glyphAt, seeded } from './sky';
import type { HintTarget, PuzzleDef } from './types';

/**
 * Level 3 — the red decoder ("kính lọc đỏ"). An old star chart is scribbled over
 * with red ink. Slide the red glass across it: under the glass the red ink
 * vanishes and the constellations, each with a moon giving the order, appear.
 * Neither shows on the chart without the glass.
 */

export const CHART = { x: 260, y: 130, w: 1080, h: 660 };
export const FILTER = { w: 320, h: 280 };
export const GLYPH_SIZE = 190;
export const GLYPH_SPOTS = [
  { id: 'square', x: 480, y: 340, phase: 2 },
  { id: 'diamond', x: 820, y: 590, phase: 3 },
  { id: 'hook', x: 1130, y: 350, phase: 1 },
] as const;
export const FILTER_START: readonly [number, number] = [1430, 650];

/** Constellations fully inside the red glass when its centre is at (x, y). */
export function decodedUnder(x: number, y: number): number[] {
  const half = GLYPH_SIZE / 2 - 4;
  return GLYPH_SPOTS.map((g, i) => ({ g, i }))
    .filter(({ g }) => Math.abs(g.x - x) <= FILTER.w / 2 - half && Math.abs(g.y - y) <= FILTER.h / 2 - half)
    .map(({ i }) => i);
}

export const redFilter: PuzzleDef = {
  id: 'red-filter',
  name: 'Kính lọc đỏ',
  answer: [...GLYPH_SPOTS].sort((a, b) => a.phase - b.phase).map((g) => g.id),
  guide: {
    goal: 'Tìm 3 chòm sao trên tấm bản đồ bị vẽ đè bằng mực đỏ.',
    steps: [
      { icon: 'drag', text: 'Kéo tấm kính đỏ di chuyển trên bản đồ.' },
      { icon: 'look', text: 'Nhìn thường chỉ thấy nét mực đỏ rối. Dưới kính đỏ, mực đỏ biến mất và chòm sao cùng vầng trăng bên cạnh mới hiện ra.' },
      { icon: 'moon', text: 'Đọc theo pha trăng cạnh mỗi chòm (chỉ thấy dưới kính): khuyết → nửa → gần tròn → tròn.' },
    ],
    tip: 'Đặt cả chòm sao nằm gọn trong khung kính thì mới đọc rõ.',
  },
  fireflies: [
    { id: 'red-filter/lamp', layer: 'back', x: 130, y: 120 },
    { id: 'red-filter/desk', layer: 'back', x: 1480, y: 860 },
  ],
  mount({ scene, sound }) {
    const { back, front } = scene.layers;
    let fx = FILTER_START[0];
    let fy = FILTER_START[1];
    const seen = new Set<number>();
    const hinted: number[] = [];

    // Back: the desk under a warm lamp.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#2a1d18' }, back);
    for (let y = 0; y < SCENE_H; y += 60) el('line', { x1: -60, y1: y, x2: SCENE_W + 60, y2: y + 20, stroke: '#24180f', 'stroke-width': 3 }, back);
    scene.grain('back', 0.5);

    // Front: the chart, the decoded view under the glass, and the glass itself.
    const chart = el('g', {}, front);
    el('rect', { x: CHART.x, y: CHART.y, width: CHART.w, height: CHART.h, rx: 6, fill: '#efe6cf', stroke: '#b9a27f', 'stroke-width': 3 }, chart);
    el('circle', { cx: CHART.x + CHART.w / 2, cy: CHART.y + CHART.h / 2, r: 300, fill: 'none', stroke: '#c9b48c', 'stroke-width': 2 }, chart);
    el('line', { x1: CHART.x + 20, y1: CHART.y + CHART.h / 2, x2: CHART.x + CHART.w - 20, y2: CHART.y + CHART.h / 2, stroke: '#c9b48c', 'stroke-width': 2 }, chart);
    // The constellations and their moons are not drawn on the chart at all: only the
    // view under the red glass (below) shows them.
    const rand = seeded(31);
    const reds = ['#d23a2a', '#e0533c', '#c24060', '#e2785a', '#b8334a'];
    const noise = el('g', {}, chart);
    for (let i = 0; i < 1300; i += 1) {
      const x = CHART.x + 10 + rand() * (CHART.w - 20);
      const y = CHART.y + 10 + rand() * (CHART.h - 20);
      const c = reds[Math.floor(rand() * reds.length)];
      if (rand() < 0.35) {
        el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: (2 + rand() * 4).toFixed(1), fill: c }, noise);
      } else {
        const a = rand() * Math.PI;
        const l = 12 + rand() * 30;
        el('path', {
          d: `M${x.toFixed(1)} ${y.toFixed(1)} q${(Math.cos(a) * l * 0.5).toFixed(1)} ${(Math.sin(a) * l * 0.5 - 6).toFixed(1)} ${(Math.cos(a) * l).toFixed(1)} ${(Math.sin(a) * l).toFixed(1)}`,
          stroke: c, 'stroke-width': 2.5, fill: 'none', 'stroke-linecap': 'round',
        }, noise);
      }
    }

    const clipId = uid('filter-view');
    const clipRect = el('rect', { width: FILTER.w - 24, height: FILTER.h - 24 }, el('clipPath', { id: clipId }, scene.defs));
    const decoded = el('g', { 'clip-path': url(clipId), 'pointer-events': 'none' }, front);
    el('rect', { x: CHART.x, y: CHART.y, width: CHART.w, height: CHART.h, fill: '#f2d2c4' }, decoded);
    const dark = el('g', {}, decoded);
    dark.style.color = '#1d2140';
    for (const g of GLYPH_SPOTS) glyphAt(dark, g.id, g.x, g.y, GLYPH_SIZE, { star: 7, line: 4, lineOpacity: 0.9 });
    for (const g of GLYPH_SPOTS) moonPhase(decoded, g.phase, g.x, g.y - GLYPH_SIZE / 2 - 30, 16, { class: 'moon-phase ink' });

    const ghost = el('rect', { width: FILTER.w, height: FILTER.h, rx: 14, class: 'filter-ghost', opacity: 0 }, front);
    const glass = el('g', { class: 'red-glass interactive', tabindex: 0, role: 'button', 'aria-label': 'Tấm kính đỏ' }, front);
    el('rect', { x: -FILTER.w / 2, y: -FILTER.h / 2, width: FILTER.w, height: FILTER.h, rx: 14, class: 'glass-tint' }, glass);
    el('rect', { x: -FILTER.w / 2, y: -FILTER.h / 2, width: FILTER.w, height: FILTER.h, rx: 14, fill: 'none', stroke: '#5e3820', 'stroke-width': 12 }, glass);
    el('rect', { x: FILTER.w / 2 - 6, y: -18, width: 70, height: 36, rx: 10, fill: '#6b4f36' }, glass);

    const render = () => {
      glass.setAttribute('transform', `translate(${fx.toFixed(1)} ${fy.toFixed(1)})`);
      clipRect.setAttribute('x', (fx - FILTER.w / 2 + 12).toFixed(1));
      clipRect.setAttribute('y', (fy - FILTER.h / 2 + 12).toFixed(1));
      const next = hinted.find((g) => !seen.has(g));
      if (next === undefined) ghost.setAttribute('opacity', '0');
      else {
        ghost.setAttribute('opacity', '1');
        ghost.setAttribute('x', String(GLYPH_SPOTS[next].x - FILTER.w / 2));
        ghost.setAttribute('y', String(GLYPH_SPOTS[next].y - FILTER.h / 2));
      }
    };
    const check = () => {
      for (const g of decodedUnder(fx, fy)) {
        if (seen.has(g)) continue;
        seen.add(g);
        sound.chime();
      }
      render();
    };

    let grab = [0, 0];
    scene.draggable(glass, {
      start: (p) => (grab = [p.x - fx, p.y - fy]),
      move: (p) => {
        fx = clamp(p.x - grab[0], 140, SCENE_W - 140);
        fy = clamp(p.y - grab[1], 120, SCENE_H - 120);
        check();
      },
      end: () => sound.paper(),
    });
    glass.addEventListener('keydown', (event) => {
      const moves: Record<string, [number, number]> = { ArrowLeft: [-30, 0], ArrowRight: [30, 0], ArrowUp: [0, -30], ArrowDown: [0, 30] };
      const m = moves[event.key];
      if (!m) return;
      event.preventDefault();
      fx = clamp(fx + m[0], 140, SCENE_W - 140);
      fy = clamp(fy + m[1], 120, SCENE_H - 120);
      check();
    });
    render();

    const byPhase = GLYPH_SPOTS.map((g, i) => ({ g, i })).sort((a, b) => a.g.phase - b.g.phase).map(({ i }) => i);
    return {
      revealHints: (count) => {
        while (hinted.length < count) {
          const next = byPhase.find((g) => !seen.has(g) && !hinted.includes(g));
          if (next === undefined) break;
          hinted.push(next);
        }
        render();
        return hinted.length;
      },
      hintTargets: () => hinted.filter((g) => !seen.has(g)).slice(0, 1).map((g): HintTarget => ({ x: fx, y: fy, r: 120, verb: 'drag', to: { x: GLYPH_SPOTS[g].x, y: GLYPH_SPOTS[g].y }, note: 'Kéo tấm kính đỏ tới khung vàng.' })),
      destroy: () => undefined,
    };
  },
};
