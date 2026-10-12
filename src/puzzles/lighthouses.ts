import { drawOwl } from '../core/owl';
import { SCENE_H, SCENE_W } from '../core/scene';
import { el, uid } from '../core/svg';
import { url } from '../core/defs';
import { placeStars, type GlyphId } from '../core/glyphs';
import { clamp } from '../core/tween';
import { skyGradient, starfield } from './sky';
import type { HintStep, PuzzleDef } from './types';

/**
 * Chapter 2, level 7 — the lighthouses ("hải đăng"). Through the attic window a coast of six
 * lighthouses; on the table below it, a chart of the same coast from above with a
 * constellation of plain dots printed beside each lighthouse. Four of them flash their own
 * signature (one flash, two, three, four, then a long pause) and two are dark, and a boat's
 * light flickers without a pattern. A curtain hides the right half of the view. Match each
 * flashing lighthouse to its place on the chart, left to right, read the constellation beside
 * it, and give them in order of the number of flashes. Nothing is lit or marked on the chart.
 */

export interface Lighthouse {
  glyph: GlyphId;
  /** Flashes in each group; 0 is a dark lighthouse. */
  flashes: number;
  /** Place on the chart (top view). The view shows them in the same left-to-right order. */
  chart: { x: number; y: number };
  /** Seconds into its cycle at time 0, so they do not flash together. */
  offset: number;
}

/** Left to right along the coast. */
export const LIGHTHOUSES: readonly Lighthouse[] = [
  { glyph: 'dipper', flashes: 0, chart: { x: 480, y: 640 }, offset: 0 },
  { glyph: 'square', flashes: 2, chart: { x: 610, y: 740 }, offset: 0.7 },
  { glyph: 'cross', flashes: 4, chart: { x: 740, y: 600 }, offset: 1.3 },
  { glyph: 'hook', flashes: 1, chart: { x: 870, y: 720 }, offset: 0.2 },
  { glyph: 'crown', flashes: 0, chart: { x: 1000, y: 590 }, offset: 0 },
  { glyph: 'triangle', flashes: 3, chart: { x: 1130, y: 700 }, offset: 1.9 },
];

export const CHART = { x: 380, y: 490, w: 840, h: 390 };
export const WINDOW = { x: 200, y: 70, w: 1200, h: 400 };
export const FLASH_ON = 0.18;
export const FLASH_STEP = 0.45;
export const PAUSE = 2.0;
export const CURTAIN = { x: 880, w: 520, reach: 540 };

/** Where a lighthouse stands in the window, from its place on the chart: left-to-right order is kept. */
export function viewSpot(i: number): { x: number; y: number; scale: number } {
  const { x, y } = LIGHTHOUSES[i].chart;
  const near = clamp((y - 590) / 150, 0, 1);
  return { x: 240 + ((x - 480) / 650) * 1120, y: 340 + near * 60, scale: 0.7 + 0.5 * near };
}

/** The length of one signature, flashes then pause. */
export const cycleFor = (flashes: number): number => flashes * FLASH_STEP + PAUSE;

/** Is lighthouse i's lamp lit at time t seconds? */
export function lampOn(i: number, t: number): boolean {
  const { flashes, offset } = LIGHTHOUSES[i];
  if (flashes === 0) return false;
  const cycle = cycleFor(flashes);
  const u = (((t + offset) % cycle) + cycle) % cycle;
  const k = Math.floor(u / FLASH_STEP);
  return k < flashes && u - k * FLASH_STEP < FLASH_ON;
}

/** The boat's light: irregular pulses (start, length) in a 9-second loop, including a pair that looks like a signature. */
export const BOAT_PULSES: readonly (readonly [number, number])[] = [
  [0.3, 0.12], [1.1, 0.3], [1.7, 0.1], [3.4, 0.25], [3.9, 0.1], [4.25, 0.1], [6.3, 0.4], [7.6, 0.1],
];
export const BOAT_LOOP = 9;
export const boatOn = (t: number): boolean => {
  const u = ((t % BOAT_LOOP) + BOAT_LOOP) % BOAT_LOOP;
  return BOAT_PULSES.some(([start, len]) => u >= start && u < start + len);
};

/** Lighthouses the curtain covers when it has been drawn `offset` to the right. */
export const hiddenLighthouses = (offset: number): number[] =>
  LIGHTHOUSES.flatMap((_, i) => (viewSpot(i).x > CURTAIN.x + offset - 24 ? [i] : []));

/** The answer: the lit lighthouses by number of flashes. */
export const READING: readonly number[] = LIGHTHOUSES.map((_, i) => i)
  .filter((i) => LIGHTHOUSES[i].flashes > 0)
  .sort((a, b) => LIGHTHOUSES[a].flashes - LIGHTHOUSES[b].flashes);

/** Centre of the constellation printed beside lighthouse i on the chart. */
export const chartConstellation = (i: number): [number, number] => [LIGHTHOUSES[i].chart.x, LIGHTHOUSES[i].chart.y - 66];
export const CHART_SIZE = 60;

export const lighthouses: PuzzleDef = {
  id: 'lighthouses',
  name: 'Hải đăng',
  answer: READING.map((i) => LIGHTHOUSES[i].glyph),
  fireflies: [
    { id: 'lighthouses/rafter', layer: 'back', x: 120, y: 160 },
    { id: 'lighthouses/floor', layer: 'front', x: 1480, y: 830 },
  ],
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    let curtain = 0;
    let raf = 0;
    const lamps: SVGCircleElement[] = [];

    // Back: the attic wall.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#241a17' }, back);
    for (let x = 80; x < SCENE_W; x += 160) el('line', { x1: x, y1: -20, x2: x, y2: SCENE_H + 20, stroke: '#1a1210', 'stroke-width': 4 }, back);
    scene.grain('back', 0.4);

    // Mid: the window onto the coast, the curtain, and the chart on the table.
    const clipId = uid('view-clip');
    el('rect', { x: WINDOW.x, y: WINDOW.y, width: WINDOW.w, height: WINDOW.h }, el('clipPath', { id: clipId }, scene.defs));
    el('rect', { x: WINDOW.x - 18, y: WINDOW.y - 18, width: WINDOW.w + 36, height: WINDOW.h + 36, rx: 8, fill: '#3a2a22' }, mid);
    const view = el('g', { 'clip-path': url(clipId) }, mid);
    el('rect', { x: WINDOW.x, y: WINDOW.y, width: WINDOW.w, height: WINDOW.h, fill: skyGradient(scene.defs, '#0b1228', '#26305a') }, view);
    starfield(view, { x: WINDOW.x, y: WINDOW.y, w: WINDOW.w, h: 250 }, 60, 31);
    el('rect', { x: WINDOW.x, y: 330, width: WINDOW.w, height: 160, fill: '#0f1f3c' }, view);
    for (let i = 0; i < 14; i += 1) {
      el('path', { d: `M${240 + i * 85} ${352 + (i % 4) * 28} q14 -7 28 0 q14 7 28 0`, fill: 'none', stroke: '#1d3358', 'stroke-width': 3 }, view);
    }

    LIGHTHOUSES.forEach((l, i) => {
      const s = viewSpot(i);
      const g = el('g', { transform: `translate(${s.x.toFixed(1)} ${s.y.toFixed(1)}) scale(${s.scale.toFixed(2)})` }, view);
      el('ellipse', { cx: 0, cy: 2, rx: 46, ry: 11, fill: '#0a0f1c' }, g);
      el('path', { d: 'M-15 0 L-10 -64 L10 -64 L15 0 Z', fill: '#d9cdb6' }, g);
      el('path', { d: 'M-13 -18 L13 -18 L12 -30 L-12 -30 Z M-11 -44 L11 -44 L10 -54 L-10 -54 Z', fill: '#8a3a3a' }, g);
      el('rect', { x: -14, y: -84, width: 28, height: 20, fill: l.flashes > 0 ? '#3a3a52' : '#2a2a38', stroke: '#5a5a74', 'stroke-width': 3 }, g);
      el('path', { d: 'M-18 -84 L0 -102 L18 -84 Z', fill: '#4a2a2a' }, g);
      const lamp = el('circle', { cx: 0, cy: -74, r: 40, fill: '#ffe9a8', style: 'opacity: 0', 'pointer-events': 'none', 'data-lamp': i }, g);
      lamps[i] = lamp;
    });
    // A boat in the bay whose light flickers on its own.
    const boat = el('g', { transform: 'translate(560 430)' }, view);
    el('path', { d: 'M-34 0 L34 0 L22 14 L-22 14 Z', fill: '#2a1d18' }, boat);
    el('line', { x1: 0, y1: 0, x2: 0, y2: -42, stroke: '#2a1d18', 'stroke-width': 4 }, boat);
    const boatLamp = el('circle', { cx: 0, cy: -44, r: 22, fill: '#ffe9a8', style: 'opacity: 0', 'pointer-events': 'none', 'data-boat': 1 }, boat);

    // The curtain: slides right and out of the window.
    const curtainNode = el('g', { class: 'curtain interactive', tabindex: 0, role: 'button', 'aria-label': 'Rèm cửa sổ: kéo sang phải', 'data-hint': 'curtain' }, view);
    const cloth = el('g', {}, curtainNode);
    el('rect', { x: CURTAIN.x, y: WINDOW.y - 10, width: CURTAIN.w + 40, height: WINDOW.h + 20, fill: '#5a2a38' }, cloth);
    for (let x = CURTAIN.x + 30; x < CURTAIN.x + CURTAIN.w + 40; x += 46) {
      el('path', { d: `M${x} ${WINDOW.y - 10} q16 ${WINDOW.h / 2} 0 ${WINDOW.h + 20}`, fill: 'none', stroke: '#431d29', 'stroke-width': 10, 'pointer-events': 'none' }, cloth);
    }
    el('rect', { x: CURTAIN.x - 4, y: WINDOW.y - 10, width: 10, height: WINDOW.h + 20, fill: '#7a3a4a' }, cloth);

    // The chart, from above, on the table.
    el('rect', { x: CHART.x - 14, y: CHART.y - 14, width: CHART.w + 28, height: CHART.h + 28, rx: 10, fill: '#5a3f2a' }, mid);
    el('rect', { x: CHART.x, y: CHART.y, width: CHART.w, height: CHART.h, fill: '#d9c7a0' }, mid);
    const chartClip = uid('chart-clip');
    el('rect', { x: CHART.x, y: CHART.y, width: CHART.w, height: CHART.h }, el('clipPath', { id: chartClip }, scene.defs));
    const paper = el('g', { 'clip-path': url(chartClip), 'pointer-events': 'none' }, mid);
    // Sea at the bottom with contour lines; capes and an island of land on the chart.
    el('path', { d: `M${CHART.x} ${CHART.y + 60} C 560 ${CHART.y + 20} 700 ${CHART.y + 130} 850 ${CHART.y + 60} S 1100 ${CHART.y + 10} ${CHART.x + CHART.w} ${CHART.y + 70} V${CHART.y} H${CHART.x} Z`, fill: '#bfa77a' }, paper);
    el('path', { d: 'M520 560 q40 -30 90 -4 q30 30 -10 50 q-60 14 -80 -46 Z', fill: '#b79e70' }, paper);
    el('path', { d: 'M1040 520 q50 -26 100 6 q16 40 -34 52 q-60 -2 -66 -58 Z', fill: '#b79e70' }, paper);
    for (let i = 0; i < 6; i += 1) {
      el('path', { d: `M${CHART.x} ${CHART.y + 120 + i * 48} C 560 ${CHART.y + 100 + i * 48} 800 ${CHART.y + 150 + i * 48} 1000 ${CHART.y + 120 + i * 48} S 1180 ${CHART.y + 130 + i * 48} ${CHART.x + CHART.w} ${CHART.y + 124 + i * 48}`, fill: 'none', stroke: '#a08c62', 'stroke-width': 2, opacity: 0.7 }, paper);
    }
    // The viewer: the attic itself, at the bottom of the chart.
    el('path', { d: 'M780 852 L800 828 L820 852 Z', fill: '#5a3f2a' }, paper);
    el('rect', { x: 784, y: 852, width: 32, height: 16, fill: '#5a3f2a' }, paper);
    // Compass rose.
    el('path', { d: 'M1160 570 L1168 548 L1176 570 L1198 578 L1176 586 L1168 608 L1160 586 L1138 578 Z', fill: '#8a6a48' }, paper);

    LIGHTHOUSES.forEach((l, i) => {
      el('circle', { cx: l.chart.x, cy: l.chart.y, r: 9, fill: '#3a2a22' }, paper);
      el('circle', { cx: l.chart.x, cy: l.chart.y, r: 3.5, fill: '#d9c7a0' }, paper);
      placeStars(l.glyph, ...chartConstellation(i), CHART_SIZE).forEach(([x, y]) => {
        el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: 4.5, fill: '#1d2142' }, paper);
      });
    });
    drawOwl(front, 150, 790, 0.9);

    const renderCurtain = () => curtainNode.setAttribute('transform', `translate(${curtain.toFixed(1)} 0)`);
    renderCurtain();

    const tick = (now: number) => {
      const t = now / 1000;
      LIGHTHOUSES.forEach((_, i) => { lamps[i].style.opacity = lampOn(i, t) ? '0.95' : '0'; });
      boatLamp.style.opacity = boatOn(t) ? '0.9' : '0';
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    let grab = 0;
    scene.draggable(curtainNode, {
      start: (p) => { grab = p.x - curtain; },
      move: (p) => {
        curtain = clamp(p.x - grab, 0, CURTAIN.reach);
        renderCurtain();
      },
      end: () => sound.paper(),
    });
    curtainNode.addEventListener('keydown', (event) => {
      const step = event.key === 'ArrowRight' ? 40 : event.key === 'ArrowLeft' ? -40 : 0;
      if (!step) return;
      event.preventDefault();
      curtain = clamp(curtain + step, 0, CURTAIN.reach);
      renderCurtain();
    });

    return {
      // Nothing is marked in the scene; the hint card shows the whole solution instead.
      revealHints: () => 0,
      hintSteps: (): HintStep[] => [
        {
          note: 'Kéo rèm sang phải để thấy hết bờ biển.',
          targets: [{ x: 1140, y: 270, r: 90, verb: 'drag', to: { x: 1140 + CURTAIN.reach, y: 270 }, object: '[data-hint="curtain"]' }],
          apply: () => {
            curtain = CURTAIN.reach;
            renderCurtain();
          },
        },
        {
          note: 'Mỗi ngọn hải đăng chớp theo nhóm riêng: đếm số lần chớp (1, 2, 3, 4; hai ngọn tắt, ánh đèn thuyền thất thường thì bỏ). So thứ tự từ trái sang phải với hải đồ phía dưới, đọc chòm bên cạnh ngọn đó, theo số lần chớp.',
          targets: [{
            x: 800, y: 330, r: 0, verb: 'look',
            act: (picture) => {
              const lampNodes = [...picture.querySelectorAll<SVGCircleElement>('[data-lamp]')];
              const boatNode = picture.querySelector<SVGCircleElement>('[data-boat]');
              return (p) => {
                const t = p * 4.2;
                lampNodes.forEach((n, i) => { n.style.opacity = lampOn(i, t - LIGHTHOUSES[i].offset) ? '0.95' : '0'; });
                if (boatNode) boatNode.style.opacity = '0';
              };
            },
          }],
        },
      ],
      destroy: () => cancelAnimationFrame(raf),
    };
  },
};

