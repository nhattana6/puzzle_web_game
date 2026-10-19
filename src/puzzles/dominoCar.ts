import { glyph, placeStars, type GlyphId } from '../core/glyphs';
import { drawOwl } from '../core/owl';
import { SCENE_H, SCENE_W } from '../core/scene';
import { asButton, el, resetIcon, toolButton } from '../core/svg';
import { clamp, tween } from '../core/tween';
import { seeded } from './sky';
import type { HintStep, PuzzleDef } from './types';

/**
 * Chapter 5, level 9 — dominoes in the goods wagon ("domino toa hàng"). A line of standing dominoes
 * runs across the wagon floor, forking into four branches; each branch ends at a little bell. Nine places
 * in the lines are missing a domino, and the owl has only four spare ones. Tap the first domino and they
 * topple one after another, a fixed time apart: where a domino is missing the fall stops. Every bell that
 * is reached rings. The lines are not a plain tree: one stretch can be gone round by a detour, and one
 * bell can be reached from another bell's line, so some gaps are not worth a spare. Only if all four ring
 * in one push do their constellations show; they are read in the order the bells rang (the shorter the
 * way, the sooner), which the order cards then show.
 */

export const STEP = 34;
/** Seconds between one domino falling and the next. */
export const DT = 0.08;
/** Seconds a domino takes to fall flat. */
export const FALL = 0.14;

export interface BranchDef {
  id: string;
  /** The branch this one forks from, at that branch's last domino (null for the first). */
  from: string | null;
  pts: readonly (readonly [number, number])[];
  /** Which dominoes of the branch (counting from 1) are missing at the start. */
  gaps: readonly number[];
  /** A branch that ends at a bell: its index in BELLS. */
  bell?: number;
  /** The last domino of this branch also touches this domino of another branch (a detour rejoining, a bridge). */
  join?: { branch: string; index: number };
}

export const BRANCHES: readonly BranchDef[] = [
  { id: 'T1', from: null, pts: [[150, 430], [330, 430]], gaps: [] },
  { id: 'S1', from: 'T1', pts: [[330, 430], [330, 580], [260, 680]], gaps: [5] },
  // The straight way to the fork has two gaps; the detour above it has one.
  { id: 'A', from: 'T1', pts: [[330, 430], [640, 430]], gaps: [3, 6] },
  { id: 'B', from: 'T1', pts: [[330, 430], [390, 330], [560, 330], [618, 398]], gaps: [5], join: { branch: 'A', index: 9 } },
  { id: 'S2', from: 'A', pts: [[640, 430], [860, 430]], gaps: [3] },
  { id: 'AL', from: 'A', pts: [[640, 430], [740, 310], [840, 260]], gaps: [] },
  { id: 'AR', from: 'A', pts: [[640, 430], [740, 550], [840, 600]], gaps: [3] },
  { id: 'L1', from: 'AL', pts: [[840, 260], [930, 150], [1090, 150], [1130, 215], [1330, 215]], gaps: [6], bell: 0 },
  { id: 'L2', from: 'AL', pts: [[840, 260], [1000, 285]], gaps: [], bell: 1 },
  // From the end of L2 up to L1: the way round L1's gap.
  { id: 'BR', from: 'L2', pts: [[1000, 285], [1060, 250], [1100, 215]], gaps: [], join: { branch: 'L1', index: 11 } },
  { id: 'L3', from: 'AR', pts: [[840, 600], [880, 490], [960, 490], [1000, 590], [1080, 590], [1120, 490], [1200, 490], [1240, 590], [1320, 590], [1360, 490], [1450, 500]], gaps: [8], bell: 2 },
  { id: 'L4', from: 'AR', pts: [[840, 600], [900, 720], [1000, 720], [1050, 650], [1150, 650], [1200, 720], [1330, 720], [1330, 650]], gaps: [6], bell: 3 },
];

export interface Piece {
  id: number;
  branch: string;
  /** 0 for the first domino (the one that is pushed), then 1, 2, … along the branch. */
  index: number;
  x: number;
  y: number;
  /** Direction of the line here, in degrees. */
  angle: number;
  parent: number | null;
  gap: boolean;
}

const lengthOf = (pts: BranchDef['pts']): number => pts.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);
/** The point at distance `d` along a polyline, and the direction of the line there. */
function along(pts: BranchDef['pts'], d: number): { x: number; y: number; angle: number } {
  let left = d;
  for (let i = 1; i < pts.length; i += 1) {
    const seg = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (left <= seg + 1e-6 || i === pts.length - 1) {
      const k = seg ? clamp(left / seg, 0, 1) : 0;
      return {
        x: pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k,
        y: pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k,
        angle: (Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0]) * 180) / Math.PI,
      };
    }
    left -= seg;
  }
  return { x: pts[0][0], y: pts[0][1], angle: 0 };
}

function build(): { pieces: Piece[]; last: Record<string, number>; adj: number[][] } {
  const pieces: Piece[] = [];
  const last: Record<string, number> = {};
  for (const b of BRANCHES) {
    const n = Math.max(1, Math.round(lengthOf(b.pts) / STEP));
    const len = lengthOf(b.pts);
    let parent: number | null = b.from ? last[b.from] : null;
    for (let i = b.from ? 1 : 0; i <= n; i += 1) {
      const at = along(b.pts, (i * len) / n);
      const piece: Piece = { id: pieces.length, branch: b.id, index: i, x: at.x, y: at.y, angle: at.angle, parent, gap: b.gaps.includes(i) };
      pieces.push(piece);
      parent = piece.id;
    }
    last[b.id] = parent as number;
  }
  // Who touches whom: each domino and its parent, plus the extra touch of a detour or bridge.
  const adj: number[][] = pieces.map(() => []);
  const link = (a: number, b: number) => { adj[a].push(b); adj[b].push(a); };
  for (const p of pieces) if (p.parent !== null) link(p.id, p.parent);
  for (const b of BRANCHES) {
    if (!b.join) continue;
    const other = pieces.find((p) => p.branch === b.join!.branch && p.index === b.join!.index);
    if (other) link(last[b.id], other.id);
  }
  return { pieces, last, adj };
}
const BUILT = build();
export const PIECES: readonly Piece[] = BUILT.pieces;
/** The id of the last domino of each branch. */
export const LAST_PIECE: Readonly<Record<string, number>> = BUILT.last;
/** For each domino, the dominoes it touches (so a fall can pass either way along a line). */
export const NEIGHBOURS: readonly (readonly number[])[] = BUILT.adj;
/** The pieces that are missing at the start (the five places for a spare domino). */
export const GAPS: readonly number[] = PIECES.filter((p) => p.gap).map((p) => p.id);
export const SPARES = 4;
/** The piece of a branch at an index. */
export const pieceAt = (branch: string, index: number): number => PIECES.find((p) => p.branch === branch && p.index === index)?.id ?? -1;

/** The bells, by the order of their branches; each has a constellation behind it. */
export interface BellDef {
  branch: string;
  glyph: GlyphId;
}
export const BELLS: readonly BellDef[] = [
  { branch: 'L1', glyph: 'belt' },
  { branch: 'L2', glyph: 'dipper' },
  { branch: 'L3', glyph: 'crown' },
  { branch: 'L4', glyph: 'triangle' },
];
export const bellXY = (k: number): { x: number; y: number } => {
  const b = BRANCHES.find((x) => x.id === BELLS[k].branch) as BranchDef;
  const [x, y] = b.pts[b.pts.length - 1];
  return { x, y };
};

/** When each domino falls (seconds after the push), or Infinity if it never does. `filled` holds the gaps with a spare in them. */
export function fallTimes(filled: ReadonlySet<number>): number[] {
  const times: number[] = PIECES.map(() => Infinity);
  times[0] = 0;
  const queue = [0];
  for (let q = 0; q < queue.length; q += 1) {
    const at = queue[q];
    for (const next of NEIGHBOURS[at]) {
      if (Number.isFinite(times[next]) || (PIECES[next].gap && !filled.has(next))) continue;
      times[next] = times[at] + DT;
      queue.push(next);
    }
  }
  return times;
}
/** When each bell rings (Infinity if it is not reached): a little after the last domino of its branch falls. */
export const ringTimes = (filled: ReadonlySet<number>): number[] => {
  const times = fallTimes(filled);
  return BELLS.map((b) => times[LAST_PIECE[b.branch]] + DT / 2);
};
export const ringing = (filled: ReadonlySet<number>): number[] => ringTimes(filled).flatMap((t, k) => (Number.isFinite(t) ? [k] : []));
export const allRing = (filled: ReadonlySet<number>): boolean => ringing(filled).length === BELLS.length;

/** The four gaps that must be filled: the detour above the straight way, the way down to L3 and L4, and each of those two. */
export const SOLUTION_GAPS: readonly number[] = [['B', 5], ['AR', 3], ['L3', 8], ['L4', 6]].map(([b, i]) => pieceAt(b as string, i as number));

/** The bells in the order they ring when the spares are in the right places (indices into BELLS). */
export const RING_ORDER: readonly number[] = ringTimes(new Set(SOLUTION_GAPS)).map((t, k) => ({ t, k })).sort((a, b) => a.t - b.t).map(({ k }) => k);
export const READING: readonly GlyphId[] = RING_ORDER.map((k) => BELLS[k].glyph);

/** Every way to put the spares (a set of gaps of size SPARES). */
export function placements(): number[][] {
  const out: number[][] = [];
  const walk = (from: number, chosen: number[]) => {
    if (chosen.length === SPARES) { out.push([...chosen]); return; }
    for (let i = from; i < GAPS.length; i += 1) walk(i + 1, [...chosen, GAPS[i]]);
  };
  walk(0, []);
  return out;
}

// ---------------------------------------------------------------- drawing

export const TRAY = { x: 140, y: 830 };
export const spareHome = (i: number): { x: number; y: number } => ({ x: TRAY.x + 40 + i * 78, y: TRAY.y });
export const RUN_END = Math.max(...ringTimes(new Set(SOLUTION_GAPS))) + 1.2;

/** Draws a standing domino (seen from above) at the origin, its length across the line. */
function drawDomino(parent: Element, gold = false): SVGGElement {
  const g = el('g', {}, parent);
  el('rect', { x: -5, y: -15, width: 10, height: 30, rx: 3, fill: gold ? '#f4c66a' : '#e8e0c8', stroke: gold ? '#8a5a10' : '#4a4052', 'stroke-width': 3 }, g);
  el('circle', { cx: 0, cy: -7, r: 2.2, fill: '#2a2432' }, g);
  el('circle', { cx: 0, cy: 7, r: 2.2, fill: '#2a2432' }, g);
  return g;
}

/**
 * Paints the line `t` seconds after the push, in the scene or in a copy: each domino lying down by how far it has
 * fallen, the spares standing in their gaps, each bell swinging once reached.
 */
export function paintRun(root: ParentNode, filled: ReadonlySet<number>, t: number): void {
  const times = fallTimes(filled);
  for (const p of PIECES) {
    const node = root.querySelector<SVGElement>(`[data-piece="${p.id}"]`);
    if (!node) continue;
    if (p.gap) node.style.display = filled.has(p.id) ? '' : 'none';
    const k = t < 0 ? 0 : clamp((t - times[p.id]) / FALL, 0, 1);
    node.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${p.angle.toFixed(1)}) translate(${(k * 6).toFixed(1)} 0) scale(${(1 + k * 2.4).toFixed(2)} ${(1 - k * 0.25).toFixed(2)})`);
    node.setAttribute('opacity', k > 0 ? (1 - 0.25 * k).toFixed(2) : '1');
  }
  ringTimes(filled).forEach((rt, k) => {
    const bell = root.querySelector<SVGElement>(`[data-bell="${k}"] [data-role="swing"]`);
    if (!bell) return;
    const since = t - rt;
    const swing = Number.isFinite(rt) && since >= 0 && since < 1.2 ? Math.sin(since * 34) * 22 * (1 - since / 1.2) : 0;
    bell.setAttribute('transform', `rotate(${swing.toFixed(1)})`);
  });
}

/** Shows the constellations in the bells' plaques and the order cards when all four rang (or hides them). */
export function paintFinish(root: ParentNode, solved: boolean): void {
  root.querySelectorAll<SVGElement>('[data-role="plaque"]').forEach((n) => { n.style.display = solved ? '' : 'none'; });
  root.querySelectorAll<SVGElement>('[data-role="flag"]').forEach((n) => { n.style.display = solved ? '' : 'none'; });
}

export const dominoCar: PuzzleDef = {
  id: 'domino-car',
  name: 'Domino toa hàng',
  answer: [...READING],
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    /** gap piece id → the spare it holds. */
    const placed = new Map<number, number>();
    const filledSet = () => new Set(placed.keys());
    let phase: 'set' | 'running' | 'done' | 'won' = 'set';
    let cancel = () => {};
    let timer = 0;

    // Back: the wagon floor.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#241a14' }, back);
    el('rect', { x: 60, y: 60, width: 1480, height: 730, rx: 18, fill: '#8a6a44', stroke: '#4a3220', 'stroke-width': 14 }, back);
    const grain = seeded(99);
    for (let i = 0; i < 11; i += 1) {
      el('line', { x1: 66, y1: 60 + i * 66, x2: 1534, y2: 60 + i * 66, stroke: '#6a4e30', 'stroke-width': 4 }, back);
      for (let k = 0; k < 3; k += 1) el('line', { x1: 150 + grain() * 1300, y1: 60 + i * 66 + 4, x2: 150 + grain() * 1300, y2: 60 + i * 66 + 62, stroke: '#7a5a38', 'stroke-width': 3, opacity: 0.6 }, back);
    }
    scene.grain('back', 0.3);

    // Mid: the gaps, the dominoes, the bells and their plaques.
    const gapMarks = new Map<number, SVGGElement>();
    for (const id of GAPS) {
      const p = PIECES[id];
      const g = el('g', { class: 'interactive', 'data-gap': id, transform: `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})` }, mid);
      el('circle', { r: 46, fill: 'transparent' }, g);
      el('circle', { r: 22, fill: 'none', stroke: '#f4c66a', 'stroke-width': 4, 'stroke-dasharray': '7 6', opacity: 0.9, 'pointer-events': 'none' }, g);
      gapMarks.set(id, g);
    }
    for (const p of PIECES) {
      const g = drawDomino(mid, p.id === 0);
      g.setAttribute('data-piece', String(p.id));
      g.setAttribute('pointer-events', 'none');
      g.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${p.angle.toFixed(1)})`);
      if (p.gap) g.style.display = 'none';
    }
    BELLS.forEach((b, k) => {
      const at = bellXY(k);
      const g = el('g', { 'data-bell': k, transform: `translate(${at.x} ${at.y - 6})`, 'pointer-events': 'none' }, mid);
      const swing = el('g', { 'data-role': 'swing' }, g);
      el('path', { d: 'M-24 24 Q-24 -16 0 -26 Q24 -16 24 24 Z', fill: '#d9b04a', stroke: '#7a5a10', 'stroke-width': 4 }, swing);
      el('rect', { x: -30, y: 22, width: 60, height: 8, rx: 4, fill: '#b8902a', stroke: '#7a5a10', 'stroke-width': 3 }, swing);
      el('circle', { cx: 0, cy: 36, r: 7, fill: '#6a4a10' }, swing);
      el('circle', { cx: 0, cy: -30, r: 6, fill: '#7a5a10' }, g);
      // Behind the bell: the plaque with its constellation, once all four have rung.
      const plaque = el('g', { 'data-role': 'plaque', style: 'display:none', transform: 'translate(0 78)' }, g);
      el('rect', { x: -56, y: -40, width: 112, height: 80, rx: 10, fill: '#13182e', stroke: '#ffd45a', 'stroke-width': 5 }, plaque);
      for (const [sx, sy] of placeStars(b.glyph, 0, -6, 52)) el('circle', { cx: sx.toFixed(1), cy: sy.toFixed(1), r: 4.2, fill: '#fff8dc' }, plaque);
      const order = RING_ORDER.indexOf(k) + 1;
      for (let d = 0; d < order; d += 1) el('circle', { cx: -((order - 1) * 7) + d * 14, cy: 28, r: 3.4, fill: '#ffd45a' }, plaque);
    });

    // Front: the tray of spares, the flag, the reset button and the owl.
    el('rect', { x: TRAY.x - 20, y: TRAY.y - 36, width: 40 + SPARES * 78, height: 72, rx: 16, fill: '#3a2a1c', stroke: '#6a4a2a', 'stroke-width': 5 }, mid);
    const spares: SVGGElement[] = [];
    for (let i = 0; i < SPARES; i += 1) {
      const h = spareHome(i);
      const g = el('g', { class: 'interactive', 'data-spare': i, 'data-hint': `spare-${i}`, transform: `translate(${h.x} ${h.y})` }, front);
      el('rect', { x: -38, y: -42, width: 76, height: 84, fill: 'transparent' }, g);
      const body = drawDomino(g);
      body.setAttribute('transform', 'scale(1.4)');
      body.setAttribute('pointer-events', 'none');
      spares.push(g);
    }
    const flag = el('g', { 'data-role': 'flag', style: 'display:none', transform: 'translate(560 830)', 'pointer-events': 'none' }, front);
    el('line', { x1: 0, y1: 30, x2: 0, y2: -34, stroke: '#e8e0c8', 'stroke-width': 6, 'stroke-linecap': 'round' }, flag);
    el('path', { d: 'M0 -34 L44 -20 L0 -6 Z', fill: '#e0533c' }, flag);
    const pusher = PIECES[0];
    const pushRing = el('circle', { cx: pusher.x, cy: pusher.y, r: 34, fill: 'none', stroke: '#f4c66a', 'stroke-width': 4, opacity: 0.8, 'pointer-events': 'none' }, front);
    const push = el('g', { class: 'interactive', 'data-role': 'push', transform: `translate(${pusher.x} ${pusher.y})` }, front);
    el('circle', { r: 56, fill: 'transparent' }, push);
    const resetBtn = toolButton(front, 1450, 830, 'Dựng lại các quân domino', resetIcon, () => reset());
    drawOwl(front, 1330, 835, 0.8);

    const label = (id: number) => `Chỗ trống ${GAPS.indexOf(id) + 1}: ${placed.has(id) ? 'đã đặt quân, chạm để lấy lại' : 'chạm để đặt quân dự phòng'}`;
    const refresh = (t = -1) => {
      paintRun(scene.root, filledSet(), t);
      spares.forEach((g, i) => {
        const used = [...placed.values()].includes(i);
        g.style.display = used ? 'none' : '';
        const h = spareHome(i);
        g.setAttribute('transform', `translate(${h.x} ${h.y})`);
      });
      gapMarks.forEach((g, id) => {
        g.setAttribute('aria-label', label(id));
        const ring = g.querySelectorAll('circle')[1];
        ring?.setAttribute('opacity', placed.has(id) ? '0.25' : '0.9');
      });
      pushRing.style.display = phase === 'set' ? '' : 'none';
    };
    const lockAll = () => {
      for (const g of [...gapMarks.values(), ...spares, push, resetBtn]) {
        g.style.pointerEvents = 'none';
        g.classList.remove('interactive');
        g.removeAttribute('tabindex');
        g.setAttribute('aria-disabled', 'true');
      }
    };

    const freeSpare = (): number => spares.findIndex((_, i) => ![...placed.values()].includes(i));
    const place = (gap: number, spare = freeSpare()) => {
      if (phase !== 'set' || placed.has(gap) || spare < 0) return false;
      placed.set(gap, spare);
      sound.paper();
      refresh();
      return true;
    };
    const take = (gap: number) => {
      if (phase !== 'set' || !placed.has(gap)) return;
      placed.delete(gap);
      sound.tick();
      refresh();
    };
    function reset(): void {
      if (phase === 'running' || phase === 'won') return;
      window.clearTimeout(timer);
      cancel();
      phase = 'set';
      refresh(-1);
    }

    gapMarks.forEach((g, id) => asButton(g, label(id), () => (placed.has(id) ? take(id) : place(id))));

    // Drag a spare out of the tray onto a gap.
    spares.forEach((g, i) => {
      let home = spareHome(i);
      scene.draggable(g, {
        start: () => {
          home = spareHome(i);
          g.parentNode?.appendChild(g);
        },
        move: (p) => g.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`),
        end: (p) => {
          let best = -1;
          let bestD = 70;
          for (const id of GAPS) {
            if (placed.has(id)) continue;
            const d = Math.hypot(PIECES[id].x - p.x, PIECES[id].y - p.y);
            if (d < bestD) { bestD = d; best = id; }
          }
          if (best >= 0 && phase === 'set') place(best, i);
          else g.setAttribute('transform', `translate(${home.x} ${home.y})`);
        },
      });
      g.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        const gap = GAPS.find((id) => !placed.has(id));
        if (gap !== undefined) place(gap, i);
      });
      g.setAttribute('tabindex', '0');
      g.setAttribute('role', 'button');
      g.setAttribute('aria-label', `Quân domino dự phòng ${i + 1}: kéo vào một chỗ trống`);
    });

    const start = () => {
      if (phase !== 'set') return;
      phase = 'running';
      pushRing.style.display = 'none';
      const filled = filledSet();
      sound.knock();
      const rings = ringTimes(filled);
      const rang = new Set<number>();
      let ticked = -1;
      cancel = tween(RUN_END * 1000, (k) => {
        const t = k * RUN_END;
        paintRun(scene.root, filled, t);
        const n = Math.floor(t / (DT * 3));
        if (n !== ticked && t < Math.max(...fallTimes(filled).filter(Number.isFinite)) + 0.2) { ticked = n; sound.tick(); }
        rings.forEach((rt, b) => { if (!rang.has(b) && t >= rt) { rang.add(b); sound.ding(); } });
      }, (k) => k);
      timer = window.setTimeout(() => {
        paintRun(scene.root, filled, RUN_END);
        if (allRing(filled)) {
          phase = 'won';
          paintFinish(scene.root, true);
          sound.melody(READING);
          lockAll();
        } else {
          phase = 'done';
          sound.wrong();
        }
      }, RUN_END * 1000 + 60);
    };
    asButton(push, 'Quân domino đầu tiên: chạm để đẩy', start);
    refresh();
    paintFinish(scene.root, false);

    return {
      revealHints: () => 0,
      hintSteps: (): HintStep[] => {
        // The four gaps that must be filled (see SOLUTION_GAPS).
        const need = [...SOLUTION_GAPS];
        const solution = new Set(need);
        const putAll = () => {
          placed.clear();
          need.forEach((id, i) => placed.set(id, i));
          refresh();
        };
        return [
          {
            note: 'Chỉ có bốn quân, mà chín chỗ trống: chọn đường tốn ít quân nhất (đường vòng phía trên chỉ thiếu một quân), không đặt vào nhánh cụt hay chỗ mà chuông vẫn tới được bằng đường khác.',
            targets: need.map((id, i) => ({
              x: spareHome(i).x, y: spareHome(i).y, r: 46, verb: 'drag' as const,
              to: { x: PIECES[id].x, y: PIECES[id].y }, object: `[data-hint="spare-${i}"]`,
            })),
            apply: putAll,
          },
          {
            note: 'Chạm quân đầu để đẩy: các quân đổ lần lượt, nhánh ngắn tới chuông trước. Cả bốn chuông cùng kêu thì chòm sao hiện sau chuông.',
            targets: [
              { x: pusherXY().x, y: pusherXY().y, r: 46, verb: 'tap' as const },
              { x: bellXY(0).x, y: bellXY(0).y, r: 0, verb: 'look' as const, act: (picture: SVGSVGElement) => (p: number) => paintRun(picture, solution, p * RUN_END) },
            ],
            apply: () => {
              putAll();
              phase = 'won';
              paintRun(scene.root, solution, RUN_END);
              paintFinish(scene.root, true);
              lockAll();
            },
          },
          {
            note: 'Đọc chòm sao sau các chuông theo thứ tự chuông kêu: số chấm vàng ở mỗi bảng là thứ tự đó.',
            targets: RING_ORDER.map((k) => ({ x: bellXY(k).x, y: bellXY(k).y + 78, r: 70, verb: 'look' as const })),
            prepare: (picture) => {
              const overlay = picture.querySelector('.layer-overlay') ?? picture;
              RING_ORDER.forEach((k, n) => {
                const at = bellXY(k);
                const stars = placeStars(BELLS[k].glyph, at.x, at.y + 72, 52);
                for (const [a, b] of glyph(BELLS[k].glyph).lines) el('line', { x1: stars[a][0], y1: stars[a][1], x2: stars[b][0], y2: stars[b][1], class: 'hint-line', 'pointer-events': 'none' }, overlay);
                const badge = el('g', { transform: `translate(${at.x - 56} ${at.y + 38})`, 'pointer-events': 'none' }, overlay);
                el('circle', { r: 16, class: 'number-badge' }, badge);
                el('text', { y: 1, class: 'number-text' }, badge).textContent = String(n + 1);
              });
            },
          },
        ];
      },
      destroy: () => {
        cancel();
        window.clearTimeout(timer);
      },
    };
  },
};

const pusherXY = (): { x: number; y: number } => ({ x: PIECES[0].x, y: PIECES[0].y });
