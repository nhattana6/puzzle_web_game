import { drawOwl } from '../core/owl';
import { GLYPHS } from '../core/glyphs';
import { SCENE_H, SCENE_W } from '../core/scene';
import { el } from '../core/svg';
import { clamp } from '../core/tween';
import type { HintStep, PuzzleDef } from './types';
import { tr } from '../core/i18n';

/**
 * Chapter 2, level 8 — the gear box ("hộp bánh răng"). A chain of gears runs from a hand
 * crank, each meshing the next. Four gears carry a dab of paint on one tooth and every gear
 * has a fixed pointer over it. Turn the crank once round (a stop pin ends the turn) and count
 * how many times each painted tooth goes past its pointer: small gears turn many times for
 * one turn of the big one (at most four, so it can be counted). Each pass nudges the pointer
 * and ticks. A copper plate beside the box has nine holes laid out like the
 * keypad, each with one to nine dots in dice patterns, which turns a count into a key. The
 * answer is the key in the hole with that many dots, for the painted gears from the crank on.
 * The gear without paint is skipped. Nothing is lit or marked.
 */

export const CRANK_TEETH = 24;
const R_PER_TOOTH = 4.2;

export interface Gear {
  teeth: number;
  x: number;
  y: number;
  /** Has a dab of paint on one tooth, and a pointer above it. */
  paint: boolean;
}

/** The crank's own gear first, then the chain in order. Neighbours touch: distance is the sum of their radii. */
export const GEARS: readonly Gear[] = [
  { teeth: 24, x: 520, y: 520, paint: false },
  { teeth: 8, x: 623, y: 434, paint: true },
  { teeth: 6, x: 638, y: 377, paint: true },
  { teeth: 16, x: 730, y: 369, paint: false },
  { teeth: 24, x: 878, y: 448, paint: true },
  { teeth: 12, x: 965, y: 324, paint: true },
];

export const radiusOf = (g: Gear): number => g.teeth * R_PER_TOOTH;
/** How many times a gear turns for one turn of the crank. */
export const turnsOf = (g: Gear): number => CRANK_TEETH / g.teeth;

/** The angle (degrees, signed: neighbours turn opposite ways) of gear i for a crank angle. */
export const angleOf = (i: number, crank: number): number => (i % 2 === 0 ? 1 : -1) * crank * turnsOf(GEARS[i]);

/** Times the painted tooth of gear i has gone past its pointer. It starts opposite the pointer, half a turn off. */
export function passes(i: number, crank: number): number {
  if (!GEARS[i].paint) return 0;
  return Math.floor((Math.abs(angleOf(i, crank)) + 180) / 360);
}

/** Dots in hole p of the plate: the holes are in the keypad's order and count one to nine. */
export const dotsIn = (p: number): number => p + 1;

/** The answer: the count of each painted gear, as the key in the hole with that many dots. */
export const COUNTS: readonly number[] = GEARS.flatMap((g) => (g.paint ? [turnsOf(g)] : []));
export const KEY_POSITIONS: readonly number[] = COUNTS.map((n) => Array.from({ length: 9 }, (_, p) => p).find((p) => dotsIn(p) === n) ?? -1);

/** Dice-like dot patterns, cell 0..8 of a 3×3 grid, for 1..9 dots. */
export const DICE: readonly (readonly number[])[] = [
  [], [4], [0, 8], [0, 4, 8], [0, 2, 6, 8], [0, 2, 4, 6, 8], [0, 2, 3, 5, 6, 8], [0, 2, 3, 4, 5, 6, 8], [0, 1, 2, 3, 5, 6, 7, 8], [0, 1, 2, 3, 4, 5, 6, 7, 8],
];

const CRANK_ARM = 84;
/** The box and its gears are drawn on their own 665×430 plan (origin at its top-left corner `PLAN`), then scaled up so a phone can see them. */
const PLAN = { x: 385, y: 225, w: 665, h: 430 };
const MACHINE_SCALE = 1.6;
const PLATE_SCALE = 1.3;
const PLATE = { w: 300, h: 420 };
const GAP = 40;
const SPAN = PLAN.w * MACHINE_SCALE + GAP + PLATE.w * PLATE_SCALE;
/** Top-left corners (scene units) of the scaled box and the scaled plate: the pair is centred in the scene. */
const MACHINE_AT = { x: (SCENE_W - SPAN) / 2, y: (SCENE_H - PLAN.h * MACHINE_SCALE) / 2 };
const PLATE_AT = { x: MACHINE_AT.x + PLAN.w * MACHINE_SCALE + GAP, y: (SCENE_H - PLATE.h * PLATE_SCALE) / 2 };
/** Where a point of the box's plan lands in the scene. */
const onMachine = (x: number, y: number): [number, number] => [MACHINE_AT.x + (x - PLAN.x) * MACHINE_SCALE, MACHINE_AT.y + (y - PLAN.y) * MACHINE_SCALE];
/** Hole p of the plate, on the plate's own plan. */
const holePlan = (p: number): [number, number] => [52 + (p % 3) * 98, 76 + Math.floor(p / 3) * 120];
/** Hole p of the plate in the scene. */
export const holeSpot = (p: number): [number, number] => [PLATE_AT.x + holePlan(p)[0] * PLATE_SCALE, PLATE_AT.y + holePlan(p)[1] * PLATE_SCALE];

/** A gear outline: `teeth` teeth around pitch radius r. */
function gearPath(teeth: number, r: number): string {
  const outer = r + 4;
  const root = r - 5;
  const pts: string[] = [];
  const step = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i += 1) {
    const a = i * step;
    // Each tooth is a root, a rise, a flat top and a fall inside its half of the pitch.
    for (const [frac, rad] of [[0, root], [0.12, outer], [0.38, outer], [0.5, root]] as const) {
      const ang = a + frac * step;
      pts.push(`${(Math.cos(ang) * rad).toFixed(1)} ${(Math.sin(ang) * rad).toFixed(1)}`);
    }
  }
  return `M${pts.join(' L')} Z`;
}

export const gearBox: PuzzleDef = {
  id: 'gear-box',
  get name() {
    return tr('Hộp bánh răng', 'Gear Box');
  },
  answer: KEY_POSITIONS.map((p) => GLYPHS[p].id),
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    let crank = 0;
    let stuck = false;

    // Back: the attic wall.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#241a17' }, back);
    for (let x = 80; x < SCENE_W; x += 160) el('line', { x1: x, y1: -20, x2: x, y2: SCENE_H + 20, stroke: '#1a1210', 'stroke-width': 4 }, back);
    el('rect', { x: -60, y: 828, width: SCENE_W + 120, height: 120, fill: '#3a2a22' }, back);
    scene.grain('back', 0.4);

    // Mid: the open box, the chain of gears with their pointers, and the crank, drawn on the box's plan and scaled up.
    const machine = el('g', { transform: `translate(${(MACHINE_AT.x - PLAN.x * MACHINE_SCALE).toFixed(1)} ${(MACHINE_AT.y - PLAN.y * MACHINE_SCALE).toFixed(1)}) scale(${MACHINE_SCALE})` }, mid);
    el('rect', { x: PLAN.x, y: PLAN.y, width: PLAN.w, height: PLAN.h, rx: 14, fill: '#5a3f2a', stroke: '#3a2818', 'stroke-width': 8 }, machine);
    el('rect', { x: PLAN.x + 24, y: PLAN.y + 24, width: PLAN.w - 48, height: PLAN.h - 48, rx: 6, fill: '#1c1411' }, machine);

    const spins: SVGGElement[] = [];
    const pointers: SVGPathElement[] = [];
    const pointerAt: number[] = [];
    GEARS.forEach((g, i) => {
      const r = radiusOf(g);
      const at = el('g', { transform: `translate(${g.x} ${g.y})` }, machine);
      const spin = el('g', { 'data-gear': i }, at);
      el('path', { d: gearPath(g.teeth, r), fill: '#b98a4a', stroke: '#7a5a2c', 'stroke-width': 2, 'stroke-linejoin': 'round' }, spin);
      if (r > 40) {
        el('circle', { r: r * 0.62, fill: '#8e6a34', stroke: '#6b4f24', 'stroke-width': 2 }, spin);
        for (let k = 0; k < 4; k += 1) {
          el('rect', { x: -4, y: -r * 0.6, width: 8, height: r * 0.6, fill: '#b98a4a', transform: `rotate(${k * 90})` }, spin);
        }
      }
      el('circle', { r: Math.min(8, r * 0.35), fill: '#5a3f24' }, spin);
      if (g.paint) {
        // The painted tooth starts at the bottom, opposite the pointer.
        el('circle', { cx: 0, cy: r - 1, r: Math.min(8, Math.max(5, r * 0.26)), fill: '#e0533c', stroke: '#fff3d6', 'stroke-width': 1.5 }, spin);
      }
      spins[i] = spin;
      if (i > 0) {
        pointers[i] = el('path', { d: `M-11 ${-r - 19} L11 ${-r - 19} L0 ${-r - 4} Z`, fill: '#fff1c4', stroke: '#1c1411', 'stroke-width': 1.5, 'pointer-events': 'none' }, at);
      }
    });

    // The crank: a ring track, a stop pin, and a handle on the first gear.
    // (px, py) is the hub on the plan, (cx, cy) the same point in the scene, which is where the drag measures its angle from.
    const [px, py] = [GEARS[0].x, GEARS[0].y];
    const [cx, cy] = onMachine(px, py);
    el('circle', { cx: px, cy: py, r: CRANK_ARM, fill: 'none', stroke: '#6b4f24', 'stroke-width': 3, 'stroke-dasharray': '4 8', 'pointer-events': 'none' }, machine);
    el('rect', { x: px - 10, y: py - CRANK_ARM - 30, width: 8, height: 26, rx: 2, fill: '#3a2818', 'pointer-events': 'none' }, machine);
    const handle = el('g', {
      class: 'crank interactive', tabindex: 0, role: 'button', 'aria-label': tr('Tay quay: kéo vòng tròn đúng một vòng', 'Crank: drag in a circle exactly once'), 'data-hint': 'crank', transform: `translate(${px} ${py})`,
    }, machine);
    el('circle', { r: 44, fill: 'transparent' }, handle);
    el('line', { x1: 0, y1: 0, x2: 0, y2: -CRANK_ARM, stroke: '#d3a64f', 'stroke-width': 15, 'stroke-linecap': 'round' }, handle);
    el('circle', { cx: 0, cy: -CRANK_ARM, r: 24, fill: '#e2bd6b', stroke: '#8a6a2c', 'stroke-width': 4 }, handle);
    el('circle', { r: 14, fill: '#8a6a2c' }, handle);

    // The copper plate: nine holes in the keypad's layout, each with its dots.
    const plate = el('g', { transform: `translate(${PLATE_AT.x.toFixed(1)} ${PLATE_AT.y.toFixed(1)}) scale(${PLATE_SCALE})` }, mid);
    el('rect', { width: PLATE.w, height: PLATE.h, rx: 14, fill: '#a87a3c', stroke: '#6b4f24', 'stroke-width': 6 }, plate);
    for (let p = 0; p < 9; p += 1) {
      const [hx, hy] = holePlan(p);
      el('circle', { cx: hx, cy: hy, r: 44, fill: '#1c1411', stroke: '#6b4f24', 'stroke-width': 4 }, plate);
      for (const cell of DICE[dotsIn(p)]) {
        el('circle', { cx: hx + ((cell % 3) - 1) * 22, cy: hy + (Math.floor(cell / 3) - 1) * 22, r: 8.5, fill: '#f6efd8' }, plate);
      }
    }
    drawOwl(front, 1500, 800, 0.8);

    const lastPasses = GEARS.map(() => 0);
    const render = () => {
      handle.setAttribute('transform', `translate(${px} ${py}) rotate(${crank.toFixed(1)})`);
      spins.forEach((s, i) => s.setAttribute('transform', `rotate(${angleOf(i, crank).toFixed(1)})`));
      // A painted tooth going by nudges its pointer and ticks, so the passes can be counted by eye or ear.
      let ticked = false;
      GEARS.forEach((g, i) => {
        if (!g.paint) return;
        const now = passes(i, crank);
        if (now === lastPasses[i]) return;
        lastPasses[i] = now;
        ticked = true;
        pointers[i].setAttribute('transform', 'translate(0 9)');
        window.clearTimeout(pointerAt[i]);
        pointerAt[i] = window.setTimeout(() => pointers[i].removeAttribute('transform'), 140);
      });
      if (ticked) sound.tick();
    };

    const set = (next: number) => {
      const was = stuck;
      crank = clamp(next, 0, 360);
      stuck = crank >= 360;
      if (stuck && !was) sound.knock();
      render();
    };

    let lastAngle = 0;
    scene.draggable(handle, {
      start: (p) => { lastAngle = Math.atan2(p.y - cy, p.x - cx); },
      move: (p) => {
        const a = Math.atan2(p.y - cy, p.x - cx);
        let d = a - lastAngle;
        if (d > Math.PI) d -= 2 * Math.PI;
        if (d < -Math.PI) d += 2 * Math.PI;
        lastAngle = a;
        set(crank + (d * 180) / Math.PI);
      },
      end: () => sound.paper(),
    });
    handle.addEventListener('keydown', (event) => {
      const step = event.key === 'ArrowRight' || event.key === 'ArrowUp' ? 12 : event.key === 'ArrowLeft' || event.key === 'ArrowDown' ? -12 : 0;
      if (!step) return;
      event.preventDefault();
      set(crank + step);
    });
    render();

    return {
      // Nothing is marked in the scene; the hint card shows the whole solution instead.
      revealHints: () => 0,
      hintSteps: (): HintStep[] => [
        {
          note: tr('Kéo tay quay thật chậm đúng một vòng rồi đếm: mỗi bánh có chấm sơn, chấm đó đi qua kim phía trên bánh mấy lần (kim nảy nhẹ và có tiếng tách; bánh không chấm sơn bỏ qua). Bánh nhỏ quay nhiều vòng hơn.', 'Turn the crank very slowly, exactly once around, and count: each gear has a painted dot, and you count how many times that dot passes the needle above the gear (the needle bobs and clicks; skip gears without a painted dot). Small gears turn more times.'),
          targets: [{
            x: cx, y: cy - CRANK_ARM * MACHINE_SCALE, r: 60, verb: 'rotate', turn: 360, object: '[data-hint="crank"]',
            act: (picture) => {
              const nodes = GEARS.map((_, i) => picture.querySelector<SVGGElement>(`[data-gear="${i}"]`));
              return (p) => nodes.forEach((n, i) => n?.setAttribute('transform', `rotate(${angleOf(i, 360 * p).toFixed(1)})`));
            },
          }],
        },
        {
          note: tr(`Các số đếm được, theo thứ tự từ tay quay: ${COUNTS.join(', ')}. Tìm lỗ có đúng số chấm đó trên tấm đồng; lỗ ở vị trí nào thì bấm phím ở vị trí đó.`, `The counts, in order from the crank: ${COUNTS.join(', ')}. Find the holes with exactly that many dots on the brass plate; wherever a hole is, press the key in the same place.`),
          targets: KEY_POSITIONS.map((p) => ({ x: holeSpot(p)[0], y: holeSpot(p)[1], r: 60, verb: 'look' as const })),
        },
      ],
      destroy: () => pointerAt.forEach((t) => window.clearTimeout(t)),
    };
  },
};

