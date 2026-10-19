import { glyph, placeStars, type GlyphId } from '../core/glyphs';
import { drawOwl } from '../core/owl';
import { SCENE_H, SCENE_W } from '../core/scene';
import { el, resetIcon, toolButton } from '../core/svg';
import { clamp, tween } from '../core/tween';
import { starfield } from './sky';
import type { HintStep, PuzzleDef } from './types';
import { tr } from '../core/i18n';

/**
 * Chapter 5, level 10 — the rail loop ("đường ray vòng"), a slither-link. A 6 × 6 board of squares, some
 * showing 0–3 dots: how many of that square's four sides have a rail. Lay rails along the sides (tap or drag a
 * finger over them; again for a cross meaning "no rail") so that they join into one closed loop that never forks.
 * A toy engine stands on one fixed stretch, facing one way. When the loop is right the engine runs round it
 * and lights each station it passes; seven stations carry a constellation, four of them on the loop. Read those
 * four in the order the engine passes them.
 */

export const N = 6;
export const CELL = 100;
export const ORIGIN = { x: 200, y: 150 };
/** 0 = nothing, 1 = rail, 2 = cross (no rail here). */
export type Mark = 0 | 1 | 2;

// Edges: horizontal ones first (vertex row 0..N, between columns c and c+1), then vertical ones.
export const H_EDGES = (N + 1) * N;
export const EDGES = 2 * N * (N + 1);
export const hEdge = (r: number, c: number): number => r * N + c;
export const vEdge = (r: number, c: number): number => H_EDGES + r * (N + 1) + c;
export const vertexId = (r: number, c: number): number => r * (N + 1) + c;
export const VERTICES = (N + 1) * (N + 1);
export const vertexRC = (v: number): [number, number] => [Math.floor(v / (N + 1)), v % (N + 1)];
export const vertexXY = (v: number): { x: number; y: number } => {
  const [r, c] = vertexRC(v);
  return { x: ORIGIN.x + c * CELL, y: ORIGIN.y + r * CELL };
};
export const edgeEnds = (e: number): [number, number] => {
  if (e < H_EDGES) {
    const r = Math.floor(e / N);
    const c = e % N;
    return [vertexId(r, c), vertexId(r, c + 1)];
  }
  const k = e - H_EDGES;
  const r = Math.floor(k / (N + 1));
  const c = k % (N + 1);
  return [vertexId(r, c), vertexId(r + 1, c)];
};
export const edgeMid = (e: number): { x: number; y: number } => {
  const [a, b] = edgeEnds(e);
  return { x: (vertexXY(a).x + vertexXY(b).x) / 2, y: (vertexXY(a).y + vertexXY(b).y) / 2 };
};
/** The four sides of square (r, c): top, bottom, left, right. */
export const cellEdges = (r: number, c: number): number[] => [hEdge(r, c), hEdge(r + 1, c), vEdge(r, c), vEdge(r, c + 1)];
export const edgesAt = (v: number): number[] => {
  const [r, c] = vertexRC(v);
  const out: number[] = [];
  if (c > 0) out.push(hEdge(r, c - 1));
  if (c < N) out.push(hEdge(r, c));
  if (r > 0) out.push(vEdge(r - 1, c));
  if (r < N) out.push(vEdge(r, c));
  return out;
};

/** The numbers in the squares (row by row), −1 for a square with none. */
export const CLUES: readonly number[] = [
  0, -1, 0, -1, 2, -1,
  -1, -1, -1, -1, 1, 3,
  -1, -1, -1, 3, -1, -1,
  -1, 1, 2, -1, 1, 2,
  3, -1, -1, -1, 3, -1,
  -1, -1, 2, -1, 1, -1,
];
/** The one stretch laid at the start, and the way the engine on it faces. */
export const FIXED_EDGE = 38;
export const TRAIN_FROM = vertexId(6, 2);
export const TRAIN_TO = vertexId(6, 3);
/** The loop that solves it. */
export const SOLUTION: readonly number[] = [4, 5, 9, 11, 15, 17, 20, 21, 23, 24, 27, 31, 34, 36, 37, 38, 46, 48, 52, 54, 60, 62, 65, 68, 70, 71, 72, 73, 74, 75, 77, 80];

/** The stations, at points of the board's edge: vertex → constellation. */
export const STATIONS: Readonly<Record<number, GlyphId>> = {
  [vertexId(3, 6)]: 'cross', [vertexId(0, 5)]: 'dipper', [vertexId(4, 0)]: 'square', [vertexId(6, 1)]: 'crown',
  [vertexId(0, 1)]: 'triangle', [vertexId(2, 0)]: 'belt', [vertexId(6, 5)]: 'hook',
};

export const emptyMarks = (): Mark[] => {
  const m = Array.from({ length: EDGES }, () => 0 as Mark);
  m[FIXED_EDGE] = 1;
  return m;
};
export const nextMark = (m: Mark): Mark => ((m + 1) % 3) as Mark;
export const railsAround = (marks: readonly Mark[], r: number, c: number): number => cellEdges(r, c).filter((e) => marks[e] === 1).length;
export const degree = (marks: readonly Mark[], v: number): number => edgesAt(v).filter((e) => marks[e] === 1).length;
export const clueDone = (marks: readonly Mark[], r: number, c: number): boolean => CLUES[r * N + c] < 0 || railsAround(marks, r, c) === CLUES[r * N + c];

/** The vertices of the loop in order, from the engine's start in its direction; null if the rails are not one closed loop. */
export function loopFrom(marks: readonly Mark[]): number[] | null {
  const on = marks.flatMap((m, e) => (m === 1 ? [e] : []));
  if (!on.length) return null;
  const adj = new Map<number, number[]>();
  for (const e of on) {
    const [a, b] = edgeEnds(e);
    adj.set(a, [...(adj.get(a) ?? []), b]);
    adj.set(b, [...(adj.get(b) ?? []), a]);
  }
  if ([...adj.values()].some((l) => l.length !== 2)) return null;
  if (marks[FIXED_EDGE] !== 1) return null;
  const order = [TRAIN_FROM, TRAIN_TO];
  let prev = TRAIN_FROM;
  let cur = TRAIN_TO;
  for (let guard = 0; guard < VERTICES + 2; guard += 1) {
    const next = (adj.get(cur) as number[]).find((x) => x !== prev) as number;
    if (next === TRAIN_FROM) return order.length === adj.size ? order : null;
    order.push(next);
    prev = cur;
    cur = next;
  }
  return null;
}
/** Solved: the rails make one closed loop through the fixed stretch and every number is right. */
export const isSolved = (marks: readonly Mark[]): boolean => loopFrom(marks) !== null && CLUES.every((_, i) => clueDone(marks, Math.floor(i / N), i % N));

export const solutionMarks = (): Mark[] => {
  const m = Array.from({ length: EDGES }, () => 0 as Mark);
  SOLUTION.forEach((e) => { m[e] = 1; });
  return m;
};
export const SOLUTION_LOOP: readonly number[] = loopFrom(solutionMarks()) as number[];
/** The constellations of the stations on the loop, in the order the engine passes them. */
export const READING: readonly GlyphId[] = SOLUTION_LOOP.flatMap((v) => (STATIONS[v] ? [STATIONS[v]] : []));

/** The edge nearest a point of the scene, if one is close enough. */
export function nearestEdge(x: number, y: number, tolerance = 34): number {
  let best = -1;
  let bestD = tolerance;
  for (let e = 0; e < EDGES; e += 1) {
    const [a, b] = edgeEnds(e);
    const p = vertexXY(a);
    const q = vertexXY(b);
    const dx = q.x - p.x;
    const dy = q.y - p.y;
    const k = clamp(((x - p.x) * dx + (y - p.y) * dy) / (dx * dx + dy * dy), 0, 1);
    const d = Math.hypot(x - (p.x + dx * k), y - (p.y + dy * k));
    if (d < bestD) { bestD = d; best = e; }
  }
  return best;
}

// ---------------------------------------------------------------- solving (for tests)

/** Edge values while solving: −1 unknown, 0 no rail, 1 rail. */
function propagate(st: number[]): boolean {
  let changed = true;
  while (changed) {
    changed = false;
    for (let v = 0; v < VERTICES; v += 1) {
      const es = edgesAt(v);
      const on = es.filter((e) => st[e] === 1).length;
      const unknown = es.filter((e) => st[e] === -1);
      if (on > 2) return false;
      if (on === 2 && unknown.length) { unknown.forEach((e) => { st[e] = 0; }); changed = true; }
      else if (on === 1 && unknown.length === 0) return false;
      else if (on === 1 && unknown.length === 1) { st[unknown[0]] = 1; changed = true; }
      else if (on === 0 && unknown.length === 1) { st[unknown[0]] = 0; changed = true; }
    }
    for (let i = 0; i < N * N; i += 1) {
      const k = CLUES[i];
      if (k < 0) continue;
      const es = cellEdges(Math.floor(i / N), i % N);
      const on = es.filter((e) => st[e] === 1).length;
      const unknown = es.filter((e) => st[e] === -1);
      if (on > k || on + unknown.length < k) return false;
      if (on === k && unknown.length) { unknown.forEach((e) => { st[e] = 0; }); changed = true; }
      else if (on + unknown.length === k && unknown.length) { unknown.forEach((e) => { st[e] = 1; }); changed = true; }
    }
    // A closed loop before every rail is part of it cannot be right.
    const onEdges = st.flatMap((s, e) => (s === 1 ? [e] : []));
    if (onEdges.length) {
      const seen = new Set<number>();
      for (const e0 of onEdges) {
        if (seen.has(e0)) continue;
        const stack = [e0];
        seen.add(e0);
        const deg = new Map<number, number>();
        while (stack.length) {
          const e = stack.pop() as number;
          for (const v of edgeEnds(e)) {
            deg.set(v, (deg.get(v) ?? 0) + 1);
            for (const f of edgesAt(v)) if (st[f] === 1 && !seen.has(f)) { seen.add(f); stack.push(f); }
          }
        }
        const closed = [...deg.values()].every((d) => d === 2);
        if (closed && seen.size !== onEdges.length) return false;
      }
    }
  }
  return true;
}

/** How many closed loops through the fixed stretch fit every number (stops at `limit`). */
export function countSolutions(limit = 2): number {
  const start = Array.from({ length: EDGES }, () => -1);
  start[FIXED_EDGE] = 1;
  let found = 0;
  const walk = (st: number[]) => {
    if (found >= limit) return;
    const t = [...st];
    if (!propagate(t)) return;
    const u = t.indexOf(-1);
    if (u < 0) {
      const marks = t.map((s) => (s === 1 ? 1 : 0) as Mark);
      if (isSolved(marks)) found += 1;
      return;
    }
    const a = [...t];
    a[u] = 1;
    walk(a);
    const b = [...t];
    b[u] = 0;
    walk(b);
  };
  walk(start);
  return found;
}

/** Solves by reasoning alone: the rules of each square and point, and trying one stretch to see it fail. */
export function solvedByReasoning(): boolean {
  const st = Array.from({ length: EDGES }, () => -1);
  st[FIXED_EDGE] = 1;
  if (!propagate(st)) return false;
  let progress = true;
  while (progress) {
    progress = false;
    for (let e = 0; e < EDGES && !progress; e += 1) {
      if (st[e] !== -1) continue;
      for (const val of [1, 0]) {
        const t = [...st];
        t[e] = val;
        if (!propagate(t)) {
          st[e] = 1 - val;
          if (!propagate(st)) return false;
          progress = true;
          break;
        }
      }
    }
  }
  return st.every((s) => s !== -1);
}

// ---------------------------------------------------------------- drawing

const CLAY = '#e6dcc0';
const GOLD = '#ffd45a';
const RED = '#ff6a50';
/** Offsets of the dots of a number in a square (0 draws a hollow ring instead). */
export function dotOffsets(n: number): [number, number][] {
  if (n === 1) return [[0, 0]];
  if (n === 2) return [[-14, -14], [14, 14]];
  if (n === 3) return [[-16, -16], [0, 0], [16, 16]];
  return [];
}
const cellCentre = (r: number, c: number): { x: number; y: number } => ({ x: ORIGIN.x + (c + 0.5) * CELL, y: ORIGIN.y + (r + 0.5) * CELL });
/** Where a station's sign hangs: outside the board, beyond its point of the edge. */
export const signXY = (v: number): { x: number; y: number } => {
  const [r, c] = vertexRC(v);
  const at = vertexXY(v);
  if (r === 0) return { x: at.x, y: at.y - 78 };
  if (r === N) return { x: at.x, y: at.y + 78 };
  if (c === 0) return { x: at.x - 78, y: at.y };
  return { x: at.x + 78, y: at.y };
};
export const RUN_SECONDS = 6.4;

/** Shows each stretch's mark, the numbers (gold when right, red when too many), and points with more than two rails. */
export function paintBoard(root: ParentNode, marks: readonly Mark[]): void {
  for (let e = 0; e < EDGES; e += 1) {
    const g = root.querySelector(`[data-edge="${e}"]`);
    if (!g) continue;
    const rail = g.querySelector<SVGElement>('[data-role="rail"]');
    const cross = g.querySelector<SVGElement>('[data-role="cross"]');
    const faint = g.querySelector<SVGElement>('[data-role="faint"]');
    if (rail) rail.style.display = marks[e] === 1 ? '' : 'none';
    if (cross) cross.style.display = marks[e] === 2 ? '' : 'none';
    if (faint) faint.style.opacity = marks[e] === 0 ? '1' : '0.25';
  }
  for (let i = 0; i < N * N; i += 1) {
    if (CLUES[i] < 0) continue;
    const r = Math.floor(i / N);
    const c = i % N;
    const have = railsAround(marks, r, c);
    const colour = have === CLUES[i] ? GOLD : have > CLUES[i] ? RED : CLAY;
    root.querySelectorAll(`[data-clue="${i}"] [data-role="pip"]`).forEach((n) => n.setAttribute('fill', colour));
    root.querySelectorAll(`[data-clue="${i}"] [data-role="zero"]`).forEach((n) => n.setAttribute('stroke', colour));
  }
  for (let v = 0; v < VERTICES; v += 1) {
    root.querySelector(`[data-vertex="${v}"]`)?.setAttribute('fill', degree(marks, v) > 2 ? RED : '#8a8470');
  }
}

/** Puts the engine `t` seconds into its lap of `order` and lights the stations it has passed (nothing before the lap: t < 0). */
export function paintRun(root: ParentNode, order: readonly number[], t: number): void {
  const n = order.length;
  const k = t < 0 ? 0 : clamp(t / RUN_SECONDS, 0, 1) * n;
  const i = Math.min(n - 1, Math.floor(k));
  const a = vertexXY(order[i]);
  const b = vertexXY(order[(i + 1) % n]);
  const f = k - i;
  const x = a.x + (b.x - a.x) * f;
  const y = a.y + (b.y - a.y) * f;
  const angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
  root.querySelector('[data-role="train"]')?.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${angle.toFixed(1)})`);
  const passed = new Set(order.slice(0, Math.floor(k) + 1));
  for (const v of Object.keys(STATIONS).map(Number)) {
    const lit = t >= 0 && passed.has(v) && order.includes(v) && (t >= RUN_SECONDS || order.indexOf(v) <= Math.floor(k));
    root.querySelectorAll<SVGElement>(`[data-station="${v}"] [data-role="glow"]`).forEach((g) => { g.style.display = lit ? '' : 'none'; });
  }
}

/** When solved: the stations on the loop keep their light and the others step back. */
export function paintFinish(root: ParentNode, order: readonly number[] | null): void {
  for (const v of Object.keys(STATIONS).map(Number)) {
    root.querySelector(`[data-station="${v}"]`)?.setAttribute('opacity', order && !order.includes(v) ? '0.35' : '1');
  }
}

export const railLoop: PuzzleDef = {
  id: 'rail-loop',
  get name() {
    return tr('Đường ray vòng', 'Rail Loop');
  },
  answer: [...READING],
  get help() {
    return [
      tr('Số chấm trong một ô là số cạnh của ô đó có ray (vòng tròn rỗng: không cạnh nào có ray). Ô không có số thì có bao nhiêu ray cũng được. Ô nhỏ bên phải là một ví dụ đã làm xong.', 'The number of dots in a square is how many of its sides have track (an empty ring: no side has track). A square with no number can have any amount of track. The small grid on the right is a solved example.'),
      tr('Chạm hoặc kéo ngón tay trên các cạnh để đặt ray; chạm lần nữa để đánh dấu chéo "không có ray", lần nữa để xoá. Các ray phải nối thành một vòng kín duy nhất, đi qua đoạn ray có đầu máy và không rẽ nhánh (chỗ có hơn hai ray hiện đỏ; ô có quá nhiều ray cũng đỏ, đủ ray thì vàng).', 'Tap or drag your finger along the sides to lay track; tap again to mark a cross ("no track"), and again to clear. The track must join into a single closed loop that runs through the piece of track with the engine and never branches (a spot with more than two tracks turns red; a square with too much track turns red too, and gold when it has just enough).'),
      tr('Vòng đúng thì đầu máy chạy một vòng theo chiều nó đang hướng, và đèn các ga nó đi qua sáng lên: đọc chòm sao của các ga đó theo thứ tự.', 'When the loop is right, the engine runs once around it the way it faces, and the lamps of the stations it passes light up: read the constellations of those stations in order.'),
    ];
  },
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    const marks = emptyMarks();
    let solved = false;
    let running = false;
    let cancel = () => {};
    let cursor = hEdge(0, 0);

    // Back: a dispatcher's board.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#16211d' }, back);
    starfield(back, { x: 0, y: 0, w: SCENE_W, h: SCENE_H }, 30, 1010, '#8fb8a6');
    el('rect', { x: ORIGIN.x - 34, y: ORIGIN.y - 34, width: N * CELL + 68, height: N * CELL + 68, rx: 22, fill: '#243a32', stroke: '#0e1a16', 'stroke-width': 8 }, back);
    scene.grain('back', 0.3);

    // Mid: the numbers, the stretches and the stations.
    for (let i = 0; i < N * N; i += 1) {
      const r = Math.floor(i / N);
      const c = i % N;
      el('rect', { x: ORIGIN.x + c * CELL + 6, y: ORIGIN.y + r * CELL + 6, width: CELL - 12, height: CELL - 12, rx: 10, fill: '#2e4a40', opacity: 0.55, 'pointer-events': 'none' }, mid);
      if (CLUES[i] < 0) continue;
      const at = cellCentre(r, c);
      const g = el('g', { 'data-clue': i, transform: `translate(${at.x} ${at.y})`, 'pointer-events': 'none' }, mid);
      if (CLUES[i] === 0) el('circle', { r: 14, fill: 'none', stroke: CLAY, 'stroke-width': 5, 'data-role': 'zero' }, g);
      else for (const [dx, dy] of dotOffsets(CLUES[i])) el('circle', { cx: dx, cy: dy, r: 8.5, fill: CLAY, 'data-role': 'pip' }, g);
    }
    for (let e = 0; e < EDGES; e += 1) {
      const [a, b] = edgeEnds(e);
      const p = vertexXY(a);
      const q = vertexXY(b);
      const g = el('g', { 'data-edge': e, 'pointer-events': 'none' }, mid);
      el('line', { x1: p.x, y1: p.y, x2: q.x, y2: q.y, stroke: '#6f8a7c', 'stroke-width': 4, 'stroke-dasharray': '2 9', 'stroke-linecap': 'round', 'data-role': 'faint' }, g);
      const rail = el('g', { 'data-role': 'rail', style: 'display:none' }, g);
      el('line', { x1: p.x, y1: p.y, x2: q.x, y2: q.y, stroke: '#1a1410', 'stroke-width': 18, 'stroke-linecap': 'round' }, rail);
      el('line', { x1: p.x, y1: p.y, x2: q.x, y2: q.y, stroke: '#c9a46a', 'stroke-width': 10, 'stroke-linecap': 'round' }, rail);
      const mid2 = edgeMid(e);
      const horizontal = e < H_EDGES;
      for (const d of [-22, 0, 22]) {
        const sx = horizontal ? mid2.x + d : mid2.x;
        const sy = horizontal ? mid2.y : mid2.y + d;
        el('line', { x1: horizontal ? sx : sx - 13, y1: horizontal ? sy - 13 : sy, x2: horizontal ? sx : sx + 13, y2: horizontal ? sy + 13 : sy, stroke: '#7a5a30', 'stroke-width': 5, 'stroke-linecap': 'round' }, rail);
      }
      const cross = el('g', { 'data-role': 'cross', style: 'display:none' }, g);
      el('path', { d: `M${mid2.x - 11} ${mid2.y - 11} L${mid2.x + 11} ${mid2.y + 11} M${mid2.x + 11} ${mid2.y - 11} L${mid2.x - 11} ${mid2.y + 11}`, stroke: '#d9806a', 'stroke-width': 5, 'stroke-linecap': 'round', fill: 'none' }, cross);
    }
    for (let v = 0; v < VERTICES; v += 1) el('circle', { cx: vertexXY(v).x, cy: vertexXY(v).y, r: 6, fill: '#8a8470', 'data-vertex': v, 'pointer-events': 'none' }, mid);
    for (const key of Object.keys(STATIONS)) {
      const v = Number(key);
      const at = vertexXY(v);
      const sg = signXY(v);
      const g = el('g', { 'data-station': v, 'pointer-events': 'none' }, mid);
      el('line', { x1: at.x, y1: at.y, x2: sg.x, y2: sg.y, stroke: '#e6dcc0', 'stroke-width': 4 }, g);
      el('rect', { x: sg.x - 42, y: sg.y - 31, width: 84, height: 62, rx: 10, fill: '#13182e', stroke: '#e6dcc0', 'stroke-width': 4 }, g);
      el('circle', { cx: sg.x, cy: sg.y, r: 56, fill: '#fff3c8', opacity: 0.3, 'data-role': 'glow', style: 'display:none' }, g);
      for (const [sx, sy] of placeStars(STATIONS[v], sg.x, sg.y, 46)) el('circle', { cx: sx.toFixed(1), cy: sy.toFixed(1), r: 4, fill: '#fff8dc' }, g);
      el('circle', { cx: at.x, cy: at.y, r: 13, fill: '#ffe2a0', stroke: '#8a6a3a', 'stroke-width': 4 }, g);
    }
    const cursorLine = el('line', { stroke: '#ffd45a', 'stroke-width': 5, 'stroke-linecap': 'round', opacity: 0.9, 'pointer-events': 'none', style: 'display:none' }, front);

    // A tiny finished example on the right, so the rule can be seen: dots = rails around a square.
    const MINI = { x: 1010, y: 170, cell: 86 };
    const region = new Set([0, 1, 3, 4, 5].map((i) => i));
    const inRegion = (r: number, c: number) => r >= 0 && r < 3 && c >= 0 && c < 3 && region.has(r * 3 + c);
    const mini = el('g', { 'pointer-events': 'none' }, front);
    el('rect', { x: MINI.x - 30, y: MINI.y - 30, width: 3 * MINI.cell + 60, height: 3 * MINI.cell + 60, rx: 20, fill: '#243a32', stroke: '#e6dcc0', 'stroke-width': 4, 'stroke-dasharray': '10 8' }, mini);
    for (let r = 0; r < 3; r += 1) for (let c = 0; c < 3; c += 1) {
      const cx = MINI.x + (c + 0.5) * MINI.cell;
      const cy = MINI.y + (r + 0.5) * MINI.cell;
      let count = 0;
      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) if (inRegion(r, c) !== inRegion(r + dr, c + dc)) count += 1;
      if (count === 0) continue;
      for (const [dx, dy] of dotOffsets(count)) el('circle', { cx: cx + dx * 0.8, cy: cy + dy * 0.8, r: 7, fill: GOLD }, mini);
    }
    const seg = (x1: number, y1: number, x2: number, y2: number) => {
      el('line', { x1, y1, x2, y2, stroke: '#1a1410', 'stroke-width': 14, 'stroke-linecap': 'round' }, mini);
      el('line', { x1, y1, x2, y2, stroke: '#c9a46a', 'stroke-width': 8, 'stroke-linecap': 'round' }, mini);
    };
    for (let r = 0; r <= 3; r += 1) for (let c = 0; c < 3; c += 1) if (inRegion(r - 1, c) !== inRegion(r, c)) seg(MINI.x + c * MINI.cell, MINI.y + r * MINI.cell, MINI.x + (c + 1) * MINI.cell, MINI.y + r * MINI.cell);
    for (let r = 0; r < 3; r += 1) for (let c = 0; c <= 3; c += 1) if (inRegion(r, c - 1) !== inRegion(r, c)) seg(MINI.x + c * MINI.cell, MINI.y + r * MINI.cell, MINI.x + c * MINI.cell, MINI.y + (r + 1) * MINI.cell);

    // The engine, standing on its fixed stretch (it runs round the loop when the loop is right).
    const train = el('g', { 'data-role': 'train', 'pointer-events': 'none' }, front);
    el('rect', { x: -26, y: -16, width: 52, height: 32, rx: 9, fill: '#3b3f6a', stroke: '#f4c66a', 'stroke-width': 4 }, train);
    el('rect', { x: 4, y: -24, width: 22, height: 18, rx: 4, fill: '#4a4f86', stroke: '#f4c66a', 'stroke-width': 3 }, train);
    el('rect', { x: -20, y: -26, width: 10, height: 14, rx: 3, fill: '#2a2e52' }, train);
    el('path', { d: 'M30 -10 L44 0 L30 10 Z', fill: '#f4c66a' }, train);
    drawOwl(front, 1100, 790, 0.85);
    const resetBtn = toolButton(front, 1450, 800, tr('Xoá hết ray, đặt lại', 'Clear all track and start over'), resetIcon, () => reset());

    const refresh = () => {
      paintBoard(scene.root, marks);
      if (!running && !solved) paintRun(scene.root, SOLUTION_LOOP, -1);
      cursorLine.style.display = 'none';
    };
    const showCursor = (on: boolean) => {
      if (!on || solved) { cursorLine.style.display = 'none'; return; }
      const [a, b] = edgeEnds(cursor);
      cursorLine.setAttribute('x1', String(vertexXY(a).x));
      cursorLine.setAttribute('y1', String(vertexXY(a).y));
      cursorLine.setAttribute('x2', String(vertexXY(b).x));
      cursorLine.setAttribute('y2', String(vertexXY(b).y));
      cursorLine.style.display = '';
    };
    // Before the lap the engine stands on its stretch facing along it.
    const standAtStart = () => {
      const a = vertexXY(TRAIN_FROM);
      const b = vertexXY(TRAIN_TO);
      train.setAttribute('transform', `translate(${(a.x + b.x) / 2} ${(a.y + b.y) / 2}) rotate(${(Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI})`);
    };
    standAtStart();
    refresh();
    standAtStart();

    const finishIfSolved = () => {
      if (solved || running || !isSolved(marks)) return;
      const lap = loopFrom(marks) as number[];
      running = true;
      sound.knock();
      cancel = tween(RUN_SECONDS * 1000, (k) => {
        paintRun(scene.root, lap, k * RUN_SECONDS);
        if (k >= 1) {
          solved = true;
          running = false;
          paintRun(scene.root, lap, RUN_SECONDS);
          paintFinish(scene.root, lap);
          standAtStart();
          sound.ding();
          for (const g of [resetBtn, pane]) {
            g.style.pointerEvents = 'none';
            g.classList.remove('interactive');
            g.removeAttribute('tabindex');
            g.setAttribute('aria-disabled', 'true');
          }
        }
      }, (k) => k);
    };
    function reset(): void {
      if (running || solved) return;
      marks.splice(0, marks.length, ...emptyMarks());
      sound.tick();
      refresh();
      standAtStart();
    }

    // Tap or drag over the stretches: the first one pressed sets what the rest become.
    const pane = el('rect', { x: ORIGIN.x - 50, y: ORIGIN.y - 50, width: N * CELL + 100, height: N * CELL + 100, fill: 'transparent', class: 'interactive', tabindex: 0, role: 'application', style: 'outline: none', 'aria-label': tr('Bàn ray: chạm hoặc kéo trên các cạnh để đặt ray; phím mũi tên chọn cạnh, Enter đổi dấu, V đổi ngang / dọc', 'Track board: tap or drag on the sides to lay track; arrow keys pick a side, Enter changes its mark, V switches across / up-down') }, front);
    let paintWith: Mark | null = null;
    const setEdge = (e: number, m: Mark) => {
      if (e < 0 || e === FIXED_EDGE || marks[e] === m) return;
      marks[e] = m;
      sound.tick();
      refresh();
    };
    scene.draggable(pane, {
      start: (p) => {
        if (running || solved) { paintWith = null; return; }
        const e = nearestEdge(p.x, p.y);
        if (e < 0 || e === FIXED_EDGE) { paintWith = null; return; }
        paintWith = nextMark(marks[e]);
        setEdge(e, paintWith);
      },
      move: (p) => {
        if (paintWith === null || running || solved) return;
        setEdge(nearestEdge(p.x, p.y), paintWith);
      },
      end: () => {
        paintWith = null;
        finishIfSolved();
      },
    });
    pane.addEventListener('focus', () => showCursor(true));
    pane.addEventListener('blur', () => showCursor(false));
    pane.addEventListener('keydown', (event) => {
      if (running || solved) return;
      const horizontal = cursor < H_EDGES;
      const rc = horizontal ? [Math.floor(cursor / N), cursor % N] : [Math.floor((cursor - H_EDGES) / (N + 1)), (cursor - H_EDGES) % (N + 1)];
      const rows = horizontal ? N + 1 : N;
      const cols = horizontal ? N : N + 1;
      const make = (r: number, c: number) => (horizontal ? hEdge(r, c) : vEdge(r, c));
      let [r, c] = rc;
      if (event.key === 'ArrowLeft') c = Math.max(0, c - 1);
      else if (event.key === 'ArrowRight') c = Math.min(cols - 1, c + 1);
      else if (event.key === 'ArrowUp') r = Math.max(0, r - 1);
      else if (event.key === 'ArrowDown') r = Math.min(rows - 1, r + 1);
      else if (event.key === 'v' || event.key === 'V') {
        event.preventDefault();
        cursor = horizontal ? vEdge(Math.min(N - 1, rc[0]), Math.min(N, rc[1])) : hEdge(Math.min(N, rc[0]), Math.min(N - 1, rc[1]));
        showCursor(true);
        return;
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (cursor !== FIXED_EDGE) { marks[cursor] = nextMark(marks[cursor]); sound.tick(); refresh(); showCursor(true); finishIfSolved(); }
        return;
      } else return;
      event.preventDefault();
      cursor = make(r, c);
      showCursor(true);
    });

    return {
      revealHints: () => 0,
      hintSteps: (): HintStep[] => {
        const loopEdges = SOLUTION_LOOP.map((v, i) => {
          const w = SOLUTION_LOOP[(i + 1) % SOLUTION_LOOP.length];
          return edgesAt(v).find((e) => edgeEnds(e).includes(w) && edgeEnds(e).includes(v)) as number;
        });
        const half = Math.floor(loopEdges.length / 2);
        const upTo = (n: number): Mark[] => {
          const m = emptyMarks();
          loopEdges.slice(0, n).forEach((e) => { m[e] = 1; });
          return m;
        };
        const first = edgeMid(loopEdges[3]);
        return [
          {
            note: tr('Số chấm trong ô là số cạnh của ô có ray. Chạm hoặc kéo ngón tay trên các cạnh để đặt ray (lần nữa: dấu chéo "không có ray"). Ray phải nối thành một vòng kín duy nhất, không rẽ nhánh, đi qua đoạn ray có đầu máy.', 'The number of dots in a square is how many of its sides have track. Tap or drag your finger along the sides to lay track (again: a cross for "no track"). The track must join into a single closed loop, with no branches, running through the piece of track with the engine.'),
            targets: [{
              x: first.x, y: first.y, r: 50, verb: 'tap',
              act: (picture) => (p) => paintBoard(picture, upTo(1 + Math.floor(p * (half - 1)))),
            }],
            apply: () => {
              marks.splice(0, marks.length, ...upTo(half));
              refresh();
            },
          },
          {
            note: tr('Làm tiếp tới khi mọi số đều vàng và vòng khép kín. Mỗi số cho biết cạnh nào chắc chắn có hay không có ray, rồi suy dần.', 'Keep going until every number is gold and the loop is closed. Each number tells you which sides surely do or do not have track; work it out step by step.'),
            targets: [{
              x: edgeMid(loopEdges[loopEdges.length - 2]).x, y: edgeMid(loopEdges[loopEdges.length - 2]).y, r: 0, verb: 'look',
              act: (picture) => (p) => paintBoard(picture, upTo(half + Math.floor(p * (loopEdges.length - half)))),
            }],
            apply: () => {
              marks.splice(0, marks.length, ...solutionMarks());
              solved = true;
              refresh();
              paintRun(scene.root, SOLUTION_LOOP, RUN_SECONDS);
              paintFinish(scene.root, SOLUTION_LOOP);
              standAtStart();
            },
          },
          {
            note: tr('Vòng khép kín thì đầu máy chạy một vòng theo chiều nó đang hướng, đèn các ga trên vòng sáng lên khi tàu qua. Đọc chòm sao của bốn ga đó theo thứ tự tàu đi qua.', 'Once the loop is closed, the engine runs once around it the way it faces, and the lamps of the stations on the loop light up as it passes. Read the constellations of those four stations in the order the train passes them.'),
            targets: SOLUTION_LOOP.filter((v) => STATIONS[v]).map((v) => ({ x: signXY(v).x, y: signXY(v).y, r: 64, verb: 'look' as const })),
            prepare: (picture) => {
              const overlay = picture.querySelector('.layer-overlay') ?? picture;
              SOLUTION_LOOP.filter((v) => STATIONS[v]).forEach((v, n) => {
                const sg = signXY(v);
                const stars = placeStars(STATIONS[v], sg.x, sg.y, 46);
                for (const [a, b] of glyph(STATIONS[v]).lines) el('line', { x1: stars[a][0], y1: stars[a][1], x2: stars[b][0], y2: stars[b][1], class: 'hint-line', 'pointer-events': 'none' }, overlay);
                const badge = el('g', { transform: `translate(${sg.x - 38} ${sg.y - 28})`, 'pointer-events': 'none' }, overlay);
                el('circle', { r: 15, class: 'number-badge' }, badge);
                el('text', { y: 1, class: 'number-text' }, badge).textContent = String(n + 1);
              });
            },
          },
        ];
      },
      destroy: () => cancel(),
    };
  },
};

