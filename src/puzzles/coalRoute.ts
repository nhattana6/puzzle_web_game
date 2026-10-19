import { glyph, placeStars, type GlyphId } from '../core/glyphs';
import { drawOwl } from '../core/owl';
import { SCENE_H, SCENE_W } from '../core/scene';
import { asButton, el } from '../core/svg';
import { clamp, easeInOutSine, tween } from '../core/tween';
import { seeded, starfield } from './sky';
import type { HintStep, PuzzleDef } from './types';
import { tr } from '../core/i18n';

/**
 * Chapter 5, level 7 — just enough coal ("than vừa đủ"). A map of twelve stations on a wooden plate;
 * the engine waits at the first, the workshop at the last. Each stretch of track has sleeper
 * bars across it: as many bars as shovels of coal it burns. The tender holds fifteen lumps and
 * every stretch takes its share. Tap a station next to the engine to drive there (never back
 * to one already passed), tap the one just left to wind back. Reach the workshop with the last
 * lump burnt and its door opens; arrive with coal to spare and it stays shut, run out and the
 * engine cannot go on. Seven stations carry a sign with a constellation; the route that burns
 * exactly the coal goes past four of them, and those are read in the order of the journey.
 */

export const COAL = 15;
export const STATIONS = 12;
export const START = 0;
export const END = 11;
/** Where the stations are on the plate (0..1 across and down). */
export const PLACES: readonly (readonly [number, number])[] = [
  [0.067, 0.5], [0.237, 0.28], [0.264, 0.74], [0.404, 0.151], [0.437, 0.481], [0.405, 0.877],
  [0.584, 0.209], [0.582, 0.464], [0.571, 0.85], [0.755, 0.226], [0.737, 0.755], [0.919, 0.5],
];
/** The track: [from, to, shovels of coal]. */
export const EDGES: readonly (readonly [number, number, number])[] = [
  [4, 7, 4], [6, 9, 4], [5, 8, 1], [8, 10, 3], [2, 5, 1], [1, 3, 3], [3, 6, 2], [6, 7, 2], [1, 4, 3], [0, 1, 4], [4, 6, 4], [7, 9, 4],
  [10, 11, 2], [3, 4, 3], [7, 10, 4], [2, 4, 4], [0, 2, 3], [9, 11, 4], [7, 8, 2], [4, 8, 4], [4, 5, 4], [1, 2, 2], [9, 10, 1],
];
/** The signs: which station carries which constellation (seven of them). */
export const SIGNS: Readonly<Record<number, GlyphId>> = { 2: 'hook', 5: 'square', 7: 'cross', 9: 'dipper', 3: 'triangle', 4: 'belt', 10: 'crown' };
/** The one route that burns exactly the coal. */
export const SOLUTION_PATH: readonly number[] = [0, 2, 5, 8, 7, 9, 11];

export const edgeCost = (u: number, v: number): number | null => {
  const e = EDGES.find(([a, b]) => (a === u && b === v) || (a === v && b === u));
  return e ? e[2] : null;
};
export const neighbours = (u: number): number[] => EDGES.flatMap(([a, b]) => (a === u ? [b] : b === u ? [a] : []));

export const pathCost = (path: readonly number[]): number => path.slice(1).reduce((s, v, i) => s + (edgeCost(path[i], v) ?? 0), 0);
export const coalLeft = (path: readonly number[]): number => COAL - pathCost(path);
/** The engine at the end of `path` may drive to `v`: next door, not passed before, and enough coal. */
export const canDrive = (path: readonly number[], v: number): boolean => {
  const here = path[path.length - 1];
  const cost = edgeCost(here, v);
  return cost !== null && !path.includes(v) && cost <= coalLeft(path);
};
/** The workshop is open: at the last station with not a lump left. */
export const isSolved = (path: readonly number[]): boolean => path[path.length - 1] === END && coalLeft(path) === 0;

/** The constellations of the stations on `path` that carry a sign, in the order passed. */
export const signsAlong = (path: readonly number[]): GlyphId[] => path.flatMap((v) => (SIGNS[v] ? [SIGNS[v]] : []));
export const READING: readonly GlyphId[] = signsAlong(SOLUTION_PATH);

/** Every route from the first station to the last that never passes a station twice. */
export function allRoutes(): { path: number[]; cost: number }[] {
  const out: { path: number[]; cost: number }[] = [];
  const walk = (path: number[], cost: number) => {
    const here = path[path.length - 1];
    if (here === END) {
      out.push({ path: [...path], cost });
      return;
    }
    for (const v of neighbours(here)) {
      if (path.includes(v)) continue;
      path.push(v);
      walk(path, cost + (edgeCost(here, v) ?? 0));
      path.pop();
    }
  };
  walk([START], 0);
  return out;
}

// ---------------------------------------------------------------- drawing

export const PLATE = { x: 80, y: 90, w: 1040, h: 720 };
export const stationXY = (i: number): { x: number; y: number } => ({ x: 130 + PLACES[i][0] * 880, y: 150 + PLACES[i][1] * 600 });
/** Size of a sign board. */
export const SIGN = { w: 84, h: 62 };
/**
 * Where station `i`'s sign hangs: in whichever of eight directions leaves the most room between it and the
 * track going out of the station, and clear of the other stations and signs.
 */
const signCache = new Map<number, { x: number; y: number }>();
export const signXY = (i: number): { x: number; y: number } => {
  const cached = signCache.get(i);
  if (cached) return cached;
  const here = stationXY(i);
  const away = neighbours(i).map((v) => Math.atan2(stationXY(v).y - here.y, stationXY(v).x - here.x));
  const taken = Object.keys(SIGNS).map(Number).filter((j) => j < i);
  let best = { x: here.x, y: here.y - 80, score: -Infinity };
  for (let k = 0; k < 8; k += 1) {
    const a = (k * Math.PI) / 4;
    const d = k % 2 ? 92 : Math.abs(Math.cos(a)) > 0.5 ? 100 : 80;
    const p = { x: here.x + Math.cos(a) * d, y: here.y + Math.sin(a) * d };
    let score = Math.min(...away.map((t) => Math.abs(Math.atan2(Math.sin(t - a), Math.cos(t - a)))), Math.PI);
    if (p.x - SIGN.w / 2 < PLATE.x + 10 || p.x + SIGN.w / 2 > PLATE.x + PLATE.w - 150 || p.y - SIGN.h / 2 < PLATE.y + 10 || p.y + SIGN.h / 2 > PLATE.y + PLATE.h - 10) score -= 10;
    for (let v = 0; v < STATIONS; v += 1) if (v !== i && Math.hypot(stationXY(v).x - p.x, stationXY(v).y - p.y) < 62) score -= 5;
    for (const j of taken) if (Math.abs(signXY(j).x - p.x) < SIGN.w + 8 && Math.abs(signXY(j).y - p.y) < SIGN.h + 8) score -= 5;
    if (score > best.score) best = { ...p, score };
  }
  const placed = { x: best.x, y: best.y };
  signCache.set(i, placed);
  return placed;
};
const BIN = { x: 1190, y: 250, w: 310, h: 400 };
/** Where each of the fifteen lumps lies in the tender (a loose heap, 5 across and 3 deep). */
export const LUMPS: readonly { x: number; y: number }[] = (() => {
  const rand = seeded(77);
  return Array.from({ length: COAL }, (_, i) => ({
    x: BIN.x + 50 + (i % 5) * 52 + (rand() - 0.5) * 12,
    y: BIN.y + BIN.h - 60 - Math.floor(i / 5) * 56 + (rand() - 0.5) * 10,
  }));
})();

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Shows the journey `path` (and the engine part way to the next station, if `towards` says so), in the scene or in a copy of it. */
export function paintTrip(root: ParentNode, path: readonly number[], towards?: { to: number; t: number }): void {
  const here = stationXY(path[path.length - 1]);
  const at = towards ? { x: lerp(here.x, stationXY(towards.to).x, towards.t), y: lerp(here.y, stationXY(towards.to).y, towards.t) } : here;
  root.querySelector('[data-role="engine"]')?.setAttribute('transform', `translate(${at.x.toFixed(1)} ${at.y.toFixed(1)})`);
  const left = coalLeft(path) - (towards && towards.t >= 0.5 ? edgeCost(path[path.length - 1], towards.to) ?? 0 : 0);
  root.querySelectorAll<SVGElement>('[data-lump]').forEach((n) => { n.style.display = Number(n.getAttribute('data-lump')) < left ? '' : 'none'; });
  root.querySelectorAll<SVGElement>('[data-edge-on]').forEach((n) => {
    const [a, b] = (n.getAttribute('data-edge-on') ?? '').split('-').map(Number);
    const used = path.some((v, i) => i > 0 && ((path[i - 1] === a && v === b) || (path[i - 1] === b && v === a)));
    n.style.display = used ? '' : 'none';
  });
}

/** When the workshop opens: its door lifts, the route is lit and the signs not on it step back. */
export function paintFinish(root: ParentNode, path: readonly number[], solved: boolean): void {
  root.querySelectorAll<SVGElement>('[data-role="door"]').forEach((n) => { n.style.display = solved ? 'none' : ''; });
  root.querySelectorAll<SVGElement>('[data-role="light"]').forEach((n) => { n.style.display = solved ? '' : 'none'; });
  root.querySelectorAll<SVGElement>('[data-sign]').forEach((n) => {
    const on = !solved || path.includes(Number(n.getAttribute('data-sign')));
    n.setAttribute('opacity', on ? '1' : '0.3');
    n.querySelectorAll<SVGElement>('[data-role="sign-glow"]').forEach((g) => { g.style.display = solved && on ? '' : 'none'; });
  });
}

export const coalRoute: PuzzleDef = {
  id: 'coal-route',
  get name() {
    return tr('Than vừa đủ', 'Just Enough Coal');
  },
  answer: [...READING],
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    const path: number[] = [START];
    let busy = false;
    let cancel = () => {};

    // Back: a table and the wooden map plate.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#2a1d16' }, back);
    el('rect', { x: PLATE.x, y: PLATE.y, width: PLATE.w, height: PLATE.h, rx: 30, fill: '#6b4a2e', stroke: '#3a2614', 'stroke-width': 10 }, back);
    const grain = seeded(9);
    for (let i = 0; i < 26; i += 1) el('path', { d: `M${PLATE.x + 20} ${PLATE.y + 20 + i * 27} q${300 + grain() * 300} ${(grain() - 0.5) * 14} ${PLATE.w - 40} 0`, fill: 'none', stroke: '#5a3d24', 'stroke-width': 3, opacity: 0.55 }, back);
    starfield(back, { x: 1130, y: 0, w: 470, h: 200 }, 12, 707);
    scene.grain('back', 0.35);

    // Mid: the track with its sleeper bars, then the stations and their signs.
    const track = el('g', { 'pointer-events': 'none' }, mid);
    EDGES.forEach(([u, v, cost]) => {
      const a = stationXY(u);
      const b = stationXY(v);
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      const nx = -(b.y - a.y) / len;
      const ny = (b.x - a.x) / len;
      el('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: '#2a2018', 'stroke-width': 18, 'stroke-linecap': 'round' }, track);
      for (let k = 1; k <= cost; k += 1) {
        const f = k / (cost + 1);
        const cx = lerp(a.x, b.x, f);
        const cy = lerp(a.y, b.y, f);
        el('line', { x1: cx - nx * 22, y1: cy - ny * 22, x2: cx + nx * 22, y2: cy + ny * 22, stroke: '#c9a46a', 'stroke-width': 7, 'stroke-linecap': 'round' }, track);
      }
      el('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: '#9a948a', 'stroke-width': 4 }, track);
      el('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: '#ffd45a', 'stroke-width': 9, 'stroke-linecap': 'round', opacity: 0.85, 'data-edge-on': `${u}-${v}`, style: 'display:none' }, track);
    });

    const stations: SVGGElement[] = [];
    for (let i = 0; i < STATIONS; i += 1) {
      const { x, y } = stationXY(i);
      const g = el('g', { class: 'interactive', 'data-station': i, 'data-grow': 1.4, transform: `translate(${x.toFixed(1)} ${y.toFixed(1)})` }, mid);
      el('circle', { r: 48, fill: 'transparent' }, g);
      el('circle', { r: 30, fill: i === END ? '#a8453a' : '#e6dcc0', stroke: '#2a1d16', 'stroke-width': 7, 'pointer-events': 'none' }, g);
      el('circle', { r: 11, fill: '#2a1d16', 'pointer-events': 'none' }, g);
      stations.push(g);
      const id = SIGNS[i];
      if (id) {
        const at = signXY(i);
        const sign = el('g', { 'data-sign': i, transform: `translate(${at.x.toFixed(1)} ${at.y.toFixed(1)})`, 'pointer-events': 'none' }, mid);
        el('line', { x1: 0, y1: 0, x2: x - at.x, y2: y - at.y, stroke: '#e6dcc0', 'stroke-width': 4 }, sign);
        el('rect', { x: -SIGN.w / 2, y: -SIGN.h / 2, width: SIGN.w, height: SIGN.h, rx: 10, fill: '#13182e', stroke: '#e6dcc0', 'stroke-width': 4 }, sign);
        el('circle', { 'data-role': 'sign-glow', r: 58, fill: '#fff3c8', opacity: 0.3, style: 'display:none' }, sign);
        for (const [sx, sy] of placeStars(id, 0, 0, 46)) el('circle', { cx: sx.toFixed(1), cy: sy.toFixed(1), r: 4, fill: '#fff8dc' }, sign);
      }
    }

    // The workshop behind the last station.
    const shop = el('g', { transform: `translate(1045 ${stationXY(END).y})`, 'pointer-events': 'none' }, mid);
    el('rect', { x: -66, y: -78, width: 132, height: 156, rx: 10, fill: '#4a3a52', stroke: '#2a1d16', 'stroke-width': 6 }, shop);
    el('path', { d: 'M-76 -78 L0 -118 L76 -78 Z', fill: '#6a2a2a', stroke: '#2a1d16', 'stroke-width': 6 }, shop);
    el('rect', { x: -40, y: -20, width: 80, height: 98, rx: 6, fill: '#0b0d18' }, shop);
    const light = el('g', { 'data-role': 'light', style: 'display:none' }, shop);
    el('rect', { x: -40, y: -20, width: 80, height: 98, rx: 6, fill: '#ffe2a0', opacity: 0.9 }, light);
    const door = el('g', { 'data-role': 'door' }, shop);
    el('rect', { x: -40, y: -20, width: 80, height: 98, rx: 6, fill: '#6a5a40', stroke: '#2a1d16', 'stroke-width': 4 }, door);
    for (let k = 0; k < 5; k += 1) el('line', { x1: -36, y1: -8 + k * 20, x2: 36, y2: -8 + k * 20, stroke: '#4a3a28', 'stroke-width': 4 }, door);

    // The engine on its station.
    const engine = el('g', { 'data-role': 'engine', 'pointer-events': 'none' }, front);
    const body = el('g', { transform: 'scale(0.55) translate(0 -18)' }, engine);
    el('rect', { x: -92, y: 26, width: 184, height: 8, rx: 3, fill: '#2a2632' }, body);
    el('rect', { x: -92, y: -10, width: 120, height: 38, rx: 16, fill: '#3b3f6a' }, body);
    el('rect', { x: 10, y: -52, width: 82, height: 80, rx: 8, fill: '#4a4f86' }, body);
    el('rect', { x: 26, y: -40, width: 44, height: 30, rx: 5, fill: '#16203a', stroke: '#f4c66a', 'stroke-width': 4 }, body);
    el('rect', { x: -70, y: -34, width: 22, height: 26, rx: 4, fill: '#2a2e52' }, body);
    for (const x of [-60, -10, 50]) {
      el('circle', { cx: x, cy: 38, r: 16, fill: '#1a1722' }, body);
      el('circle', { cx: x, cy: 38, r: 6, fill: '#f4c66a' }, body);
    }

    // The tender, with its lumps.
    const bin = el('g', { 'pointer-events': 'none' }, front);
    el('path', { d: `M${BIN.x} ${BIN.y} H${BIN.x + BIN.w} L${BIN.x + BIN.w - 20} ${BIN.y + BIN.h} H${BIN.x + 20} Z`, fill: '#3a3744', stroke: '#1a1722', 'stroke-width': 8 }, bin);
    for (let k = 1; k <= 3; k += 1) el('line', { x1: BIN.x + 8 + k * 4, y1: BIN.y + 90 * k, x2: BIN.x + BIN.w - 8 - k * 4, y2: BIN.y + 90 * k, stroke: '#2a2736', 'stroke-width': 5 }, bin);
    LUMPS.forEach((p, i) => {
      const lump = el('g', { 'data-lump': i, transform: `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})` }, bin);
      el('path', { d: 'M-24 6 L-14 -20 L10 -24 L26 -6 L18 18 L-12 20 Z', fill: '#17151c', stroke: '#4a4658', 'stroke-width': 3 }, lump);
      el('path', { d: 'M-8 -14 L6 -16 L4 -4 Z', fill: '#4a4658' }, lump);
    });
    drawOwl(front, 1350, 760, 0.8);

    const label = (i: number) => tr(`Ga ${i + 1}${i === START ? ' (đầu máy)' : i === END ? ' (xưởng)' : ''}`, `Station ${i + 1}${i === START ? ' (engine)' : i === END ? ' (workshop)' : ''}`);
    const refresh = (towards?: { to: number; t: number }) => {
      paintTrip(scene.root, path, towards);
      paintFinish(scene.root, path, isSolved(path));
    };
    const lock = () => stations.forEach((g) => {
      g.style.pointerEvents = 'none';
      g.classList.remove('interactive');
      g.removeAttribute('tabindex');
      g.setAttribute('aria-disabled', 'true');
    });
    const shake = () => {
      sound.wrong();
      cancel();
      cancel = tween(320, (k) => bin.setAttribute('transform', `translate(${(Math.sin(k * Math.PI * 6) * 8 * (1 - k)).toFixed(1)} 0)`), (k) => k);
    };

    const go = (to: number) => {
      const from = path[path.length - 1];
      busy = true;
      sound.knock();
      path.push(to);
      cancel();
      cancel = tween(420, (k) => {
        // The engine rolls from the old station to the new one; the path already includes it for lumps and bars.
        const a = stationXY(from);
        const b = stationXY(to);
        scene.root.querySelector('[data-role="engine"]')?.setAttribute('transform', `translate(${lerp(a.x, b.x, k).toFixed(1)} ${lerp(a.y, b.y, k).toFixed(1)})`);
        if (k >= 1) {
          busy = false;
          refresh();
          if (isSolved(path)) {
            sound.ding();
            lock();
          }
        }
      }, easeInOutSine);
      paintTrip(scene.root, path);
      scene.root.querySelector('[data-role="engine"]')?.setAttribute('transform', `translate(${stationXY(from).x} ${stationXY(from).y})`);
    };
    const wind = () => {
      const from = path.pop() as number;
      const to = path[path.length - 1];
      busy = true;
      sound.tick();
      cancel();
      cancel = tween(380, (k) => {
        const a = stationXY(from);
        const b = stationXY(to);
        scene.root.querySelector('[data-role="engine"]')?.setAttribute('transform', `translate(${lerp(a.x, b.x, k).toFixed(1)} ${lerp(a.y, b.y, k).toFixed(1)})`);
        if (k >= 1) {
          busy = false;
          refresh();
        }
      }, easeInOutSine);
      paintTrip(scene.root, path);
      scene.root.querySelector('[data-role="engine"]')?.setAttribute('transform', `translate(${stationXY(from).x} ${stationXY(from).y})`);
    };

    stations.forEach((g, i) => {
      asButton(g, label(i), () => {
        if (busy || isSolved(path)) return;
        const here = path[path.length - 1];
        if (i === here) return;
        if (path.length > 1 && i === path[path.length - 2]) {
          wind();
          return;
        }
        if (canDrive(path, i)) go(i);
        else if (neighbours(here).includes(i) && !path.includes(i)) shake();
      });
    });
    refresh();

    return {
      revealHints: () => 0,
      hintSteps: (): HintStep[] => {
        const route = [...SOLUTION_PATH];
        const first = stationXY(route[1]);
        return [
          {
            note: tr('Mỗi đoạn ray đốt số xẻng than bằng số vạch tà vẹt trên nó, thùng than có 15 cục. Chạm ga kề để lái tới đó; hãy tìm đường tới xưởng sao cho đốt vừa hết than.', 'Each stretch of track burns as many shovels of coal as it has sleeper bars, and the tender holds 15 lumps. Tap a neighbouring station to drive there; find a route to the workshop that uses up the coal exactly.'),
            targets: [{
              x: first.x, y: first.y, r: 52, verb: 'tap',
              act: (picture) => (p) => paintTrip(picture, [route[0]], { to: route[1], t: p }),
            }],
            apply: () => {
              path.length = 0;
              path.push(route[0], route[1]);
              refresh();
            },
          },
          {
            note: tr('Cứ thế đi tiếp: đường ngắn nhất chỉ đốt 10 cục nên chưa đủ, phải đi vòng cho đốt đúng 15. Tới xưởng còn thừa than thì cửa không mở. Chạm ga vừa rời để lùi.', 'Keep going like this: the shortest route burns only 10 lumps, which is not enough, so take a detour that burns exactly 15. Reach the workshop with coal left over and the door stays shut. Tap the station you just left to go back.'),
            targets: [{
              x: stationXY(END).x, y: stationXY(END).y, r: 0, verb: 'look',
              act: (picture) => (p) => {
                const legs = route.length - 2;
                const t = clamp(p / 0.9, 0, 1) * legs;
                const leg = Math.min(legs - 1, Math.floor(t));
                paintTrip(picture, route.slice(0, leg + 2), { to: route[leg + 2], t: t - leg });
              },
            }],
            apply: () => {
              path.length = 0;
              path.push(...route);
              refresh();
              lock();
            },
          },
          {
            note: tr('Cửa xưởng mở. Đọc chòm sao trên biển của các ga mà đoàn tàu đã đi qua, theo thứ tự đi qua.', 'The workshop door opens. Read the constellations on the signs of the stations the train passed, in the order it passed them.'),
            targets: route.filter((v) => SIGNS[v]).map((v) => ({ x: signXY(v).x, y: signXY(v).y, r: 62, verb: 'look' as const })),
            prepare: (picture) => {
              const overlay = picture.querySelector('.layer-overlay') ?? picture;
              route.filter((v) => SIGNS[v]).forEach((v, n) => {
                const at = signXY(v);
                const stars = placeStars(SIGNS[v], at.x, at.y, 46);
                for (const [a, b] of glyph(SIGNS[v]).lines) el('line', { x1: stars[a][0], y1: stars[a][1], x2: stars[b][0], y2: stars[b][1], class: 'hint-line', 'pointer-events': 'none' }, overlay);
                const badge = el('g', { transform: `translate(${at.x + SIGN.w / 2 - 4} ${at.y - SIGN.h / 2 + 4})`, 'pointer-events': 'none' }, overlay);
                el('circle', { r: 16, class: 'number-badge' }, badge);
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
