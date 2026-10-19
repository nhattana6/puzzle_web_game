import { glyph, placeStars, type GlyphId } from '../core/glyphs';
import { drawOwl } from '../core/owl';
import { SCENE_H, SCENE_W } from '../core/scene';
import { el, toolButton } from '../core/svg';
import { clamp, tween } from '../core/tween';
import {
  curve, DEPOT_FRONT, NET, NODE, pointAt, SWITCHES, TURN_DELAY, type TrainPath,
} from './flipSwitches';
import { starfield } from './sky';
import { drawCar } from './shuntingYard';
import type { HintStep, PuzzleDef } from './types';

/**
 * Chapter 5, level 12 — the terminus ("ga cuối"). The board of level 6 (six self-turning points, four depots)
 * with the coal of level 7 and the silhouettes of level 4, all at once. Six wagons wait to run, one after
 * another; four carry one kind of goods and the other two are empty grey ones, decoys ("toa nhiễu"): they run
 * too, burn their coal and turn the points, but they may end anywhere. Each wagon has a small bin of coal. Every stretch of rail has some sleepers
 * across it, and a train burns one lump of coal at each sleeper it crosses. A depot has a silhouette of the goods
 * it takes, and two of the four depots take the same goods. A train is right only if it ends in a depot that
 * takes its goods **and** its coal runs out exactly as it arrives (no coal left over; if it runs out earlier, it
 * stops on the track). You set only the six levers. When all four goods trains are right the doors open: read the
 * constellations in the order those trains ran.
 */

/** The sleepers on each way out of a point: [upper way, lower way]. */
export const COST: readonly (readonly [number, number])[] = [
  [2, 4], [2, 1], [3, 3], [4, 3], [1, 3], [3, 3],
];
/** Wagons waiting to run: four with goods and two decoys. */
export const WAGONS = 6;
/** The lumps of coal in each wagon's bin, in running order. */
export const TRAIN_COAL: readonly number[] = [10, 6, 8, 5, 10, 8];
/** Marks a decoy wagon in TRAIN_CARGO: an empty grey wagon with no goods. */
export const DECOY = -1;
/** Car type (see shuntingYard) carried by each wagon: tank, decoy, logs, decoy, mail, tank. */
export const TRAIN_CARGO: readonly number[] = [2, DECOY, 5, DECOY, 1, 2];
/** Car types the four depots take, top to bottom: the first and third take tanks. */
export const DEPOT_WANTS: readonly number[] = [2, 5, 2, 1];
/** The constellation behind each depot's door, top to bottom. */
export const DEPOT_GLYPHS: readonly GlyphId[] = ['crown', 'belt', 'triangle', 'square'];
export const START_SETTING: readonly number[] = [0, 0, 0, 0, 0, 0];
export const SOLUTION: readonly number[] = [1, 0, 1, 1, 0, 0];
/** The wagons that carry goods (the ones that must end right), in running order. */
export const GOODS_WAGONS: readonly number[] = TRAIN_CARGO.flatMap((c, i) => (c === DECOY ? [] : [i]));
export const isDecoy = (wagon: number): boolean => TRAIN_CARGO[wagon] === DECOY;

export interface TrainRun {
  /** The points the train leaves, in order, and the way it takes at each (0 upper, 1 lower). */
  switches: number[];
  outs: number[];
  /** The depot it reaches, or −1 when its coal runs out on the way. */
  depot: number;
  burned: number;
  /** Lumps still in the bin on arrival (0 when it stopped on the track). */
  left: number;
  stalled: boolean;
  /** Right depot, and the coal ran out exactly there (always true for a decoy, which may end anywhere). */
  ok: boolean;
}

/**
 * Runs the wagons one after another, as the board does: a train leaves a point by the way its lever shows and
 * burns a lump at each sleeper; a point turns to its other way after a train has left it; a train with no coal
 * left stops where it is (a point it never left does not turn).
 */
export function runStation(setting: readonly number[]): { runs: TrainRun[]; final: number[] } {
  const state = [...setting];
  const runs: TrainRun[] = [];
  for (let t = 0; t < WAGONS; t += 1) {
    const coal = TRAIN_COAL[t];
    const run: TrainRun = { switches: [], outs: [], depot: -1, burned: 0, left: 0, stalled: false, ok: false };
    let at = 'S0';
    while (at[0] === 'S') {
      const k = Number(at.slice(1));
      if (run.burned >= coal) { run.stalled = true; break; }
      const o = state[k];
      const c = COST[k][o];
      run.switches.push(k);
      run.outs.push(o);
      state[k] ^= 1;
      if (run.burned + c > coal) { run.burned = coal; run.stalled = true; break; }
      run.burned += c;
      at = NET[k][o];
    }
    if (!run.stalled) {
      run.depot = Number(at.slice(1));
      run.left = coal - run.burned;
      run.ok = DEPOT_WANTS[run.depot] === TRAIN_CARGO[t] && run.left === 0;
    }
    if (isDecoy(t)) run.ok = true;
    runs.push(run);
  }
  return { runs, final: state };
}

export const isSolved = (setting: readonly number[]): boolean => runStation(setting).runs.every((r) => r.ok);
export const settingOf = (bits: number): number[] => Array.from({ length: SWITCHES }, (_, k) => (bits >> k) & 1);
export const ALL_SETTINGS: readonly number[][] = Array.from({ length: 1 << SWITCHES }, (_, b) => settingOf(b));

/**
 * The wagons as they would run if the goods trains had all the coal they could want (a design check: the board without
 * the coal rule). Decoys keep their own coal. For each wagon: the depot it reaches (−1 if it stalls) and the sleepers on its way.
 */
export function routesWithoutCoalLimit(setting: readonly number[]): { depot: number; sleepers: number }[] {
  const state = [...setting];
  return Array.from({ length: WAGONS }, (_, t) => {
    const limit = isDecoy(t) ? TRAIN_COAL[t] : Infinity;
    let at = 'S0';
    let sleepers = 0;
    while (at[0] === 'S') {
      const k = Number(at.slice(1));
      if (sleepers >= limit) return { depot: -1, sleepers: limit };
      const o = state[k];
      state[k] ^= 1;
      if (sleepers + COST[k][o] > limit) return { depot: -1, sleepers: limit };
      sleepers += COST[k][o];
      at = NET[k][o];
    }
    return { depot: Number(at.slice(1)), sleepers };
  });
}

/** The depot each goods train ends in when the levers are set right, in running order. */
export const TARGET: readonly number[] = GOODS_WAGONS.map((w) => runStation(SOLUTION).runs[w].depot);
/** The constellations in the order the goods trains ran. */
export const READING: readonly GlyphId[] = TARGET.map((d) => DEPOT_GLYPHS[d]);

// ---------------------------------------------------------------- geometry

export const RUN_SECONDS = 1.35;
export const GAP_SECONDS = 0.15;
export const TOTAL_SECONDS = WAGONS * (RUN_SECONDS + GAP_SECONDS);
/** Where a wagon waits, in front of the first point: the first wagon nearest. */
export const queueSlot = (wagon: number): { x: number; y: number } => ({ x: 482 - wagon * 84, y: 450 });
export const SLEEPER_GAP = 30;
const CAR_SCALE = 0.46;

type Pt = { x: number; y: number };
const target = (name: string): Pt => (name[0] === 'S' ? NODE[Number(name.slice(1))] : DEPOT_FRONT[Number(name.slice(1))]);

export interface StationPath extends TrainPath {
  /** For each stretch driven: the distances (along the whole path) of its sleepers. */
  sleepers: number[][];
  /** The distance at which the train stops: the end, or just past its last sleeper if its coal runs out. */
  stop: number;
}

/** The way one train drives: from its place in the queue, through the points it leaves, to the front of its depot (or to where it stops). */
export function stationPath(train: number, run: TrainRun): StationPath {
  const pts: Pt[] = [queueSlot(train), NODE[0]];
  const spans: { from: number; to: number; cost: number }[] = [];
  run.switches.forEach((k, j) => {
    const from = pts.length - 1;
    pts.push(...curve(NODE[k], target(NET[k][run.outs[j]])).pts.slice(1));
    spans.push({ from, to: pts.length - 1, cost: COST[k][run.outs[j]] });
  });
  const cum = [0];
  for (let i = 1; i < pts.length; i += 1) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const length = cum[cum.length - 1];
  const sleepers = spans.map((s) => {
    const mid = (cum[s.from] + cum[s.to]) / 2;
    return Array.from({ length: s.cost }, (_, i) => mid + (i - (s.cost - 1) / 2) * SLEEPER_GAP);
  });
  let stop = length;
  if (run.stalled && sleepers.length) {
    const before = sleepers.slice(0, -1).reduce((n, s) => n + s.length, 0);
    const room = TRAIN_COAL[train] - before;
    // Stalled on the last stretch: it stops just past the sleeper where its last lump burned (or at the point, if it had none left).
    if (room >= 1 && room <= sleepers[sleepers.length - 1].length) stop = Math.min(length, sleepers[sleepers.length - 1][room - 1] + 14);
  }
  return { pts, cum, length, at: spans.map((s) => cum[s.from] / length), sleepers, stop };
}

/** The levers as they stand `t` seconds into a run that began with `setting` (−1 for before). */
export function leversAt(setting: readonly number[], t: number): number[] {
  const state = [...setting];
  const { runs } = runStation(setting);
  runs.forEach((run, i) => {
    const path = stationPath(i, run);
    run.switches.forEach((k, j) => {
      if (t >= i * (RUN_SECONDS + GAP_SECONDS) + path.at[j] * RUN_SECONDS + TURN_DELAY) state[k] ^= 1;
    });
  });
  return state;
}

/** How far along its way (0..1) a train is `t` seconds into a run, and how many lumps it has burned by then. */
export function trainAt(path: StationPath, train: number, t: number): { p: number; burned: number } {
  const start = train * (RUN_SECONDS + GAP_SECONDS);
  const p = t < 0 ? 0 : Math.min(clamp((t - start) / RUN_SECONDS, 0, 1), path.stop / path.length);
  const d = p * path.length;
  return { p, burned: path.sleepers.flat().filter((s) => s <= d).length };
}

const TRAIL_COLOURS = ['#e0533c', '#6bb7ff', '#ffd45a', '#7ddc8a'];
/** The trail colour of each wagon: its own for goods trains (in running order), grey for a decoy. */
const trailColour = (wagon: number): string => (isDecoy(wagon) ? '#8a93b4' : TRAIL_COLOURS[GOODS_WAGONS.indexOf(wagon)]);

/** An empty grey wagon, a decoy: a bare flat car with an open frame, centred on the origin. */
function drawEmptyCar(parent: Element): SVGGElement {
  const g = el('g', {}, parent);
  el('rect', { x: -86, y: 26, width: 172, height: 8, rx: 3, fill: '#2a2632' }, g);
  for (const x of [-52, 52]) el('circle', { cx: x, cy: 38, r: 14, fill: '#1a1722' }, g);
  el('rect', { x: -92, y: -4, width: 184, height: 30, rx: 6, fill: '#6b6f80' }, g);
  el('rect', { x: -92, y: -40, width: 184, height: 36, rx: 8, fill: 'none', stroke: '#8a8fa0', 'stroke-width': 6, 'stroke-dasharray': '16 10' }, g);
  return g;
}

/**
 * Paints the board `t` seconds into a run with this setting (t < 0: before it). With `trails`, the trails of the whole run
 * show (as after one); otherwise only the part driven so far. In the scene or in a copy.
 */
export function paintRun(root: ParentNode, setting: readonly number[], t: number, trails: boolean): void {
  const { runs } = runStation(setting);
  const state = leversAt(setting, t);
  state.forEach((s, k) => {
    root.querySelector(`[data-switch="${k}"] [data-role="arm"]`)?.setAttribute('transform', `rotate(${s ? 38 : -38})`);
    for (const o of [0, 1]) {
      const branch = root.querySelector<SVGElement>(`[data-branch="${k}-${o}"]`);
      if (branch) branch.style.display = s === o ? '' : 'none';
    }
  });
  runs.forEach((run, i) => {
    const path = stationPath(i, run);
    const { p, burned } = trainAt(path, i, t);
    const at = pointAt(path, p);
    root.querySelector(`[data-train="${i}"]`)?.setAttribute('transform', `translate(${at.x.toFixed(1)} ${at.y.toFixed(1)}) scale(${CAR_SCALE})`);
    root.querySelectorAll<SVGElement>(`[data-lump^="${i}-"]`).forEach((n) => {
      const idx = Number((n.getAttribute('data-lump') ?? '0-0').split('-')[1]);
      n.style.display = idx < burned ? 'none' : '';
    });
    const drawn = t < 0 ? (trails ? path.stop / path.length : 0) : p;
    const trail = root.querySelector(`[data-trail="${i}"]`);
    if (trail) {
      const end = clamp(drawn, 0, 1) * path.length;
      const pts = path.pts.filter((_, n) => path.cum[n] <= end);
      if (drawn > 0) pts.push(pointAt(path, drawn));
      trail.setAttribute('d', pts.length > 1 ? pts.map((q, n) => `${n ? 'L' : 'M'}${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join(' ') : '');
    }
    // The verdict chip at the end of the trail: a tick when the train is right, a cross when it is not.
    const chip = root.querySelector<SVGElement>(`[data-chip="${i}"]`);
    if (chip) {
      const end = pointAt(path, path.stop / path.length);
      chip.setAttribute('transform', `translate(${(end.x + 10).toFixed(1)} ${(end.y - 44 + i * 4).toFixed(1)})`);
      const done = t < 0 ? trails : p >= path.stop / path.length - 1e-6;
      chip.style.display = done ? '' : 'none';
      chip.querySelectorAll<SVGElement>('[data-role]').forEach((n) => { n.style.display = n.getAttribute('data-role') === (run.ok ? 'tick' : 'cross') ? '' : 'none'; });
    }
  });
}

/** Opens the depot doors and shows the constellations behind them (or shuts them), in the scene or in a copy. */
export function paintFinish(root: ParentNode, solved: boolean): void {
  root.querySelectorAll<SVGElement>('[data-role="door"]').forEach((n) => { n.style.display = solved ? 'none' : ''; });
  root.querySelectorAll<SVGElement>('[data-role="chom"]').forEach((n) => { n.style.display = solved ? '' : 'none'; });
}

export const terminalStation: PuzzleDef = {
  id: 'terminal-station',
  name: 'Ga cuối',
  answer: [...READING],
  help: [
    'Sáu toa chạy lần lượt qua các ghi. Mỗi toa có một thùng than: mỗi vạch tà vẹt trên đường ray đốt một cục than. Toa hết than giữa đường thì dừng ngay trên ray.',
    'Bốn toa chở hàng chỉ đúng khi tới kho có hình bóng đúng loại hàng của nó và hết than vừa lúc tới nơi, không dư cục nào. Có hai kho cùng nhận một loại hàng: toa vào kho nào thì xem số vạch tà vẹt. Hai toa xám trống là toa nhiễu: chúng cũng chạy, đốt than và làm ghi lật, nhưng tới đâu cũng được.',
    'Chỉ có sáu cần ghi để đặt (chạm để đổi hướng); mỗi ghi tự lật sang hướng kia sau khi một toa rời nó. Cả bốn toa chở hàng đúng thì cửa kho mở: đọc chòm theo thứ tự các toa chở hàng chạy.',
  ],
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    const setting = [...START_SETTING];
    let busy = false;
    let solved = false;
    let cancel = () => {};
    let timer = 0;

    // Back: the dispatcher's board at the end of the line.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#161a2c' }, back);
    starfield(back, { x: 0, y: 0, w: SCENE_W, h: SCENE_H }, 36, 1212, '#9fb0d8');
    scene.grain('back', 0.35);

    // Mid: the tracks (dim) with the way each point shows lit, the sleepers on every stretch, then the depots.
    const rails = el('g', { 'pointer-events': 'none' }, mid);
    const rail = (d: string) => {
      el('path', { d, fill: 'none', stroke: '#262c44', 'stroke-width': 18, 'stroke-linecap': 'round' }, rails);
      el('path', { d, fill: 'none', stroke: '#6a7499', 'stroke-width': 5, 'stroke-linecap': 'round' }, rails);
    };
    rail(`M40 450 H${NODE[0].x}`);
    NET.forEach((outs, k) => outs.forEach((to, o) => {
      const { d, pts } = curve(NODE[k], target(to));
      rail(d);
      el('path', { d, fill: 'none', stroke: '#ffd45a', 'stroke-width': 7, 'stroke-linecap': 'round', opacity: 0.85, 'data-branch': `${k}-${o}` }, rails);
      // The sleepers, across the rail, around the middle of the stretch.
      const cum = [0];
      for (let i = 1; i < pts.length; i += 1) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
      const mid0 = cum[cum.length - 1] / 2;
      for (let n = 0; n < COST[k][o]; n += 1) {
        const d0 = mid0 + (n - (COST[k][o] - 1) / 2) * SLEEPER_GAP;
        let i = 1;
        while (i < cum.length - 1 && cum[i] < d0) i += 1;
        const f = (d0 - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1);
        const x = pts[i - 1].x + (pts[i].x - pts[i - 1].x) * f;
        const y = pts[i - 1].y + (pts[i].y - pts[i - 1].y) * f;
        const a = Math.atan2(pts[i].y - pts[i - 1].y, pts[i].x - pts[i - 1].x) + Math.PI / 2;
        el('line', { x1: (x - Math.cos(a) * 17).toFixed(1), y1: (y - Math.sin(a) * 17).toFixed(1), x2: (x + Math.cos(a) * 17).toFixed(1), y2: (y + Math.sin(a) * 17).toFixed(1), stroke: '#c9a46a', 'stroke-width': 8, 'stroke-linecap': 'round' }, rails);
      }
    }));
    for (let i = 0; i < WAGONS; i += 1) el('path', { d: '', fill: 'none', stroke: trailColour(i), 'stroke-width': isDecoy(i) ? 6 : 9, 'stroke-dasharray': isDecoy(i) ? '4 12' : undefined, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: isDecoy(i) ? 0.6 : 0.75, 'data-trail': i }, rails);

    DEPOT_FRONT.forEach((front0, j) => {
      const g = el('g', { 'pointer-events': 'none' }, mid);
      const x = front0.x + 20;
      el('rect', { x, y: front0.y - 62, width: 270, height: 124, rx: 14, fill: '#1f2536', stroke: '#6f7a99', 'stroke-width': 5 }, g);
      el('rect', { x: x + 14, y: front0.y - 50, width: 150, height: 100, rx: 8, fill: '#0b0e18' }, g);
      const chom = el('g', { 'data-role': 'chom', style: 'display:none' }, g);
      for (const [sx, sy] of placeStars(DEPOT_GLYPHS[j], x + 89, front0.y, 84)) {
        el('circle', { cx: sx.toFixed(1), cy: sy.toFixed(1), r: 14, fill: '#fff3c8', opacity: 0.28 }, chom);
        el('circle', { cx: sx.toFixed(1), cy: sy.toFixed(1), r: 6, fill: '#fff8dc' }, chom);
      }
      const door = el('g', { 'data-role': 'door' }, g);
      el('rect', { x: x + 14, y: front0.y - 50, width: 150, height: 100, rx: 8, fill: '#3b4560' }, door);
      for (let s = 0; s < 6; s += 1) el('line', { x1: x + 18, y1: front0.y - 40 + s * 17, x2: x + 160, y2: front0.y - 40 + s * 17, stroke: '#262e44', 'stroke-width': 4 }, door);
      el('rect', { x: x + 176, y: front0.y - 44, width: 84, height: 88, rx: 10, fill: '#d9cfae', stroke: '#8a7a50', 'stroke-width': 4 }, g);
      const sil = el('g', { transform: `translate(${x + 218} ${front0.y}) scale(0.36)` }, g);
      drawCar(sil, DEPOT_WANTS[j], true);
      el('rect', { x: front0.x - 4, y: front0.y - 6, width: 24, height: 12, fill: '#6a7499' }, g);
    });

    // The wagons, each with its bin of coal above it (a decoy has no goods).
    for (let i = 0; i < WAGONS; i += 1) {
      const t = el('g', { 'data-train': i, 'pointer-events': 'none' }, mid);
      if (isDecoy(i)) drawEmptyCar(t); else drawCar(t, TRAIN_CARGO[i], false);
      const rows = Math.ceil(TRAIN_COAL[i] / 4);
      const bin = el('g', { transform: `translate(0 ${-92 - (rows - 1) * 17})` }, t);
      el('rect', { x: -86, y: -22 - (rows - 1) * 17, width: 172, height: 26 + rows * 34, rx: 12, fill: '#2a2f44', stroke: '#8a93b4', 'stroke-width': 5 }, bin);
      for (let n = 0; n < TRAIN_COAL[i]; n += 1) {
        const lump = el('g', { 'data-lump': `${i}-${n}`, transform: `translate(${((n % 4) - 1.5) * 38} ${(rows - 1 - Math.floor(n / 4)) * 34 - (rows - 1) * 17 + 0})` }, bin);
        el('path', { d: 'M-15 6 L-10 -10 L4 -14 L15 -4 L12 10 L-6 12 Z', fill: '#1b1b24', stroke: '#6a6a80', 'stroke-width': 3, 'stroke-linejoin': 'round' }, lump);
        el('path', { d: 'M-6 -6 L2 -8', stroke: '#9a9ab0', 'stroke-width': 3, 'stroke-linecap': 'round' }, lump);
      }
    }
    // A chip at the end of each goods train's trail: tick or cross.
    for (const i of GOODS_WAGONS) {
      const chip = el('g', { 'data-chip': i, style: 'display:none', 'pointer-events': 'none' }, mid);
      el('circle', { r: 20, fill: '#161a2c', stroke: trailColour(i), 'stroke-width': 6 }, chip);
      el('path', { 'data-role': 'tick', d: 'M-9 1 L-3 8 L10 -8', fill: 'none', stroke: '#8fe39a', 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, chip);
      el('path', { 'data-role': 'cross', d: 'M-8 -8 L8 8 M8 -8 L-8 8', fill: 'none', stroke: '#ff8a7a', 'stroke-width': 5, 'stroke-linecap': 'round' }, chip);
    }

    // Front: the levers, the run button and the owl.
    const levers: SVGGElement[] = [];
    NODE.forEach((n, k) => {
      const g = el('g', { class: 'interactive', 'data-switch': k, transform: `translate(${n.x} ${n.y})` }, front);
      el('circle', { r: 58, fill: 'transparent' }, g);
      el('circle', { r: 36, fill: '#1c2236', stroke: '#c9a24a', 'stroke-width': 6, 'pointer-events': 'none' }, g);
      const arm = el('g', { 'data-role': 'arm', 'pointer-events': 'none' }, g);
      el('line', { x1: 0, y1: 0, x2: 44, y2: 0, stroke: '#ffd45a', 'stroke-width': 9, 'stroke-linecap': 'round' }, arm);
      el('circle', { cx: 44, cy: 0, r: 9, fill: '#ffd45a' }, arm);
      el('circle', { r: 11, fill: '#161a2c', 'pointer-events': 'none' }, g);
      levers.push(g);
    });
    drawOwl(front, 110, 140, 0.8);
    const run = toolButton(front, 250, 790, 'Cho các tàu chạy', (g) => {
      el('path', { d: 'M-10 -16 L16 0 L-10 16 Z', fill: '#f6efd8' }, g);
    }, () => start());

    const repaint = (t: number, trails: boolean, state: readonly number[] = setting) => paintRun(scene.root, state, t, trails);
    const label = (k: number) => `Ghi ${k + 1}: đang chỉ đường ${setting[k] ? 'dưới' : 'trên'}`;
    const lock = () => {
      for (const g of [...levers, run]) {
        g.style.pointerEvents = 'none';
        g.classList.remove('interactive');
        g.removeAttribute('tabindex');
        g.setAttribute('aria-disabled', 'true');
      }
    };
    const refreshLabels = () => levers.forEach((g, k) => g.setAttribute('aria-label', label(k)));

    function start(): void {
      if (busy || solved) return;
      busy = true;
      sound.knock();
      cancel = tween(TOTAL_SECONDS * 1000, (k) => repaint(k * TOTAL_SECONDS, true), (k) => k);
      timer = window.setTimeout(() => {
        repaint(TOTAL_SECONDS, true);
        if (isSolved(setting)) {
          solved = true;
          paintFinish(scene.root, true);
          sound.melody(READING);
          lock();
          return;
        }
        // Wrong: the trains go back with their coal and the levers return to their setting; the trails and chips stay.
        sound.wrong();
        timer = window.setTimeout(() => {
          repaint(-1, true);
          busy = false;
        }, 1100);
      }, TOTAL_SECONDS * 1000 + 60);
    }
    levers.forEach((g, k) => {
      const turn = () => {
        if (busy || solved) return;
        setting[k] ^= 1;
        sound.tick();
        repaint(-1, false);
        refreshLabels();
      };
      g.addEventListener('click', turn);
      g.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          turn();
        }
      });
      g.setAttribute('tabindex', '0');
      g.setAttribute('role', 'button');
    });
    refreshLabels();
    repaint(-1, false);
    paintFinish(scene.root, false);

    return {
      revealHints: () => 0,
      hintSteps: (): HintStep[] => {
        // The setting now, kept apart: later steps change `setting` before this step's picture has finished playing.
        const from = [...setting];
        const changing = SOLUTION.map((s, k) => (s !== from[k] ? k : -1)).filter((k) => k >= 0);
        const finish = () => {
          SOLUTION.forEach((s, k) => { setting[k] = s; });
          solved = true;
          repaint(TOTAL_SECONDS, true);
          paintFinish(scene.root, true);
          lock();
        };
        return [
          {
            note: 'Đếm vạch tà vẹt: mỗi vạch đốt một cục than, và toa chở hàng phải tới kho đúng hình bóng với đúng chừng ấy than. Hai kho cùng nhận một loại hàng, chỉ số than mới cho biết toa đi đường nào. Hai toa xám trống (toa nhiễu) cũng chạy và làm ghi lật, nên phải tính cả chúng. Chạm các ghi để đặt như hình.',
            targets: changing.map((k, n) => ({
              x: NODE[k].x, y: NODE[k].y, r: 52, verb: 'tap' as const,
              act: n === 0 ? (picture: SVGSVGElement) => (p: number) => paintRun(picture, from.map((s, j) => (changing.includes(j) && p > 0.2 + 0.2 * changing.indexOf(j) ? SOLUTION[j] : s)), -1, false) : undefined,
            })),
            apply: () => {
              SOLUTION.forEach((s, k) => { setting[k] = s; });
              repaint(-1, false);
              refreshLabels();
            },
          },
          {
            note: 'Bấm nút chạy: các toa lần lượt chạy, đốt than ở mỗi vạch, mỗi ghi lật sau khi một toa rời nó. Cả bốn toa chở hàng tới đúng kho và vừa hết than thì cửa kho mở.',
            targets: [
              { x: 250, y: 790, r: 55, verb: 'tap' },
              { x: NODE[0].x, y: NODE[0].y, r: 0, verb: 'look', act: (picture) => (p) => paintRun(picture, SOLUTION, p * TOTAL_SECONDS, true) },
            ],
            apply: finish,
          },
          {
            note: 'Đọc bốn chòm sao sau cửa kho theo thứ tự các toa chở hàng chạy: toa 1, 2, 3, 4 (không tính toa nhiễu).',
            targets: TARGET.map((d) => ({ x: DEPOT_FRONT[d].x + 109, y: DEPOT_FRONT[d].y, r: 90, verb: 'look' as const })),
            prepare: (picture) => {
              const overlay = picture.querySelector('.layer-overlay') ?? picture;
              TARGET.forEach((d, i) => {
                const id = DEPOT_GLYPHS[d];
                const stars = placeStars(id, DEPOT_FRONT[d].x + 109, DEPOT_FRONT[d].y, 84);
                for (const [a, b] of glyph(id).lines) el('line', { x1: stars[a][0], y1: stars[a][1], x2: stars[b][0], y2: stars[b][1], class: 'hint-line', 'pointer-events': 'none' }, overlay);
                const badge = el('g', { transform: `translate(${DEPOT_FRONT[d].x - 30} ${DEPOT_FRONT[d].y - 50})`, 'pointer-events': 'none' }, overlay);
                el('circle', { r: 17, class: 'number-badge' }, badge);
                el('text', { y: 1, class: 'number-text' }, badge).textContent = String(i + 1);
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
