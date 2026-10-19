import { glyph, placeStars, type GlyphId } from '../core/glyphs';
import { drawOwl } from '../core/owl';
import { SCENE_H, SCENE_W } from '../core/scene';
import { el, toolButton } from '../core/svg';
import { clamp, tween } from '../core/tween';
import { starfield } from './sky';
import { drawCar } from './shuntingYard';
import type { HintStep, PuzzleDef } from './types';

/**
 * Chapter 5, level 6 — the self-turning points ("ghi tự lật"). Four goods trains wait to run, one
 * after another, through a network of six points to four depots. Each train carries one kind of
 * goods and each depot has a silhouette of the kind it wants. A point sends a train the way its
 * lever shows and then turns to the other way by itself. Set the six levers, press run: the trains go
 * in turn and leave their trail on the board. When all four end in the right depots the doors open and
 * the constellations show on them. Read them in the order the trains ran.
 */

export const SWITCHES = 6;
/** Where each point's two ways lead: [upper way, lower way]. 'S' is another point, 'D' a depot. */
export const NET: readonly (readonly [string, string])[] = [
  ['S1', 'S2'],
  ['S3', 'S4'],
  ['S4', 'S5'],
  ['D0', 'D1'],
  ['D1', 'D2'],
  ['D2', 'D3'],
];
export const TRAINS = 4;
/** Car types (see shuntingYard) carried by each train, in running order: coal, tank, mail, logs. */
export const TRAIN_CARGO: readonly number[] = [4, 2, 1, 5];
/** Car types the four depots want, top to bottom. */
export const DEPOT_WANTS: readonly number[] = [1, 5, 4, 2];
/** The constellation behind each depot's door, top to bottom. */
export const DEPOT_GLYPHS: readonly GlyphId[] = ['square', 'dipper', 'hook', 'cross'];
export const START_SETTING: readonly number[] = [0, 0, 0, 0, 0, 0];
/** The depot each train must reach: the one that wants its goods. */
export const TARGET: readonly number[] = TRAIN_CARGO.map((c) => DEPOT_WANTS.indexOf(c));

export interface Route {
  /** The points the train passes, in order, and the way it takes at each (0 upper, 1 lower). */
  switches: number[];
  outs: number[];
  depot: number;
}

/** Sends the four trains through one after another; every point turns to its other way after a train has gone through it. */
export function runTrains(setting: readonly number[], turns = true): { routes: Route[]; final: number[] } {
  const state = [...setting];
  const routes: Route[] = [];
  for (let t = 0; t < TRAINS; t += 1) {
    const route: Route = { switches: [], outs: [], depot: -1 };
    let at = 'S0';
    while (at[0] === 'S') {
      const k = Number(at.slice(1));
      route.switches.push(k);
      route.outs.push(state[k]);
      if (turns) state[k] ^= 1;
      at = NET[k][route.outs[route.outs.length - 1]];
    }
    route.depot = Number(at.slice(1));
    routes.push(route);
  }
  return { routes, final: state };
}

/** Which trains end in the depot that wants their goods. */
export const delivered = (setting: readonly number[], turns = true): boolean[] =>
  runTrains(setting, turns).routes.map((r, i) => DEPOT_WANTS[r.depot] === TRAIN_CARGO[i]);
export const isSolved = (setting: readonly number[]): boolean => delivered(setting).every(Boolean);

export const settingOf = (bits: number): number[] => Array.from({ length: SWITCHES }, (_, k) => (bits >> k) & 1);
export const ALL_SETTINGS: readonly number[][] = Array.from({ length: 1 << SWITCHES }, (_, b) => settingOf(b));
export const SOLUTION: readonly number[] = [0, 1, 1, 0, 1, 1];

/** The constellations in the order the trains ran (each train's own depot). */
export const READING: readonly GlyphId[] = TARGET.map((d) => DEPOT_GLYPHS[d]);

// ---------------------------------------------------------------- geometry

export const NODE: readonly { x: number; y: number }[] = [
  { x: 560, y: 450 }, { x: 780, y: 300 }, { x: 780, y: 600 },
  { x: 1000, y: 240 }, { x: 1000, y: 450 }, { x: 1000, y: 660 },
];
/** Where a train stops in front of each depot. */
export const DEPOT_FRONT: readonly { x: number; y: number }[] = [
  { x: 1230, y: 150 }, { x: 1230, y: 340 }, { x: 1230, y: 560 }, { x: 1230, y: 750 },
];
export const queueSlot = (train: number): { x: number; y: number } => ({ x: 430 - train * 120, y: 450 });
/** Seconds one train takes, and the pause before the next one. */
export const RUN_SECONDS = 1.4;
export const GAP_SECONDS = 0.2;
export const TOTAL_SECONDS = TRAINS * (RUN_SECONDS + GAP_SECONDS);
/** A point turns just after the train has gone through it. */
export const TURN_DELAY = 0.1;
const CAR_SCALE = 0.46;

type Pt = { x: number; y: number };
const target = (name: string): Pt => (name[0] === 'S' ? NODE[Number(name.slice(1))] : DEPOT_FRONT[Number(name.slice(1))]);
/** A gentle S-curve between two points, as a path string and as sample points. */
export const curve = (a: Pt, b: Pt): { d: string; pts: Pt[] } => {
  const mx = a.x + (b.x - a.x) * 0.5;
  const pts: Pt[] = [];
  for (let i = 0; i <= 24; i += 1) {
    const t = i / 24;
    const u = 1 - t;
    pts.push({
      x: u * u * u * a.x + 3 * u * u * t * mx + 3 * u * t * t * mx + t * t * t * b.x,
      y: u * u * u * a.y + 3 * u * u * t * a.y + 3 * u * t * t * b.y + t * t * t * b.y,
    });
  }
  return { d: `M${a.x} ${a.y} C${mx} ${a.y} ${mx} ${b.y} ${b.x} ${b.y}`, pts };
};

export interface TrainPath {
  pts: Pt[];
  /** Distance travelled when the point sample i is reached. */
  cum: number[];
  length: number;
  /** For each point the train passes: how far along its trip (0..1) the point is. */
  at: number[];
}

/** The way one train drives: from its place in the queue, through its points, to the front of its depot. */
export function trainPath(train: number, route: Route): TrainPath {
  const pts: Pt[] = [queueSlot(train), NODE[0]];
  const marks: number[] = [pts.length - 1];
  route.switches.forEach((k, j) => {
    const next = target(NET[k][route.outs[j]]);
    pts.push(...curve(NODE[k], next).pts.slice(1));
    if (j < route.switches.length - 1) marks.push(pts.length - 1);
  });
  const cum = [0];
  for (let i = 1; i < pts.length; i += 1) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const length = cum[cum.length - 1];
  return { pts, cum, length, at: marks.map((m) => cum[m] / length) };
}

/** The point of a path at progress 0..1. */
export function pointAt(path: TrainPath, p: number): Pt {
  const d = clamp(p, 0, 1) * path.length;
  let i = 1;
  while (i < path.cum.length - 1 && path.cum[i] < d) i += 1;
  const k = (d - path.cum[i - 1]) / ((path.cum[i] - path.cum[i - 1]) || 1);
  return { x: path.pts[i - 1].x + (path.pts[i].x - path.pts[i - 1].x) * k, y: path.pts[i - 1].y + (path.pts[i].y - path.pts[i - 1].y) * k };
}

/** The levers as they stand `t` seconds into a run that began with `setting` (−1 for before). */
export function leversAt(setting: readonly number[], t: number): number[] {
  const state = [...setting];
  const { routes } = runTrains(setting);
  routes.forEach((route, i) => {
    const path = trainPath(i, route);
    route.switches.forEach((k, j) => {
      if (t >= i * (RUN_SECONDS + GAP_SECONDS) + path.at[j] * RUN_SECONDS + TURN_DELAY) state[k] ^= 1;
    });
  });
  return state;
}

const TRAIL_COLOURS = ['#e0533c', '#6bb7ff', '#ffd45a', '#7ddc8a'];

/**
 * Paints the board `t` seconds into a run with this setting (t < 0: before it). With `trails`, the trails
 * of the whole run show (as they do after one); otherwise only the part driven so far. In the scene or in a copy.
 */
export function paintRun(root: ParentNode, setting: readonly number[], t: number, trails: boolean): void {
  const { routes } = runTrains(setting);
  const state = leversAt(setting, t);
  state.forEach((s, k) => {
    root.querySelector(`[data-switch="${k}"] [data-role="arm"]`)?.setAttribute('transform', `rotate(${s ? 38 : -38})`);
    for (const o of [0, 1]) {
      const branch = root.querySelector<SVGElement>(`[data-branch="${k}-${o}"]`);
      if (branch) branch.style.display = s === o ? '' : 'none';
    }
  });
  routes.forEach((route, i) => {
    const path = trainPath(i, route);
    const start = i * (RUN_SECONDS + GAP_SECONDS);
    const p = t < 0 ? 0 : clamp((t - start) / RUN_SECONDS, 0, 1);
    const at = pointAt(path, p);
    root.querySelector(`[data-train="${i}"]`)?.setAttribute('transform', `translate(${at.x.toFixed(1)} ${at.y.toFixed(1)}) scale(${CAR_SCALE})`);
    const drawn = t < 0 ? (trails ? 1 : 0) : p;
    const trail = root.querySelector(`[data-trail="${i}"]`);
    if (trail) {
      const end = clamp(drawn, 0, 1) * path.length;
      const pts = path.pts.filter((_, n) => path.cum[n] <= end);
      if (drawn > 0) pts.push(pointAt(path, drawn));
      trail.setAttribute('d', pts.length > 1 ? pts.map((q, n) => `${n ? 'L' : 'M'}${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join(' ') : '');
    }
    const end = DEPOT_FRONT[route.depot];
    const icon = root.querySelector<SVGElement>(`[data-trail-icon="${i}"]`);
    if (icon) {
      icon.setAttribute('transform', `translate(${end.x - 40 + i * 0} ${end.y - 34 + i * 17}) scale(0.2)`);
      icon.style.display = t < 0 ? (trails ? '' : 'none') : p >= 1 ? '' : 'none';
    }
  });
}

/** Opens the depot doors and shows the constellations behind them (or shuts them), in the scene or in a copy. */
export function paintFinish(root: ParentNode, solved: boolean): void {
  root.querySelectorAll<SVGElement>('[data-role="door"]').forEach((n) => { n.style.display = solved ? 'none' : ''; });
  root.querySelectorAll<SVGElement>('[data-role="chom"]').forEach((n) => { n.style.display = solved ? '' : 'none'; });
}

export const flipSwitches: PuzzleDef = {
  id: 'flip-switches',
  name: 'Ghi tự lật',
  answer: [...READING],
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    const setting = [...START_SETTING];
    let busy = false;
    let solved = false;
    let cancel = () => {};
    let timer = 0;

    // Back: the dispatcher's board.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#14211e' }, back);
    starfield(back, { x: 0, y: 0, w: SCENE_W, h: SCENE_H }, 36, 606, '#8fb8a6');
    scene.grain('back', 0.35);

    // Mid: the tracks (dim) with the way each point shows lit, then the depots.
    const rails = el('g', { 'pointer-events': 'none' }, mid);
    const rail = (d: string, parent: Element = rails) => {
      el('path', { d, fill: 'none', stroke: '#2a3a36', 'stroke-width': 18, 'stroke-linecap': 'round' }, parent);
      el('path', { d, fill: 'none', stroke: '#5f7a70', 'stroke-width': 5, 'stroke-linecap': 'round' }, parent);
    };
    rail(`M40 450 H${NODE[0].x}`);
    NET.forEach((outs, k) => outs.forEach((to, o) => {
      const { d } = curve(NODE[k], target(to));
      rail(d);
      el('path', { d, fill: 'none', stroke: '#ffd45a', 'stroke-width': 7, 'stroke-linecap': 'round', opacity: 0.85, 'data-branch': `${k}-${o}` }, rails);
    }));
    for (let i = 0; i < TRAINS; i += 1) el('path', { d: '', fill: 'none', stroke: TRAIL_COLOURS[i], 'stroke-width': 9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.75, 'data-trail': i }, rails);

    DEPOT_FRONT.forEach((front0, j) => {
      const g = el('g', { 'pointer-events': 'none' }, mid);
      const x = front0.x + 20;
      el('rect', { x, y: front0.y - 62, width: 270, height: 124, rx: 14, fill: '#1f2a33', stroke: '#6b7f8a', 'stroke-width': 5 }, g);
      el('rect', { x: x + 14, y: front0.y - 50, width: 150, height: 100, rx: 8, fill: '#0b1014' }, g);
      // What is behind the door: the constellation, once it is open.
      const chom = el('g', { 'data-role': 'chom', style: 'display:none' }, g);
      const stars = placeStars(DEPOT_GLYPHS[j], x + 89, front0.y, 84);
      for (const [sx, sy] of stars) {
        el('circle', { cx: sx.toFixed(1), cy: sy.toFixed(1), r: 14, fill: '#fff3c8', opacity: 0.28 }, chom);
        el('circle', { cx: sx.toFixed(1), cy: sy.toFixed(1), r: 6, fill: '#fff8dc' }, chom);
      }
      const door = el('g', { 'data-role': 'door' }, g);
      el('rect', { x: x + 14, y: front0.y - 50, width: 150, height: 100, rx: 8, fill: '#3b4a54' }, door);
      for (let s = 0; s < 6; s += 1) el('line', { x1: x + 18, y1: front0.y - 40 + s * 17, x2: x + 160, y2: front0.y - 40 + s * 17, stroke: '#26323a', 'stroke-width': 4 }, door);
      // The sign: a silhouette of the goods this depot wants.
      el('rect', { x: x + 176, y: front0.y - 44, width: 84, height: 88, rx: 10, fill: '#d9cfae', stroke: '#8a7a50', 'stroke-width': 4 }, g);
      const sil = el('g', { transform: `translate(${x + 218} ${front0.y}) scale(0.36)` }, g);
      drawCar(sil, DEPOT_WANTS[j], true);
      el('rect', { x: front0.x - 4, y: front0.y - 6, width: 24, height: 12, fill: '#5f7a70' }, g);
    });
    // Trail ends: a little picture of the goods of the train that got there.
    for (let i = 0; i < TRAINS; i += 1) {
      const icon = el('g', { 'data-trail-icon': i, style: 'display:none', 'pointer-events': 'none' }, mid);
      el('rect', { x: -110, y: -60, width: 220, height: 120, rx: 18, fill: '#14211e', stroke: TRAIL_COLOURS[i], 'stroke-width': 10, opacity: 0.9 }, icon);
      const car = el('g', { transform: 'scale(0.9)' }, icon);
      drawCar(car, TRAIN_CARGO[i], false);
    }
    // The trains.
    for (let i = 0; i < TRAINS; i += 1) {
      const t = el('g', { 'data-train': i, 'pointer-events': 'none' }, mid);
      drawCar(t, TRAIN_CARGO[i], false);
    }

    // Front: the levers, the run button and the owl.
    const levers: SVGGElement[] = [];
    NODE.forEach((n, k) => {
      const g = el('g', { class: 'interactive', 'data-switch': k, transform: `translate(${n.x} ${n.y})` }, front);
      el('circle', { r: 58, fill: 'transparent' }, g);
      el('circle', { r: 36, fill: '#1c2a27', stroke: '#c9a24a', 'stroke-width': 6, 'pointer-events': 'none' }, g);
      const arm = el('g', { 'data-role': 'arm', 'pointer-events': 'none' }, g);
      el('line', { x1: 0, y1: 0, x2: 44, y2: 0, stroke: '#ffd45a', 'stroke-width': 9, 'stroke-linecap': 'round' }, arm);
      el('circle', { cx: 44, cy: 0, r: 9, fill: '#ffd45a' }, arm);
      el('circle', { r: 11, fill: '#14211e', 'pointer-events': 'none' }, g);
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
          sound.ding();
          lock();
          return;
        }
        // Wrong: the trains go back and the levers return to their setting, the trails stay.
        sound.wrong();
        timer = window.setTimeout(() => {
          repaint(-1, true);
          busy = false;
        }, 900);
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
            note: 'Mỗi tàu chở một loại hàng và phải tới kho có hình bóng đúng loại. Tàu đi theo hướng cần ghi chỉ, rồi ghi lật sang hướng kia. Chạm ghi để đổi hướng: hãy đặt sao cho cả bốn tàu tới đúng kho.',
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
            note: 'Bấm nút chạy: các tàu lần lượt chạy, mỗi ghi lật sau khi một tàu đi qua. Cả bốn tàu tới đúng kho thì cửa kho mở và hiện chòm sao.',
            targets: [
              { x: 250, y: 790, r: 55, verb: 'tap' },
              { x: NODE[0].x, y: NODE[0].y, r: 0, verb: 'look', act: (picture) => (p) => paintRun(picture, SOLUTION, p * TOTAL_SECONDS, true) },
            ],
            apply: finish,
          },
          {
            note: 'Đọc bốn chòm sao sau cửa kho theo thứ tự các tàu chạy: tàu 1, 2, 3, 4.',
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
