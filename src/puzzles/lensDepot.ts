import { drawOwl } from '../core/owl';
import type { GlyphId } from '../core/glyphs';
import { placeStars } from '../core/glyphs';
import { SCENE_H, SCENE_W } from '../core/scene';
import { arrowIcon, el, toolButton, undoIcon } from '../core/svg';
import { starfield } from './sky';
import type { HintStep, PuzzleDef } from './types';
import { tr } from '../core/i18n';

/**
 * Chapter 4, level 5 — the lens depot ("kho thấu kính"), a box-pushing room. The owl pushes
 * crates of telescope lenses (never pulls) across the depot floor to four sockets in the rail
 * along the top wall. Each socket is outlined in one lens-frame shape (circle, square,
 * triangle, hexagon) and takes only the crate whose lens has that frame; two grey cracked
 * crates (diamond frames) fit no socket and are only in the way. A lens set in its socket
 * shines its constellation onto the little screen above. Pushing a crate into a corner or
 * against a wall can jam it for good, so there are Undo and Reset buttons. The answer is the
 * four constellations on the screens, left to right.
 */

/** '#' wall, '.' floor, 'S' a socket in the top rail (socket ids 0–3 go left to right). */
export const MAP: readonly string[] = [
  '#S#S#S#S#',
  '#.......#',
  '#.#...#.#',
  '#.......#',
  '#..#.#..#',
  '#.......#',
  '#########',
];
export const ROWS = MAP.length;
export const COLS = MAP[0].length;
export const DECOY = 4;

export interface Crate {
  /** 0–3: the socket it fits; 4: a cracked crate that fits none. */
  kind: number;
  r: number;
  c: number;
}
export interface DepotState {
  player: readonly [number, number];
  crates: readonly Crate[];
}

export const START: DepotState = {
  player: [1, 1],
  crates: [
    { kind: 0, r: 2, c: 1 },
    { kind: 1, r: 2, c: 3 },
    { kind: 2, r: 1, c: 2 },
    { kind: 3, r: 4, c: 2 },
    { kind: DECOY, r: 1, c: 6 },
    { kind: DECOY, r: 5, c: 7 },
  ],
};

/** The constellation each lens shines, by socket: the answer, left to right. */
export const LENS_GLYPHS: readonly GlyphId[] = ['hook', 'crown', 'belt', 'square'];
export const READING_ORDER: readonly GlyphId[] = LENS_GLYPHS;

/** A pushing order that solves the room: [crate row, crate column, dr, dc] before each push. */
export const PUSHES: readonly (readonly [number, number, number, number])[] = [
  [1, 2, 0, 1], [1, 3, 0, 1], [1, 4, 0, 1], [2, 1, -1, 0], [1, 1, -1, 0], [2, 3, -1, 0], [1, 3, -1, 0], [1, 5, -1, 0], [4, 2, -1, 0],
  [3, 2, 0, 1], [3, 3, 0, 1], [3, 4, 0, 1], [3, 5, 0, 1], [3, 6, 0, 1], [3, 7, -1, 0], [2, 7, -1, 0], [1, 7, -1, 0],
];

export const isWall = (r: number, c: number): boolean => r < 0 || c < 0 || r >= ROWS || c >= COLS || MAP[r][c] === '#';
export const isSocket = (r: number, c: number): boolean => r >= 0 && r < ROWS && c >= 0 && c < COLS && MAP[r][c] === 'S';
/** Socket id (0–3) of a rail cell, by its order from the left. */
export const socketId = (c: number): number => (c - 1) / 2;
export const socketCol = (id: number): number => 1 + 2 * id;

const crateAt = (crates: readonly Crate[], r: number, c: number): number => crates.findIndex((x) => x.r === r && x.c === c);

/** A crate can stand on floor, or in the one socket of its own kind. */
function crateCanStand(kind: number, r: number, c: number): boolean {
  if (isWall(r, c)) return false;
  if (isSocket(r, c)) return kind < DECOY && socketId(c) === kind;
  return true;
}

/**
 * The owl steps one cell, pushing a crate in front of it if the cell beyond is free and fits it.
 * Returns the new state, or null when the move is blocked (wall, socket, jammed crate).
 */
export function step(state: DepotState, dr: number, dc: number): DepotState | null {
  const [pr, pc] = state.player;
  const nr = pr + dr;
  const nc = pc + dc;
  if (isWall(nr, nc) || isSocket(nr, nc)) return null;
  const i = crateAt(state.crates, nr, nc);
  if (i < 0) return { player: [nr, nc], crates: state.crates };
  const br = nr + dr;
  const bc = nc + dc;
  if (!crateCanStand(state.crates[i].kind, br, bc) || crateAt(state.crates, br, bc) >= 0) return null;
  return { player: [nr, nc], crates: state.crates.map((x, k) => (k === i ? { ...x, r: br, c: bc } : x)) };
}

/** Every socket holds its own lens. */
export const isSolved = (state: DepotState): boolean => [0, 1, 2, 3].every((id) => state.crates.some((x) => x.kind === id && x.r === 0 && x.c === socketCol(id)));

/** Which sockets hold their lens. */
export const filledSockets = (state: DepotState): number[] =>
  [0, 1, 2, 3].filter((id) => state.crates.some((x) => x.kind === id && x.r === 0 && x.c === socketCol(id)));

/** The shortest walk (no pushing) from the owl to a cell, as steps, or null when it cannot get there. */
export function walkTo(state: DepotState, to: readonly [number, number]): [number, number][] | null {
  const start = state.player;
  const key = (r: number, c: number) => r * COLS + c;
  const prev = new Map<number, [number, number, number]>();
  prev.set(key(start[0], start[1]), [-1, 0, 0]);
  const queue: [number, number][] = [[start[0], start[1]]];
  for (let head = 0; head < queue.length; head += 1) {
    const [r, c] = queue[head];
    if (r === to[0] && c === to[1]) {
      const path: [number, number][] = [];
      let k = key(r, c);
      while (prev.get(k)![0] >= 0) {
        const [from, dr, dc] = prev.get(k)!;
        path.unshift([dr, dc]);
        k = from;
      }
      return path;
    }
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as const) {
      const nr = r + dr;
      const nc = c + dc;
      if (isWall(nr, nc) || isSocket(nr, nc) || crateAt(state.crates, nr, nc) >= 0 || prev.has(key(nr, nc))) continue;
      prev.set(key(nr, nc), [key(r, c), dr, dc]);
      queue.push([nr, nc]);
    }
  }
  return null;
}

/**
 * One press of the single roll-back button. `history` holds the state before each step, oldest first, and
 * is shortened to match. If the owl has walked since its last push, this goes back to just after that push
 * (undoing the walking); if it has just pushed, it goes back to just after the push before (undoing this
 * push and the steps leading to it); with no push yet, back to the start.
 */
export function rollBack(history: DepotState[], state: DepotState): DepotState {
  let prev = state;
  while (history.length && history[history.length - 1].crates === state.crates) prev = history.pop() as DepotState;
  if (prev !== state || !history.length) return prev;
  prev = history.pop() as DepotState;
  const before = prev.crates;
  while (history.length && history[history.length - 1].crates === before) prev = history.pop() as DepotState;
  return prev;
}

// ── Layout (scene units) ────────────────────────────────────────────────────────────────────
export const DEPOT = { x: 120, y: 215, cell: 92 };
export const cellCentre = (r: number, c: number): { x: number; y: number } => ({
  x: DEPOT.x + (c + 0.5) * DEPOT.cell,
  y: DEPOT.y + (r + 0.5) * DEPOT.cell,
});
const screenCentre = (id: number): { x: number; y: number } => ({ x: cellCentre(0, socketCol(id)).x, y: 125 });

const FRAMES = ['circle', 'square', 'triangle', 'hexagon', 'diamond'] as const;

/** Path of a lens frame of the given shape, centred on (0, 0), about `s` across. */
function framePath(shape: (typeof FRAMES)[number], s: number): string {
  const h = s / 2;
  switch (shape) {
    case 'circle': return `M${-h} 0 a${h} ${h} 0 1 0 ${s} 0 a${h} ${h} 0 1 0 ${-s} 0 Z`;
    case 'square': return `M${-h * 0.85} ${-h * 0.85} H${h * 0.85} V${h * 0.85} H${-h * 0.85} Z`;
    case 'triangle': return `M0 ${-h} L${h * 1.05} ${h * 0.85} H${-h * 1.05} Z`;
    case 'hexagon': return `M${h} 0 L${h / 2} ${h * 0.87} L${-h / 2} ${h * 0.87} L${-h} 0 L${-h / 2} ${-h * 0.87} L${h / 2} ${-h * 0.87} Z`;
    default: return `M0 ${-h} L${h} 0 L0 ${h} L${-h} 0 Z`;
  }
}

function drawCrate(parent: Element, kind: number, index: number): SVGGElement {
  const g = el('g', { 'data-hint': `crate-${index}`, 'pointer-events': 'none' }, parent);
  const decoy = kind === DECOY;
  el('rect', { x: -40, y: -40, width: 80, height: 80, rx: 10, fill: decoy ? '#6b6676' : '#8a6038', stroke: decoy ? '#3d3a46' : '#4a3220', 'stroke-width': 5 }, g);
  el('path', { d: framePath(FRAMES[kind], 46), fill: decoy ? '#9aa0a8' : '#bfe3f2', 'fill-opacity': decoy ? 0.45 : 0.7, stroke: decoy ? '#3d3a46' : '#d3a64f', 'stroke-width': 5, 'stroke-linejoin': 'round' }, g);
  if (decoy) el('path', { d: 'M-8 -22 L2 -4 L-6 6 L6 22', fill: 'none', stroke: '#2a2830', 'stroke-width': 3, 'stroke-linecap': 'round' }, g);
  return g;
}

export const lensDepot: PuzzleDef = {
  id: 'lens-depot',
  get name() {
    return tr('Kho thấu kính', 'Lens Depot');
  },
  answer: [...READING_ORDER],
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    let state: DepotState = START;
    const history: DepotState[] = [];
    let wasSolved = false;
    const crateNodes: SVGGElement[] = [];
    const projections: SVGGElement[] = [];

    // Back: the wall of the depot and its floor.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#14172b' }, back);
    starfield(back, { x: 0, y: 0, w: SCENE_W, h: 200 }, 30, 5505);
    scene.grain('back', 0.45);

    // Mid: floor tiles, walls, the rail with its sockets and the little screens above it.
    for (let r = 0; r < ROWS; r += 1) {
      for (let c = 0; c < COLS; c += 1) {
        const p = cellCentre(r, c);
        const x = p.x - DEPOT.cell / 2;
        const y = p.y - DEPOT.cell / 2;
        if (MAP[r][c] === '#') el('rect', { x, y, width: DEPOT.cell, height: DEPOT.cell, fill: '#2b2230', stroke: '#1d1722', 'stroke-width': 3, 'pointer-events': 'none' }, mid);
        else if (MAP[r][c] === 'S') el('rect', { x, y, width: DEPOT.cell, height: DEPOT.cell, fill: '#4a3a52', stroke: '#6b4f24', 'stroke-width': 4, 'pointer-events': 'none' }, mid);
        else el('rect', { x, y, width: DEPOT.cell, height: DEPOT.cell, fill: (r + c) % 2 ? '#3a2f3f' : '#352a3a', 'pointer-events': 'none' }, mid);
      }
    }
    for (let id = 0; id < 4; id += 1) {
      const p = cellCentre(0, socketCol(id));
      const s = el('g', { transform: `translate(${p.x} ${p.y})`, 'pointer-events': 'none' }, mid);
      el('path', { d: framePath(FRAMES[id], 52), fill: '#1a1424', stroke: '#d3a64f', 'stroke-width': 5, 'stroke-dasharray': '9 7', 'stroke-linejoin': 'round' }, s);
      const w = screenCentre(id);
      el('rect', { x: w.x - 60, y: w.y - 60, width: 120, height: 120, rx: 14, fill: '#0b0e1d', stroke: '#6b4f24', 'stroke-width': 5, 'pointer-events': 'none' }, mid);
      const proj = el('g', { 'pointer-events': 'none', 'data-proj': id }, mid);
      for (const [x, y] of placeStars(LENS_GLYPHS[id], w.x, w.y, 80)) el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: 7, fill: '#fff1c4' }, proj);
      proj.style.display = 'none';
      projections.push(proj);
    }

    // Front: crates, the owl, and the controls.
    START.crates.forEach((x, i) => crateNodes.push(drawCrate(front, x.kind, i)));
    const owl = el('g', { 'pointer-events': 'none', 'data-hint': 'owl' }, front);
    drawOwl(owl, 0, 4, 0.5);

    const plate = el('rect', { x: DEPOT.x, y: DEPOT.y, width: COLS * DEPOT.cell, height: ROWS * DEPOT.cell, fill: 'transparent', tabindex: 0, role: 'application', 'aria-label': tr('Kho thấu kính: dùng phím mũi tên để đẩy hòm', 'Lens depot: use the arrow keys to push the crates'), class: 'interactive' }, front);

    toolButton(front, 1260, 470, tr('Lên', 'Up'), (g) => arrowIcon(g, 0, -1), () => go(-1, 0));
    toolButton(front, 1260, 710, tr('Xuống', 'Down'), (g) => arrowIcon(g, 0, 1), () => go(1, 0));
    toolButton(front, 1140, 590, tr('Sang trái', 'Left'), (g) => arrowIcon(g, -1, 0), () => go(0, -1));
    toolButton(front, 1380, 590, tr('Sang phải', 'Right'), (g) => arrowIcon(g, 1, 0), () => go(0, 1));
    toolButton(front, 1260, 250, tr('Hoàn tác', 'Undo'), undoIcon, () => undo());
    drawOwl(front, 1500, 840, 0.7);

    const render = () => {
      state.crates.forEach((x, i) => {
        const p = cellCentre(x.r, x.c);
        crateNodes[i].setAttribute('transform', `translate(${p.x} ${p.y})`);
      });
      const q = cellCentre(state.player[0], state.player[1]);
      owl.setAttribute('transform', `translate(${q.x} ${q.y})`);
      const filled = filledSockets(state);
      projections.forEach((p, id) => { p.style.display = filled.includes(id) ? '' : 'none'; });
    };
    function go(dr: number, dc: number): void {
      const next = step(state, dr, dc);
      if (!next) return;
      const pushed = next.crates !== state.crates;
      history.push(state);
      state = next;
      if (pushed) sound.knock();
      else sound.tick();
      render();
      const done = isSolved(state);
      if (done && !wasSolved) sound.ding();
      wasSolved = done;
    }
    /** Rolls back the last push, with the steps before it. */
    function undo(): void {
      if (!history.length) return;
      const prev = rollBack(history, state);
      state = prev;
      sound.paper();
      wasSolved = isSolved(state);
      render();
    }
    plate.addEventListener('keydown', (event) => {
      const moves: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
      const m = moves[event.key];
      if (m) {
        event.preventDefault();
        go(m[0], m[1]);
      } else if (event.key === 'z' || event.key === 'Backspace') {
        event.preventDefault();
        undo();
      }
    });
    // A drag steers the owl one cell for every half cell travelled; a tap steps toward the tapped cell.
    let anchor = { x: 0, y: 0 };
    let dragged = false;
    const dominant = (dx: number, dy: number): [number, number] => (Math.abs(dx) >= Math.abs(dy) ? [0, Math.sign(dx)] : [Math.sign(dy), 0]);
    scene.draggable(plate, {
      start: (p) => {
        anchor = p;
        dragged = false;
        plate.focus();
      },
      move: (p) => {
        const dx = p.x - anchor.x;
        const dy = p.y - anchor.y;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < DEPOT.cell * 0.5) return;
        dragged = true;
        const [dr, dc] = dominant(dx, dy);
        go(dr, dc);
        anchor = p;
      },
      end: (p) => {
        if (dragged) return;
        const q = cellCentre(state.player[0], state.player[1]);
        const dx = p.x - q.x;
        const dy = p.y - q.y;
        if (Math.hypot(dx, dy) < DEPOT.cell * 0.3) return;
        const [dr, dc] = dominant(dx, dy);
        go(dr, dc);
      },
    });
    render();

    return {
      // Nothing is marked in the scene; the hint card shows the whole solution instead.
      revealHints: () => 0,
      hintSteps: (): HintStep[] => {
        const solvedState = (): DepotState => ({
          player: START.player,
          crates: START.crates.map((x) => (x.kind < DECOY ? { ...x, r: 0, c: socketCol(x.kind) } : x)),
        });
        const first = PUSHES[0];
        const from = cellCentre(first[0], first[1]);
        const to = cellCentre(first[0] + first[2], first[1] + first[3]);
        const index = START.crates.findIndex((x) => x.r === first[0] && x.c === first[1]);
        return [
          {
            note: tr('Đẩy hòm thấu kính (chú cú chỉ đẩy, không kéo) tới ổ khe cùng hình viền với thấu kính; hòm xám nứt không vào khe nào. Đẩy vào góc hay sát tường là kẹt — dùng nút Hoàn tác để lùi lại. Làm lần lượt cả bốn thấu kính.', 'Push each lens crate (the owl can only push, not pull) into the socket with the same outline as its lens; the cracked grey crates fit no socket. A crate pushed into a corner or against a wall is stuck — use Undo to step back. Do all four lenses in turn.'),
            targets: [{ x: from.x, y: from.y, r: 55, verb: 'drag', to, object: `[data-hint="crate-${index}"]` }],
            apply: () => {
              state = solvedState();
              history.length = 0;
              wasSolved = true;
              render();
            },
          },
          {
            note: tr('Thấu kính vào đúng khe thì chiếu chòm sao lên màn nhỏ phía trên. Đọc bốn màn từ trái sang phải.', 'A lens in the right socket throws its constellation onto the small screen above. Read the four screens from left to right.'),
            targets: [0, 1, 2, 3].map((id) => ({ x: screenCentre(id).x, y: screenCentre(id).y, r: 80, verb: 'look' as const })),
            prepare: (picture) => {
              const overlay = picture.querySelector('.layer-overlay') ?? picture;
              [0, 1, 2, 3].forEach((id) => {
                const w = screenCentre(id);
                const badge = el('g', { transform: `translate(${w.x + 52} ${w.y - 52})`, 'pointer-events': 'none' }, overlay);
                el('circle', { r: 17, class: 'number-badge' }, badge);
                el('text', { y: 1, class: 'number-text' }, badge).textContent = String(id + 1);
              });
            },
          },
        ];
      },
      destroy: () => undefined,
    };
  },
};
