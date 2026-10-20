import { drawOwl } from '../core/owl';
import { DEF, url } from '../core/defs';
import type { GlyphId } from '../core/glyphs';
import { SCENE_H, SCENE_W } from '../core/scene';
import { asButton, el } from '../core/svg';
import { glyphAt } from './sky';
import type { HintStep, PuzzleDef } from './types';
import { tr } from '../core/i18n';

/**
 * Chapter 2, level 12 — the circuit board ("bảng mạch"), the last level. Seven brass levers
 * with a constellation engraved beside each feed a pyramid of gates and four lamps. Current
 * runs along the wires (gold when live) and through gates the player has to read by watching
 * what they do: AND, OR and XOR in their usual drawings. All four lamps must be lit. There
 * is one way to set the levers that does it, with four of them down, and it takes working
 * back from the lamps through three layers of gates, trying a case or two, to find it. The
 * answer is the constellations beside the levers that are down, from the top lever to the
 * bottom.
 *
 * The point is to learn what the gates do, not to trace wires, so the board is a regular
 * pyramid: every gate reads the two signals right next to it in the column on its left, so
 * every wire is short and none ever crosses another. A strip under the board shows each gate
 * kind with its four cases (two inputs, one output) as lit and unlit dots, so it can be
 * looked up without words.
 */

export type GateType = 'AND' | 'OR' | 'XOR' | 'NOT';
export interface Gate {
  type: GateType;
  /** Source signals: 0–6 are the levers, 7 and up are gate outputs in order. */
  a: number;
  b: number;
}

/** Top to bottom. */
export const LEVERS: readonly GlyphId[] = ['triangle', 'dipper', 'crown', 'belt', 'hook', 'diamond', 'cross'];
const LEVER_COUNT = LEVERS.length;
/** Gates in each column of the pyramid, left to right. */
export const COLUMN_SIZES: readonly number[] = [6, 5, 4];

const TYPES: readonly (readonly GateType[])[] = [
  ['AND', 'XOR', 'AND', 'OR', 'AND', 'AND'],
  ['XOR', 'OR', 'XOR', 'AND', 'OR'],
  ['AND', 'OR', 'XOR', 'XOR'],
];
/** Gate k of a column reads signals k and k + 1 of the column before it (the levers for the first). */
export const GATES: readonly Gate[] = (() => {
  const out: Gate[] = [];
  let prevStart = 0;
  let start = LEVER_COUNT;
  COLUMN_SIZES.forEach((n, c) => {
    for (let k = 0; k < n; k += 1) out.push({ type: TYPES[c][k], a: prevStart + k, b: prevStart + k + 1 });
    prevStart = start;
    start += n;
  });
  return out;
})();
const LAST_START = LEVER_COUNT + COLUMN_SIZES[0] + COLUMN_SIZES[1];
export const LAMP_GATES: readonly number[] = Array.from({ length: COLUMN_SIZES[2] }, (_, k) => LAST_START + k);

/** The column (0 levers, 1–3 gates) a signal sits in. */
export const columnOf = (id: number): number => (id < LEVER_COUNT ? 0 : id < LEVER_COUNT + COLUMN_SIZES[0] ? 1 : id < LAST_START ? 2 : 3);

const apply = (type: GateType, a: boolean, b: boolean): boolean =>
  type === 'AND' ? a && b : type === 'OR' ? a || b : type === 'XOR' ? a !== b : !a;

/** Every signal for the given levers (true is down), levers first. */
export function signalsFor(levers: readonly boolean[]): boolean[] {
  const v = [...levers];
  for (const g of GATES) v.push(apply(g.type, v[g.a], g.b >= 0 ? v[g.b] : false));
  return v;
}
export const lampsFor = (levers: readonly boolean[]): boolean[] => {
  const v = signalsFor(levers);
  return LAMP_GATES.map((id) => v[id]);
};
export const allLit = (levers: readonly boolean[]): boolean => lampsFor(levers).every(Boolean);

/** All the lever settings that light every lamp. */
export function solutions(): boolean[][] {
  const out: boolean[][] = [];
  for (let m = 0; m < 1 << LEVERS.length; m += 1) {
    const levers = LEVERS.map((_, i) => ((m >> i) & 1) === 1);
    if (allLit(levers)) out.push(levers);
  }
  return out;
}
export const SOLUTION: readonly boolean[] = solutions()[0];
export const READING: readonly GlyphId[] = LEVERS.filter((_, i) => SOLUTION[i]);

// --- Layout (scene coordinates): each column sits half a step lower than the one before.
const STEP = 84;
const TOP = 150;
const COLUMN_X = [300, 580, 850, 1120];
const LAMP_X = 1350;
export const leverY = (i: number): number => TOP + i * STEP;
/** Place of signal `id`: a lever, or the gate of that number. */
export function signalAt(id: number): [number, number] {
  const col = columnOf(id);
  if (col === 0) return [COLUMN_X[0], leverY(id)];
  const first = col === 1 ? LEVER_COUNT : col === 2 ? LEVER_COUNT + COLUMN_SIZES[0] : LAST_START;
  return [COLUMN_X[col], TOP + (id - first + col * 0.5) * STEP];
}
export const gateAt = signalAt;
export const lampAt = (k: number): [number, number] => [LAMP_X, signalAt(LAMP_GATES[k])[1]];

/** How many pairs of wires between neighbouring columns cross, by straight-line count. */
export function wireCrossings(): number {
  const edges: { from: number; to: number }[] = [];
  GATES.forEach((g, gi) => {
    for (const src of g.type === 'NOT' ? [g.a] : [g.a, g.b]) edges.push({ from: src, to: LEVER_COUNT + gi });
  });
  let total = 0;
  for (let i = 0; i < edges.length; i += 1) {
    for (let j = i + 1; j < edges.length; j += 1) {
      const a = edges[i];
      const b = edges[j];
      if (columnOf(a.to) !== columnOf(b.to) || a.from === b.from || a.to === b.to) continue;
      if ((signalAt(a.from)[1] - signalAt(b.from)[1]) * (signalAt(a.to)[1] - signalAt(b.to)[1]) < 0) total += 1;
    }
  }
  return total;
}

function outPort(id: number): [number, number] {
  const [x, y] = signalAt(id);
  return [x + (id < LEVER_COUNT ? 34 : 54), y];
}
function inPort(gi: number, slot: 0 | 1): [number, number] {
  const [x, y] = signalAt(LEVER_COUNT + gi);
  const single = GATES[gi].type === 'NOT';
  return [x - 54, single ? y : y + (slot === 0 ? -15 : 15)];
}
const wire = (x1: number, y1: number, x2: number, y2: number): string => {
  const dx = (x2 - x1) * 0.5;
  return `M${x1} ${y1} C${x1 + dx} ${y1} ${x2 - dx} ${y2} ${x2} ${y2}`;
};

/** The gate kinds in the legend under the board, and how it is laid out. */
export const LEGEND_TYPES: readonly GateType[] = ['AND', 'OR', 'XOR'];
/** The four cases (a, b) of a two-input gate, and what comes out. */
export const legendCases = (type: GateType): { a: boolean; b: boolean; out: boolean }[] =>
  [0, 1, 2, 3].map((c) => ({ a: ((c >> 1) & 1) === 1, b: (c & 1) === 1, out: apply(type, ((c >> 1) & 1) === 1, (c & 1) === 1) }));

/** The drawing of each gate, centred on its box. */
const SYMBOL: Record<GateType, string> = {
  AND: 'M-18 -17 H-2 A17 17 0 0 1 -2 17 H-18 Z',
  OR: 'M-22 -17 Q-4 -17 20 0 Q-4 17 -22 17 Q-10 0 -22 -17 Z',
  XOR: 'M-18 -17 Q0 -17 22 0 Q0 17 -18 17 Q-6 0 -18 -17 Z M-27 -17 Q-15 0 -27 17',
  NOT: 'M-14 -15 L14 0 L-14 15 Z M18 0 m-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0',
};

export const circuitPanel: PuzzleDef = {
  id: 'circuit-panel',
  get name() {
    return tr('Bảng mạch sao', 'Star Circuit');
  },
  answer: [...READING],
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    const levers: boolean[] = LEVERS.map(() => false);
    const handles: SVGGElement[] = [];
    const wires: { id: number; node: SVGPathElement }[] = [];
    const lampNodes: SVGGElement[] = [];
    let wasLit = false;

    // Back: the attic wall.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#241a17' }, back);
    for (let x = 80; x < SCENE_W; x += 160) el('line', { x1: x, y1: -20, x2: x, y2: SCENE_H + 20, stroke: '#1a1210', 'stroke-width': 4 }, back);
    scene.grain('back', 0.4);

    // Mid: panel, wires under gates, gates, levers, lamps.
    el('rect', { x: 110, y: 88, width: 1340, height: 640, rx: 20, fill: '#2b2230', stroke: '#6b4f24', 'stroke-width': 8 }, mid);
    const wireLayer = el('g', { fill: 'none', 'pointer-events': 'none' }, mid);
    GATES.forEach((g, gi) => {
      const sources: [number, 0 | 1][] = g.type === 'NOT' ? [[g.a, 0]] : [[g.a, 0], [g.b, 1]];
      for (const [src, slot] of sources) {
        const [x1, y1] = outPort(src);
        const [x2, y2] = inPort(gi, slot);
        wires.push({ id: src, node: el('path', { d: wire(x1, y1, x2, y2), 'stroke-width': 5, 'stroke-linecap': 'round' }, wireLayer) });
      }
    });
    LAMP_GATES.forEach((gid, k) => {
      const [x1, y1] = outPort(gid);
      const [x2, y2] = lampAt(k);
      wires.push({ id: gid, node: el('path', { d: wire(x1, y1, x2 - 34, y2), 'stroke-width': 5, 'stroke-linecap': 'round' }, wireLayer) });
    });

    GATES.forEach((g, gi) => {
      const [x, y] = signalAt(LEVER_COUNT + gi);
      const node = el('g', { transform: `translate(${x} ${y})` }, mid);
      el('rect', { x: -54, y: -34, width: 108, height: 68, rx: 12, fill: '#1c1626', stroke: '#6b4f24', 'stroke-width': 3 }, node);
      el('path', { d: SYMBOL[g.type], fill: 'none', stroke: '#ece6d6', 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, node);
    });

    LEVERS.forEach((id, i) => {
      const y = leverY(i);
      glyphAt(mid, id, 190, y, 64, { star: 5, line: 0, colour: '#fff1c4' });
      const g = el('g', { class: 'lever interactive', 'data-hint': `lever-${i}`, transform: `translate(${COLUMN_X[0]} ${y})` }, mid);
      el('rect', { x: -34, y: -40, width: 68, height: 80, fill: 'transparent' }, g);
      el('rect', { x: -29, y: -38, width: 58, height: 76, rx: 29, fill: '#120d18', stroke: '#6b4f24', 'stroke-width': 3 }, g);
      const handle = el('g', {}, g);
      el('circle', { r: 24, fill: '#d3a64f', stroke: '#8a6a2c', 'stroke-width': 4 }, handle);
      el('circle', { r: 8, fill: '#f6efd8' }, handle);
      handles.push(handle);
      asButton(g, tr(`Cần gạt ${i + 1}`, `Lever ${i + 1}`), () => {
        levers[i] = !levers[i];
        sound.knock();
        render();
      });
    });

    LAMP_GATES.forEach((_, k) => {
      const [x, y] = lampAt(k);
      const g = el('g', { transform: `translate(${x} ${y})`, 'pointer-events': 'none' }, mid);
      el('circle', { r: 30, fill: '#120d18', stroke: '#6b4f24', 'stroke-width': 4 }, g);
      el('path', { d: 'M0 -18 L5 -6 L18 -6 L8 3 L12 16 L0 8 L-12 16 L-8 3 L-18 -6 L-5 -6 Z', class: 'bulb' }, g);
      lampNodes.push(g);
    });
    // The legend under the board: each gate kind with its four cases, as lit and unlit dots.
    el('rect', { x: 110, y: 744, width: 1340, height: 130, rx: 16, fill: '#221b28', stroke: '#6b4f24', 'stroke-width': 5 }, mid);
    LEGEND_TYPES.forEach((type, t) => {
      const x0 = 190 + t * 420;
      const y0 = 758;
      const box = el('g', { transform: `translate(${x0 + 54} ${y0 + 52})`, 'pointer-events': 'none' }, mid);
      el('rect', { x: -54, y: -34, width: 108, height: 68, rx: 12, fill: '#1c1626', stroke: '#6b4f24', 'stroke-width': 3 }, box);
      el('path', { d: SYMBOL[type], fill: 'none', stroke: '#ece6d6', 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, box);
      legendCases(type).forEach((c, k) => {
        const x = x0 + 150 + k * 62;
        const dot = (cy: number, on: boolean, r: number) =>
          el('circle', { cx: x, cy, r, fill: on ? '#f4c66a' : '#2f2b4a', stroke: on ? '#fff1c4' : '#5a6099', 'stroke-width': 2, 'pointer-events': 'none' }, mid);
        dot(y0 + 14, c.a, 9);
        dot(y0 + 40, c.b, 9);
        el('line', { x1: x, y1: y0 + 54, x2: x, y2: y0 + 70, stroke: '#5a6099', 'stroke-width': 3, 'pointer-events': 'none' }, mid);
        dot(y0 + 90, c.out, 12);
      });
      if (t > 0) el('line', { x1: x0 - 40, y1: 764, x2: x0 - 40, y2: 854, stroke: '#4a3a60', 'stroke-width': 3, 'pointer-events': 'none' }, mid);
    });
    drawOwl(front, 56, 790, 0.6);

    const render = () => {
      const v = signalsFor(levers);
      wires.forEach(({ id, node }) => {
        node.setAttribute('stroke', v[id] ? '#f4c66a' : '#5a6099');
        node.setAttribute('opacity', v[id] ? '1' : '0.85');
      });
      handles.forEach((h, i) => h.setAttribute('transform', `translate(0 ${levers[i] ? 12 : -12})`));
      lampNodes.forEach((g, k) => {
        const on = v[LAMP_GATES[k]];
        const bulb = g.querySelector('.bulb') as SVGPathElement;
        bulb.setAttribute('fill', on ? '#fff1c4' : '#3a3550');
        bulb.setAttribute('filter', on ? url(DEF.glow) : '');
      });
      const lit = LAMP_GATES.every((id) => v[id]);
      if (lit && !wasLit) sound.ding();
      wasLit = lit;
    };
    render();

    return {
      // Nothing is marked in the scene; the hint card shows the whole solution instead.
      revealHints: () => 0,
      hintSteps: (): HintStep[] => {
        const first = SOLUTION.findIndex(Boolean);
        return [
          {
            note: tr('Gạt cần xuống thì điện (vàng) chạy qua dây và các cổng. Phải làm cả bốn đèn sáng: lần ngược từ mỗi đèn qua các cổng (AND cần cả hai đầu vào có điện, OR cần một, XOR cần đúng một) để biết cần gạt nào phải xuống. Chỉ có một cách.', 'Pull a lever down and power (gold) runs through the wires and gates. All four lamps must light: trace back from each lamp through the gates (AND needs both inputs powered, OR needs one, XOR needs exactly one) to find which levers must be down. There is only one way.'),
            targets: [{ x: COLUMN_X[0], y: leverY(first) - 12, r: 44, verb: 'tap', turn: 0, object: `[data-hint="lever-${first}"]` }],
            apply: () => {
              SOLUTION.forEach((on, i) => { levers[i] = on; });
              render();
            },
          },
          {
            note: tr('Cả bốn đèn đã sáng. Đọc các chòm khắc cạnh những cần gạt đang gạt xuống, từ trên xuống dưới.', 'All four lamps are lit. Read the constellations carved beside the levers that are down, from top to bottom.'),
            targets: SOLUTION.flatMap((on, i) => (on ? [{ x: 190, y: leverY(i), r: 60, verb: 'look' as const }] : [])),
          },
        ];
      },
      destroy: () => undefined,
    };
  },
};
