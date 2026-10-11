import { DEF, url } from '../core/defs';
import { SCENE_H, SCENE_W } from '../core/scene';
import { asButton, el, uid } from '../core/svg';
import { tween } from '../core/tween';
import type { HintTarget, PuzzleDef } from './types';

/**
 * The bronze-mirror hall ("gương đồng").
 * An oil lamp shines a beam across a dark hall. Bronze mirrors stand on a grid;
 * tap one to flip it between / and \. Steer the beam so it passes through every
 * paper lantern; pillars stop it. The level finishes when all lanterns are lit.
 */

export const COLS = 8;
export const ROWS = 4;
export type Cell = readonly [number, number];
/** 0 = '/', 1 = '\'. */
export type Tilt = 0 | 1;

export interface Mirror {
  at: Cell;
  /** Tilt that solves the level (decoys off the beam's path can be anything). */
  solution: Tilt;
  start: Tilt;
}

/** The lamp sits just left of the grid on this row and shines right. */
export const LAMP_ROW = 1;
export const MIRRORS: readonly Mirror[] = [
  { at: [2, 1], solution: 1, start: 0 },
  { at: [2, 3], solution: 1, start: 0 },
  { at: [5, 3], solution: 0, start: 1 },
  { at: [5, 0], solution: 0, start: 1 },
  { at: [7, 0], solution: 1, start: 0 },
  // Decoys, never on the solved beam's path.
  { at: [4, 1], solution: 0, start: 1 },
  { at: [1, 3], solution: 1, start: 1 },
  { at: [3, 0], solution: 0, start: 0 },
  { at: [6, 2], solution: 1, start: 0 },
];
export const LANTERNS: readonly Cell[] = [[4, 3], [6, 0], [7, 2]];
export const PILLARS: readonly Cell[] = [[3, 2], [1, 0], [0, 3]];

const key = ([c, r]: Cell) => `${c},${r}`;

/** Cells the beam lights, in order, for the given mirror tilts. */
export function traceBeam(tilts: readonly Tilt[]): Cell[] {
  const mirrorAt = new Map(MIRRORS.map((m, i) => [key(m.at), i]));
  const pillars = new Set(PILLARS.map(key));
  const path: Cell[] = [];
  const seen = new Set<string>();
  let [c, r] = [-1, LAMP_ROW];
  let [dx, dy] = [1, 0];
  for (;;) {
    c += dx;
    r += dy;
    if (c < 0 || c >= COLS || r < 0 || r >= ROWS || pillars.has(key([c, r]))) return path;
    const state = `${c},${r},${dx},${dy}`;
    if (seen.has(state)) return path;
    seen.add(state);
    path.push([c, r]);
    const m = mirrorAt.get(key([c, r]));
    if (m !== undefined) [dx, dy] = tilts[m] === 0 ? [-dy, -dx] : [dy, dx];
  }
}

export const litLanterns = (tilts: readonly Tilt[]): Set<string> => {
  const lit = new Set(traceBeam(tilts).map(key));
  return new Set(LANTERNS.map(key).filter((k) => lit.has(k)));
};

export const isHallSolved = (tilts: readonly Tilt[]): boolean => litLanterns(tilts).size === LANTERNS.length;

/**
 * Each hint corrects one mirror: the first mirror along the solved beam's path
 * that is tilted wrong right now and has not been hinted yet.
 */
export function nextMirrorHint(tilts: readonly Tilt[], revealed: readonly number[]): number | null {
  const solvedPath = traceBeam(MIRRORS.map((m) => m.solution)).map(key);
  const onPath = MIRRORS.map((m, i) => ({ i, step: solvedPath.indexOf(key(m.at)) }))
    .filter(({ step }) => step !== -1)
    .sort((a, b) => a.step - b.step);
  return onPath.find(({ i }) => !revealed.includes(i) && tilts[i] !== MIRRORS[i].solution)?.i ?? null;
}

const CELL = 150;
const X0 = (SCENE_W - COLS * CELL) / 2;
const Y0 = 190;
const centre = ([c, r]: Cell) => ({ x: X0 + c * CELL + CELL / 2, y: Y0 + r * CELL + CELL / 2 });

export const mirrorHall: PuzzleDef = {
  id: 'mirror-hall',
  name: 'Gương đồng',
  guide: {
    goal: 'Dẫn tia sáng từ ngọn đèn dầu đi qua tất cả đèn lồng giấy.',
    steps: [
      { icon: 'tap', text: 'Bấm vào một tấm gương đồng để lật nghiêng sang chiều ngược lại ( / hoặc \\ ).' },
      { icon: 'drag', text: 'Tia sáng đổi hướng khi chạm gương và bị cột gỗ chặn lại.' },
      { icon: 'done', text: 'Tia sáng đi qua đèn lồng nào thì đèn đó sáng. Thắp sáng cả 3 đèn là qua màn.' },
    ],
    tip: 'Đi theo tia sáng từ ngọn đèn, sửa từng tấm gương một. Có vài tấm gương không cần dùng tới.',
  },
  fireflies: [
    { id: 'mirror-hall/rafter', layer: 'back', x: 1500, y: 90 },
    { id: 'mirror-hall/floor', layer: 'mid', x: 1520, y: 840 },
  ],
  mount({ scene, sound, solved }) {
    const { back, mid, front } = scene.layers;
    const tilts: Tilt[] = MIRRORS.map((m) => m.start);
    const shownAngle: number[] = tilts.map((t) => (t === 0 ? 45 : -45));
    const hinted: number[] = [];

    // Back: a dark hall with lacquered pillars and a red altar cloth.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#1e1a1f' }, back);
    for (let x = 0; x < SCENE_W; x += 400) {
      el('rect', { x: x + 20, y: -60, width: 30, height: 260, fill: '#4a1f1a' }, back);
    }
    el('rect', { x: -60, y: 120, width: SCENE_W + 120, height: 26, fill: '#3a2620' }, back);
    scene.grain('back', 0.5);

    // Mid: the stone floor grid.
    el('rect', { x: X0 - 20, y: Y0 - 20, width: COLS * CELL + 40, height: ROWS * CELL + 40, rx: 8, fill: '#2b2622' }, mid);
    for (let c = 0; c < COLS; c += 1) {
      for (let r = 0; r < ROWS; r += 1) {
        const { x, y } = centre([c, r]);
        el('rect', { x: x - CELL / 2 + 3, y: y - CELL / 2 + 3, width: CELL - 6, height: CELL - 6, rx: 4, fill: (c + r) % 2 ? '#38302b' : '#332b27' }, mid);
      }
    }
    scene.grain('mid', 0.4);

    // The lamp, pillars, lanterns and mirrors.
    const lamp = centre([-1, LAMP_ROW]);
    el('ellipse', { cx: lamp.x + 40, cy: lamp.y + 30, rx: 34, ry: 10, fill: '#5e3820' }, front);
    el('path', { d: `M${lamp.x + 14} ${lamp.y + 28} Q${lamp.x + 40} ${lamp.y - 6} ${lamp.x + 66} ${lamp.y + 28} Z`, fill: '#8a5a2e' }, front);
    el('path', { d: `M${lamp.x + 40} ${lamp.y - 30} Q${lamp.x + 52} ${lamp.y - 8} ${lamp.x + 40} ${lamp.y + 4} Q${lamp.x + 28} ${lamp.y - 8} ${lamp.x + 40} ${lamp.y - 30} Z`, fill: '#f4c66a', filter: url(DEF.glow), class: 'flame' }, front);

    for (const p of PILLARS) {
      const { x, y } = centre(p);
      el('rect', { x: x - 32, y: y - 52, width: 64, height: 104, rx: 8, fill: '#6b2a20', stroke: '#3a1510', 'stroke-width': 4 }, front);
      el('rect', { x: x - 40, y: y - 60, width: 80, height: 16, rx: 4, fill: '#3a1510' }, front);
    }

    const beamGlowId = uid('beam');
    const beamLayer = el('g', { 'pointer-events': 'none' }, front);
    const lanterns = LANTERNS.map((p) => {
      const { x, y } = centre(p);
      const g = el('g', { transform: `translate(${x} ${y})`, class: 'paper-lantern' }, front);
      el('line', { x1: 0, y1: -70, x2: 0, y2: -40, stroke: '#8a6a45', 'stroke-width': 2 }, g);
      el('rect', { x: -16, y: -44, width: 32, height: 8, rx: 2, fill: '#2b2622' }, g);
      const body = el('ellipse', { cx: 0, cy: 0, rx: 34, ry: 38, class: 'lantern-body' }, g);
      el('path', { d: 'M-18 -34 Q-28 0 -18 34 M0 -38 V38 M18 -34 Q28 0 18 34', fill: 'none', stroke: '#7a2119', 'stroke-width': 2, opacity: 0.6 }, g);
      el('rect', { x: -16, y: 36, width: 32, height: 8, rx: 2, fill: '#2b2622' }, g);
      return { g, body };
    });

    const mirrors = MIRRORS.map((m, i) => {
      const { x, y } = centre(m.at);
      const g = el('g', { class: 'mirror interactive', transform: `translate(${x} ${y})` }, front);
      el('circle', { r: CELL * 0.45, fill: 'transparent' }, g);
      el('ellipse', { cx: 0, cy: 48, rx: 30, ry: 8, fill: '#1a1512' }, g);
      const turn = el('g', {}, g);
      el('rect', { x: -6, y: -62, width: 12, height: 124, rx: 6, fill: '#c9a441', stroke: '#7a5a20', 'stroke-width': 3 }, turn);
      el('rect', { x: -2, y: -50, width: 4, height: 100, rx: 2, fill: '#fff1c4', opacity: 0.8 }, turn);
      const ghost = el('g', { opacity: 0, class: 'mirror-ghost' }, g);
      el('rect', { x: -6, y: -62, width: 12, height: 124, rx: 6, transform: `rotate(${m.solution === 0 ? 45 : -45})` }, ghost);
      asButton(g, `Gương đồng ${i + 1}`, () => flip(i));
      return { turn, ghost };
    });

    let wasSolved = false;
    const render = () => {
      mirrors.forEach(({ turn }, i) => turn.setAttribute('transform', `rotate(${shownAngle[i].toFixed(1)})`));
      const path = traceBeam(tilts);
      const points = [lamp.x + 40, lamp.y - 10, ...path.flatMap((p) => [centre(p).x, centre(p).y])];
      const last = path[path.length - 1];
      if (last) {
        // Let the beam run on to the wall or pillar it stops at.
        const before = path.length > 1 ? centre(path[path.length - 2]) : { x: lamp.x, y: lamp.y };
        const end = centre(last);
        const exit = traceExit(before, end);
        points.push(exit.x, exit.y);
      }
      beamLayer.replaceChildren();
      const pts = [];
      for (let i = 0; i < points.length; i += 2) pts.push(`${points[i].toFixed(1)},${points[i + 1].toFixed(1)}`);
      el('polyline', { points: pts.join(' '), class: 'beam-glow', id: beamGlowId }, beamLayer);
      el('polyline', { points: pts.join(' '), class: 'beam' }, beamLayer);
      const lit = litLanterns(tilts);
      LANTERNS.forEach((p, i) => lanterns[i].g.classList.toggle('lit', lit.has(key(p))));
      mirrors.forEach(({ ghost }, i) => ghost.setAttribute('opacity', hinted.includes(i) && tilts[i] !== MIRRORS[i].solution ? '0.5' : '0'));
      const now = isHallSolved(tilts);
      if (now && !wasSolved) {
        sound.chime();
        solved();
      }
      wasSolved = now;
    };

    /** The beam leaves the last lit cell in the direction it was going (or turned by a mirror there). */
    function traceExit(before: { x: number; y: number }, end: { x: number; y: number }) {
      const path = traceBeam(tilts);
      const lastCell = path[path.length - 1];
      let dx = Math.sign(end.x - before.x);
      let dy = Math.sign(end.y - before.y);
      const m = MIRRORS.findIndex((mm) => key(mm.at) === key(lastCell));
      if (m !== -1) [dx, dy] = tilts[m] === 0 ? [-dy, -dx] : [dy, dx];
      return { x: end.x + (dx * CELL) / 2, y: end.y + (dy * CELL) / 2 };
    }

    const cancels: (() => void)[] = [];
    function flip(i: number) {
      tilts[i] = tilts[i] === 0 ? 1 : 0;
      const from = shownAngle[i];
      const to = tilts[i] === 0 ? 45 : -45;
      cancels[i]?.();
      cancels[i] = tween(200, (t) => {
        shownAngle[i] = from + (to - from) * t;
        mirrors[i].turn.setAttribute('transform', `rotate(${shownAngle[i].toFixed(1)})`);
      });
      sound.knock();
      render();
    }

    render();

    return {
      revealHints: (count) => {
        while (hinted.length < count) {
          const next = nextMirrorHint(tilts, hinted);
          if (next === null) break;
          hinted.push(next);
        }
        render();
        return hinted.length;
      },
      hintTargets: () => hinted
        .filter((i) => tilts[i] !== MIRRORS[i].solution)
        .map((i): HintTarget => ({ ...centre(MIRRORS[i].at), r: 62, verb: 'tap' })),
      destroy: () => cancels.forEach((cancel) => cancel?.()),
    };
  },
};
