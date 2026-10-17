import { url } from '../core/defs';
import { glyph, placeStars, type GlyphId } from '../core/glyphs';
import { drawOwl } from '../core/owl';
import { SCENE_H, SCENE_W } from '../core/scene';
import { asButton, el, toolButton, undoIcon, uid } from '../core/svg';
import { easeInOutSine, tween } from '../core/tween';
import { starfield } from './sky';
import type { HintStep, PuzzleDef } from './types';

/**
 * Chapter 5, level 4 — the shunting yard ("bãi dồn toa"). Six wagons stand on three tracks that
 * all open into one lead where the little engine waits: the platform track (4 wagons), and two
 * sidings (3 each). The engine can only reach the end nearest the lead, so the wagon there is
 * the only one that can move on its own; pick a wagon and it takes the ones in front of it along
 * (an engine pulls at most two), then tap the lever of the track to send them to. A track that is
 * full does not take them. Above the platform four dark silhouettes show the wagons it wants,
 * left to right. When exactly those four stand on the platform in that order the lamps come on
 * and the four wagons show their constellations; the two others are only in the way.
 */

export const TRACKS = 3;
export const CAPACITY: readonly number[] = [4, 3, 3];
/** An engine can pull this many wagons at once. */
export const MAX_BLOCK = 2;
/** Wagon types: 0–3 are the wanted ones, in the order they stand on the platform; 4 and 5 are in the way. */
export const CAR_NAMES: readonly string[] = ['toa khách', 'toa thư', 'toa bồn', 'toa hàng kín', 'toa than', 'toa sàn'];
export const WANTED: readonly number[] = [0, 1, 2, 3];
/** The constellation each wanted wagon shows when the train is right; none on the two in the way. */
export const CAR_GLYPHS: readonly (GlyphId | null)[] = ['belt', 'dipper', 'hook', 'crown', null, null];

/** Each track lists its wagons from the end nearest the lead outwards (leftmost first). */
export type Yard = number[][];
export type Move = readonly [from: number, count: number, to: number];

export const START: Yard = [[5, 4], [0], [2, 1, 3]];

export const copyYard = (y: Yard): Yard => y.map((t) => [...t]);
export const sameYard = (a: Yard, b: Yard): boolean => a.every((t, i) => t.length === b[i].length && t.every((c, j) => c === b[i][j]));

/** The wagons on the platform are exactly the wanted four, in order. */
export const isSolved = (y: Yard): boolean => y[0].length === WANTED.length && y[0].every((c, i) => c === WANTED[i]);

/** Moving the first `count` wagons of `from` to the front of `to`: allowed when there are that many, not too many, and room. */
export function canMove(y: Yard, from: number, count: number, to: number): boolean {
  return from !== to && count >= 1 && count <= MAX_BLOCK && count <= y[from].length && y[to].length + count <= CAPACITY[to];
}
export function move(y: Yard, from: number, count: number, to: number): Yard {
  const next = copyYard(y);
  next[to].unshift(...next[from].splice(0, count));
  return next;
}

export function legalMoves(y: Yard): Move[] {
  const out: Move[] = [];
  for (let from = 0; from < TRACKS; from += 1) for (let count = 1; count <= MAX_BLOCK; count += 1) for (let to = 0; to < TRACKS; to += 1) if (canMove(y, from, count, to)) out.push([from, count, to]);
  return out;
}

const keyOf = (y: Yard): string => y.map((t) => t.join('')).join('|');

/** The fewest moves to a finished platform (a shortest list of moves), or null if there is no way. */
export function solve(from: Yard): Move[] | null {
  const seen = new Map<string, { prev: string; by: Move } | null>([[keyOf(from), null]]);
  const states = new Map<string, Yard>([[keyOf(from), from]]);
  let frontier: Yard[] = [from];
  while (frontier.length) {
    const next: Yard[] = [];
    for (const y of frontier) {
      if (isSolved(y)) {
        const path: Move[] = [];
        let k = keyOf(y);
        for (let step = seen.get(k); step; step = seen.get(k)) {
          path.unshift(step.by);
          k = step.prev;
        }
        return path;
      }
      for (const m of legalMoves(y)) {
        const n = move(y, m[0], m[1], m[2]);
        const k = keyOf(n);
        if (seen.has(k)) continue;
        seen.set(k, { prev: keyOf(y), by: m });
        states.set(k, n);
        next.push(n);
      }
    }
    frontier = next;
  }
  return null;
}

/** The wagons that show a constellation: the wanted four, once the platform is right (nothing before). */
export const shownGlyphs = (y: Yard): (GlyphId | null)[] => (isSolved(y) ? y[0].map((c) => CAR_GLYPHS[c]) : []);

// ---------------------------------------------------------------- drawing

export const CAR_W = 200;
export const SLOT = 216;
export const TRACK_X = 520;
export const TRACK_Y: readonly number[] = [380, 580, 770];
export const LEVER_X = 450;
export const ENGINE_HOME = { x: 170, y: 380 };
export const slotXY = (track: number, i: number): { x: number; y: number } => ({ x: TRACK_X + i * SLOT + SLOT / 2, y: TRACK_Y[track] });
const DARK = '#0a0c18';
/** The colour of the board behind the silhouettes, used to cut windows and doors out of them. */
const CUT = '#d9cfae';

/** Draws a wagon of this type centred on (0, 0): the full painted one, or a flat dark silhouette for the board. */
function drawCar(parent: Element, type: number, flat: boolean): SVGGElement {
  const g = el('g', {}, parent);
  const f = (colour: string) => (flat ? DARK : colour);
  const detail = (draw: () => void) => { if (!flat) draw(); };
  const wheel = (x: number) => {
    el('circle', { cx: x, cy: 38, r: 14, fill: f('#1a1722') }, g);
    detail(() => el('circle', { cx: x, cy: 38, r: 5, fill: '#6a6478' }, g));
  };
  el('rect', { x: -86, y: 26, width: 172, height: 8, rx: 3, fill: f('#2a2632') }, g);
  if (type === 0) {
    el('rect', { x: -96, y: -40, width: 192, height: 68, rx: 12, fill: f('#3f7f86') }, g);
    detail(() => {
      el('rect', { x: -96, y: -40, width: 192, height: 10, rx: 5, fill: '#2d5f66' }, g);
      for (let i = 0; i < 5; i += 1) el('rect', { x: -78 + i * 37, y: -22, width: 24, height: 26, rx: 5, fill: '#16203a', stroke: '#a8d2d6', 'stroke-width': 3 }, g);
    });
    if (flat) for (let i = 0; i < 5; i += 1) el('rect', { x: -78 + i * 37, y: -22, width: 24, height: 26, rx: 5, fill: CUT }, g);
  } else if (type === 1) {
    el('path', { d: 'M-96 28 V-16 Q-96 -46 -60 -46 H60 Q96 -46 96 -16 V28 Z', fill: f('#a8453a') }, g);
    detail(() => {
      el('rect', { x: -66, y: -18, width: 58, height: 36, rx: 4, fill: '#f0e6c8' }, g);
      el('path', { d: 'M-66 -18 L-37 6 L-8 -18 M-66 18 L-45 0 M-8 18 L-29 0', fill: 'none', stroke: '#a8453a', 'stroke-width': 3 }, g);
      el('rect', { x: 28, y: -24, width: 40, height: 28, rx: 5, fill: '#16203a', stroke: '#e6b6aa', 'stroke-width': 3 }, g);
      for (const x of [38, 48, 58]) el('line', { x1: x, y1: -22, x2: x, y2: 2, stroke: '#e6b6aa', 'stroke-width': 2 }, g);
    });
  } else if (type === 2) {
    el('rect', { x: -96, y: 8, width: 192, height: 20, rx: 4, fill: f('#4a4658') }, g);
    el('rect', { x: -84, y: -38, width: 168, height: 52, rx: 26, fill: f('#6b7fa0') }, g);
    detail(() => {
      for (const x of [-52, -4, 44]) el('line', { x1: x, y1: -36, x2: x, y2: 12, stroke: '#3e4d6a', 'stroke-width': 5 }, g);
      el('rect', { x: -14, y: -50, width: 28, height: 14, rx: 5, fill: '#3e4d6a' }, g);
    });
  } else if (type === 3) {
    el('rect', { x: -96, y: -44, width: 192, height: 72, rx: 6, fill: f('#8a6a3a') }, g);
    detail(() => {
      for (let i = -4; i <= 4; i += 1) el('line', { x1: i * 20, y1: -42, x2: i * 20, y2: 26, stroke: '#6a4f28', 'stroke-width': 3 }, g);
      el('rect', { x: -34, y: -34, width: 68, height: 56, rx: 3, fill: '#9c7a46', stroke: '#4a3818', 'stroke-width': 4 }, g);
      el('path', { d: 'M-34 -34 L34 22 M34 -34 L-34 22', stroke: '#4a3818', 'stroke-width': 4 }, g);
    });
    if (flat) {
      el('rect', { x: -34, y: -34, width: 68, height: 56, fill: 'none', stroke: CUT, 'stroke-width': 6 }, g);
      el('path', { d: 'M-34 -34 L34 22 M34 -34 L-34 22', stroke: CUT, 'stroke-width': 5 }, g);
    }
  } else if (type === 4) {
    el('path', { d: 'M-96 -22 H96 L84 28 H-84 Z', fill: f('#3a3744') }, g);
    detail(() => {
      el('path', { d: 'M-82 -22 Q-60 -52 -30 -44 Q0 -62 34 -46 Q70 -50 82 -22 Z', fill: '#17151c' }, g);
      for (const [x, y] of [[-48, -34], [-8, -48], [28, -40], [58, -30], [-24, -26]]) el('circle', { cx: x, cy: y, r: 3.5, fill: '#6a6478' }, g);
    });
  } else {
    el('rect', { x: -96, y: 10, width: 192, height: 18, rx: 4, fill: f('#9a8a62') }, g);
    el('rect', { x: -84, y: -34, width: 62, height: 44, rx: 4, fill: f('#b9a36a') }, g);
    detail(() => {
      el('path', { d: 'M-84 -34 L-22 10 M-22 -34 L-84 10', stroke: '#7a6a40', 'stroke-width': 3 }, g);
    });
    for (const [x, y] of [[40, -2], [66, -2], [53, -26]]) el('circle', { cx: x, cy: y, r: 14, fill: f('#7a5a30') }, g);
    detail(() => { for (const [x, y] of [[40, -2], [66, -2], [53, -26]]) el('circle', { cx: x, cy: y, r: 6, fill: '#c9a060' }, g); });
  }
  wheel(-60);
  wheel(60);
  return g;
}

/** The little engine, centred on (0, 0). */
function drawEngine(parent: Element): SVGGElement {
  const g = el('g', {}, parent);
  el('rect', { x: -92, y: 26, width: 184, height: 8, rx: 3, fill: '#2a2632' }, g);
  el('rect', { x: -92, y: -10, width: 120, height: 38, rx: 16, fill: '#3b3f6a' }, g);
  el('rect', { x: 10, y: -52, width: 82, height: 80, rx: 8, fill: '#4a4f86' }, g);
  el('rect', { x: 26, y: -40, width: 44, height: 30, rx: 5, fill: '#16203a', stroke: '#f4c66a', 'stroke-width': 4 }, g);
  el('rect', { x: -70, y: -34, width: 22, height: 26, rx: 4, fill: '#2a2e52' }, g);
  el('circle', { cx: -60, cy: -40, r: 8, fill: '#c9cff5', opacity: 0.55 }, g);
  for (const x of [-60, -10, 50]) {
    el('circle', { cx: x, cy: 38, r: 16, fill: '#1a1722' }, g);
    el('circle', { cx: x, cy: 38, r: 6, fill: '#f4c66a' }, g);
  }
  return g;
}

/** Shows the cars where the yard says, in the scene or in a copy of it (by id). */
export function placeCars(root: ParentNode, y: Yard): void {
  y.forEach((track, t) => track.forEach((car, i) => {
    const { x, y: yy } = slotXY(t, i);
    root.querySelector(`[data-car="${car}"]`)?.setAttribute('transform', `translate(${x} ${yy})`);
  }));
}

/** Shows or hides the finished look: lamps, the constellations on the wanted wagons, everything else dimmed. */
export function paintFinish(root: ParentNode, y: Yard): void {
  const done = isSolved(y);
  root.querySelectorAll<SVGElement>('[data-role="lamp"]').forEach((n) => n.setAttribute('opacity', done ? '1' : '0.15'));
  CAR_GLYPHS.forEach((_, car) => {
    const node = root.querySelector<SVGElement>(`[data-car="${car}"]`);
    if (!node) return;
    const chom = node.querySelector<SVGElement>('[data-role="chom"]');
    if (chom) chom.style.display = done ? '' : 'none';
    node.setAttribute('opacity', done && !WANTED.includes(car) ? '0.4' : '1');
  });
}

export const shuntingYard: PuzzleDef = {
  id: 'shunting-yard',
  name: 'Bãi dồn toa',
  answer: WANTED.map((c) => CAR_GLYPHS[c] as GlyphId),
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    let yard = copyYard(START);
    const history: Yard[] = [];
    let picked: { track: number; count: number } | null = null;
    let busy = false;
    let cancel = () => {};

    // Back: night sky and the ballast.
    const sky = uid('yard-sky');
    const grad = el('linearGradient', { id: sky, x1: 0, y1: 0, x2: 0, y2: 1 }, scene.defs);
    el('stop', { offset: 0, 'stop-color': '#0b1030' }, grad);
    el('stop', { offset: 1, 'stop-color': '#1d2548' }, grad);
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: url(sky) }, back);
    starfield(back, { x: 0, y: 0, w: SCENE_W, h: 260 }, 40, 404);
    el('rect', { x: -60, y: 300, width: SCENE_W + 120, height: 700, fill: '#1a1826' }, back);
    scene.grain('back', 0.35);

    // Mid: rails, the platform canopy with its board of silhouettes, then the wagons.
    const rails = el('g', { 'pointer-events': 'none' }, mid);
    const rail = (d: string) => {
      el('path', { d, fill: 'none', stroke: '#2a2636', 'stroke-width': 26, 'stroke-linecap': 'round' }, rails);
      el('path', { d, fill: 'none', stroke: '#6a6478', 'stroke-width': 6, 'stroke-linecap': 'round' }, rails);
    };
    rail(`M40 ${TRACK_Y[0]} H${TRACK_X + CAPACITY[0] * SLOT}`);
    rail(`M300 ${TRACK_Y[0]} C 380 ${TRACK_Y[0]} 360 ${TRACK_Y[1]} 440 ${TRACK_Y[1]} H${TRACK_X + CAPACITY[1] * SLOT}`);
    rail(`M300 ${TRACK_Y[0]} C 360 ${TRACK_Y[0]} 330 ${TRACK_Y[2]} 440 ${TRACK_Y[2]} H${TRACK_X + CAPACITY[2] * SLOT}`);

    el('rect', { x: TRACK_X - 10, y: 232, width: CAPACITY[0] * SLOT + 20, height: 22, rx: 6, fill: '#3a3354' }, mid);
    for (let i = 0; i < CAPACITY[0]; i += 1) {
      const x = TRACK_X + i * SLOT + SLOT / 2;
      el('rect', { x: x - 84, y: 70, width: 168, height: 106, rx: 14, fill: '#d9cfae', stroke: '#8a7a50', 'stroke-width': 5 }, mid);
      const sil = el('g', { transform: `translate(${x} 123) scale(0.72)`, 'pointer-events': 'none' }, mid);
      drawCar(sil, WANTED[i], true);
      el('line', { x1: x, y1: 176, x2: x, y2: 232, stroke: '#3a3354', 'stroke-width': 8 }, mid);
      const lamp = el('g', { 'data-role': 'lamp', opacity: 0.15, 'pointer-events': 'none' }, mid);
      el('circle', { cx: x, cy: 276, r: 38, fill: '#ffe2a0', opacity: 0.35 }, lamp);
      el('circle', { cx: x, cy: 268, r: 11, fill: '#fff3c8' }, lamp);
    }

    // The wagons: one group each, with a hidden constellation on the wanted four.
    const cars = new Map<number, SVGGElement>();
    for (let car = 0; car < 6; car += 1) {
      const g = el('g', { class: 'interactive', 'data-car': car, 'data-hint': `car-${car}` }, mid);
      // A solid catch area: some wagons have gaps in their drawing that a tap would fall through.
      el('rect', { x: -100, y: -56, width: 200, height: 112, fill: 'transparent' }, g);
      drawCar(g, car, false);
      el('rect', { x: -100, y: -56, width: 200, height: 112, rx: 12, fill: 'none', stroke: '#ffd45a', 'stroke-width': 6, 'data-role': 'pick', style: 'display:none', 'pointer-events': 'none' }, g);
      const glyphId = CAR_GLYPHS[car];
      if (glyphId) {
        const chom = el('g', { 'data-role': 'chom', style: 'display:none', 'pointer-events': 'none' }, g);
        el('rect', { x: -92, y: -40, width: 184, height: 64, rx: 10, fill: '#0b1030', opacity: 0.78 }, chom);
        for (const [sx, sy] of placeStars(glyphId, 0, -8, 70)) {
          el('circle', { cx: sx.toFixed(1), cy: sy.toFixed(1), r: 12, fill: '#fff3c8', opacity: 0.28 }, chom);
          el('circle', { cx: sx.toFixed(1), cy: sy.toFixed(1), r: 5.5, fill: '#fff8dc' }, chom);
        }
      }
      cars.set(car, g);
    }

    // Front: the engine on the lead, the three levers, the undo button and the owl.
    const engine = el('g', { transform: `translate(${ENGINE_HOME.x} ${ENGINE_HOME.y})`, 'pointer-events': 'none' }, front);
    drawEngine(engine);
    const levers: SVGGElement[] = [];
    for (let t = 0; t < TRACKS; t += 1) {
      const g = el('g', { class: 'interactive', transform: `translate(${LEVER_X} ${TRACK_Y[t]})` }, front);
      el('circle', { r: 56, fill: 'transparent' }, g);
      el('circle', { r: 36, fill: '#241f33', stroke: '#6b4f24', 'stroke-width': 6, 'data-role': 'ring', 'pointer-events': 'none' }, g);
      el('path', { d: 'M-14 8 L0 -16 L14 8 Z', fill: '#f4c66a', 'pointer-events': 'none' }, g);
      levers.push(g);
    }
    drawOwl(front, 90, 800, 0.8);
    const undoButton = toolButton(front, 1500, 90, 'Hoàn tác', undoIcon, () => undo());

    const label = (car: number, t: number, i: number) => `${CAR_NAMES[car]}, ${t === 0 ? 'đường ga' : `ngõ ${t}`}, vị trí ${i + 1}`;
    const paintSelection = () => {
      yard.forEach((track, t) => track.forEach((car, i) => {
        const on = picked !== null && picked.track === t && i < picked.count;
        const pick = cars.get(car)!.querySelector<SVGElement>('[data-role="pick"]');
        if (pick) pick.style.display = on ? '' : 'none';
        cars.get(car)!.setAttribute('aria-label', label(car, t, i));
      }));
      levers.forEach((g, t) => {
        const ok = picked !== null && canMove(yard, picked.track, picked.count, t);
        g.querySelector('[data-role="ring"]')!.setAttribute('stroke', ok ? '#ffd45a' : '#6b4f24');
        g.querySelector('[data-role="ring"]')!.setAttribute('stroke-width', ok ? '9' : '6');
      });
      undoButton.style.opacity = history.length && !isSolved(yard) ? '1' : '0.35';
    };
    const lockIfSolved = () => {
      if (!isSolved(yard)) return;
      for (const g of [...cars.values(), ...levers, undoButton]) {
        g.style.pointerEvents = 'none';
        g.classList.remove('interactive');
        g.removeAttribute('tabindex');
        g.setAttribute('aria-disabled', 'true');
      }
    };
    const refresh = () => {
      placeCars(scene.root, yard);
      paintFinish(scene.root, yard);
      paintSelection();
    };

    /** Slides the wagons to the new yard: those pulled go round by the lead, the others just shift. */
    const animateTo = (next: Yard, block: { from: number; count: number; to: number } | null, done: () => void) => {
      const from = new Map<number, { x: number; y: number }>();
      yard.forEach((track, t) => track.forEach((car, i) => from.set(car, slotXY(t, i))));
      const goal = new Map<number, { x: number; y: number }>();
      next.forEach((track, t) => track.forEach((car, i) => goal.set(car, slotXY(t, i))));
      const pulled = new Set(block ? yard[block.from].slice(0, block.count) : []);
      busy = true;
      cancel = tween(block ? 760 : 260, (k) => {
        for (const [car, a] of from) {
          const b = goal.get(car)!;
          let x: number;
          let yy: number;
          if (block && pulled.has(car)) {
            // Out to the throat, along the lead, in at the other throat.
            const route = [a, { x: LEVER_X + 40, y: a.y }, { x: 330, y: TRACK_Y[0] }, { x: LEVER_X + 40, y: b.y }, b];
            const lengths = route.slice(1).map((p, j) => Math.hypot(p.x - route[j].x, p.y - route[j].y));
            let s = k * lengths.reduce((u, v) => u + v, 0);
            let j = 0;
            while (j < lengths.length - 1 && s > lengths[j]) { s -= lengths[j]; j += 1; }
            const u = lengths[j] ? Math.min(1, s / lengths[j]) : 1;
            x = route[j].x + (route[j + 1].x - route[j].x) * u;
            yy = route[j].y + (route[j + 1].y - route[j].y) * u;
          } else {
            x = a.x + (b.x - a.x) * k;
            yy = a.y + (b.y - a.y) * k;
          }
          cars.get(car)!.setAttribute('transform', `translate(${x.toFixed(1)} ${yy.toFixed(1)})`);
        }
        if (block) engine.setAttribute('transform', `translate(${(ENGINE_HOME.x + Math.sin(Math.PI * k) * 150).toFixed(1)} ${ENGINE_HOME.y})`);
      }, easeInOutSine);
      window.setTimeout(() => {
        busy = false;
        done();
      }, block ? 790 : 290);
    };

    const pick = (track: number, index: number) => {
      if (busy || isSolved(yard)) return;
      const count = index + 1;
      if (count > MAX_BLOCK) {
        sound.wrong();
        return;
      }
      picked = picked && picked.track === track && picked.count === count ? null : { track, count };
      sound.tick();
      paintSelection();
    };
    const send = (to: number) => {
      if (busy || isSolved(yard) || !picked) return;
      if (!canMove(yard, picked.track, picked.count, to)) {
        sound.wrong();
        return;
      }
      const m = { from: picked.track, count: picked.count, to };
      const next = move(yard, m.from, m.count, m.to);
      history.push(copyYard(yard));
      picked = null;
      sound.knock();
      animateTo(next, m, () => {
        yard = next;
        refresh();
        lockIfSolved();
        if (isSolved(yard)) sound.ding();
      });
    };
    function undo(): void {
      if (busy || !history.length || isSolved(yard)) return;
      const prev = history.pop()!;
      picked = null;
      sound.tick();
      animateTo(prev, null, () => {
        yard = prev;
        refresh();
      });
    }

    cars.forEach((g, car) => {
      asButton(g, CAR_NAMES[car], () => {
        const t = yard.findIndex((track) => track.includes(car));
        pick(t, yard[t].indexOf(car));
      });
    });
    levers.forEach((g, t) => asButton(g, t === 0 ? 'Cần ghi: đưa tới đường ga' : `Cần ghi: đưa tới ngõ ${t}`, () => send(t)));
    scene.root.addEventListener('keydown', (event) => {
      if (event.key === 'z' || event.key === 'Z') undo();
    });
    refresh();

    return {
      revealHints: () => 0,
      hintSteps: (): HintStep[] => {
        const path = solve(yard) ?? [];
        const first = path[0];
        const block = yard[first[0]].slice(0, first[1]);
        const after = move(yard, first[0], first[1], first[2]);
        // The yard after each remaining move, to replay quickly in the second picture.
        const states: Yard[] = [after];
        for (const m of path.slice(1)) states.push(move(states[states.length - 1], m[0], m[1], m[2]));
        const goalYard = states[states.length - 1];
        return [
          {
            note: 'Chạm một toa: toa đó và các toa nằm trước nó (gần đầu máy hơn) cùng đi, tối đa hai toa. Rồi chạm cần ghi của đường muốn đưa tới (đường đầy thì không nhận).',
            targets: block.map((car, i) => ({
              x: slotXY(first[0], i).x, y: slotXY(first[0], i).y, r: 70, verb: 'drag' as const,
              to: slotXY(first[2], i), object: `[data-hint="car-${car}"]`,
            })),
            apply: () => {
              yard = after;
              refresh();
            },
          },
          {
            note: 'Làm tiếp như vậy: dồn bốn toa đúng hình bóng treo trên mái ga vào đường ga theo thứ tự trái → phải, hai toa còn lại nhường chỗ ở các ngõ. Có nút Hoàn tác nếu lỡ tay.',
            targets: [{
              x: slotXY(0, 1).x, y: slotXY(0, 1).y, r: 0, verb: 'look',
              act: (picture) => (p) => {
                const state = states[Math.min(states.length - 1, Math.floor(p * states.length))];
                placeCars(picture, state);
              },
            }],
            apply: () => {
              yard = goalYard;
              refresh();
              lockIfSolved();
            },
          },
          {
            note: 'Khi đoàn tàu khớp bảng, đèn ga sáng và bốn toa hiện chòm sao. Đọc từ trái sang phải.',
            targets: WANTED.map((_, i) => ({ x: slotXY(0, i).x, y: slotXY(0, i).y, r: 100, verb: 'look' as const })),
            prepare: (picture) => {
              const overlay = picture.querySelector('.layer-overlay') ?? picture;
              WANTED.forEach((car, i) => {
                const id = CAR_GLYPHS[car] as GlyphId;
                const at = slotXY(0, i);
                const stars = placeStars(id, at.x, at.y - 8, 70);
                for (const [a, b] of glyph(id).lines) {
                  el('line', { x1: stars[a][0], y1: stars[a][1], x2: stars[b][0], y2: stars[b][1], class: 'hint-line', 'pointer-events': 'none' }, overlay);
                }
                const badge = el('g', { transform: `translate(${at.x} ${at.y + 70})`, 'pointer-events': 'none' }, overlay);
                el('circle', { r: 17, class: 'number-badge' }, badge);
                el('text', { y: 1, class: 'number-text' }, badge).textContent = String(i + 1);
              });
            },
          },
        ];
      },
      destroy: () => cancel(),
    };
  },
};
