import { drawOwl } from '../core/owl';
import type { GlyphId } from '../core/glyphs';
import { SCENE_H, SCENE_W } from '../core/scene';
import { asButton, el } from '../core/svg';
import { starfield } from './sky';
import type { HintStep, PuzzleDef } from './types';

/**
 * Chapter 4, level 8 — the copper wires ("dây đồng nối sao"), a bridges puzzle (Hashi). Nineteen
 * stars sit on a grid, each marked with dots: how many copper wires have to end at it. A wire runs
 * straight (across, down or at 45°) from a star to the next star in that direction, never crosses
 * another wire, and there may be one or two between the same pair. Tap a star and then the star
 * next to it to lay a wire, again for a second wire, a third time to take them away. When every star
 * has all its wires the wires have drawn four constellations, interleaved on the board (nothing else
 * fits the numbers); the answer is those four, from the group with the fewest stars to the one with
 * the most, which tags of one to four dots show once the board is done.
 */

/** Star positions (row, column) on a 12×12 grid; the four constellations are interleaved. */
export const STARS: readonly (readonly [number, number])[] = [
  [2, 5], [5, 2], [5, 8], [6, 5], [6, 11], [4, 9], [8, 9], [0, 0], [3, 3], [1, 5], [3, 7], [0, 10], [7, 0], [6, 1], [6, 3], [8, 5], [8, 8], [11, 8], [11, 5],
];
/** How many wires end at each star. */
export const NUMBERS: readonly number[] = [3, 2, 3, 1, 4, 1, 2, 1, 2, 3, 3, 1, 1, 2, 3, 4, 3, 4, 3];

export const GRID = 12;

/** The four directions a wire can leave a star in (the others are the same pairs seen from the other end). */
const DIRECTIONS = [[0, 1], [1, 0], [1, 1], [1, -1]] as const;

/** Every pair of stars a wire could join: the next star in a straight line (across, down or at 45°) with none between. */
export const EDGES: readonly (readonly [number, number])[] = (() => {
  const at = new Map(STARS.map(([r, c], i) => [`${r},${c}`, i]));
  const out: [number, number][] = [];
  STARS.forEach(([r, c], i) => {
    for (const [dr, dc] of DIRECTIONS) {
      for (let rr = r + dr, cc = c + dc; rr >= 0 && rr < GRID && cc >= 0 && cc < GRID; rr += dr, cc += dc) {
        const j = at.get(`${rr},${cc}`);
        if (j !== undefined) {
          out.push([i, j]);
          break;
        }
      }
    }
  });
  return out;
})();

/** The one way to lay the wires: [star, star, wires]. */
export const SOLUTION: readonly (readonly [number, number, number])[] = [
  [0, 1, 1], [0, 2, 2], [1, 2, 1], [3, 4, 1], [4, 5, 1], [4, 6, 2], [7, 8, 1], [8, 9, 1], [9, 10, 2], [10, 11, 1], [12, 13, 1], [13, 14, 1], [14, 15, 2], [15, 16, 1], [16, 17, 2], [17, 18, 2], [18, 15, 1],
];

/** The wires of the stored solution as a count for each candidate pair. */
export const SOLUTION_COUNTS: readonly number[] = EDGES.map(([a, b]) => {
  const hit = SOLUTION.find(([x, y]) => (x === a && y === b) || (x === b && y === a));
  return hit ? hit[2] : 0;
});

/** The four constellations the wires draw, by the number of stars (3, 4, 5, 7). */
export const SHAPES: readonly GlyphId[] = ['triangle', 'arrow', 'crown', 'dipper'];

const edgeIndex = (a: number, b: number): number => EDGES.findIndex(([x, y]) => (x === a && y === b) || (x === b && y === a));

/** Whether two candidate wires would cross: they meet at a point inside both (sharing a star does not count). */
export function crosses(e: number, f: number): boolean {
  const [a, b] = EDGES[e];
  const [c, d] = EDGES[f];
  if (a === c || a === d || b === c || b === d) return false;
  const side = (p: readonly number[], q: readonly number[], r: readonly number[]) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
  const [p, q, r, t] = [STARS[a], STARS[b], STARS[c], STARS[d]];
  return side(p, q, r) * side(p, q, t) < 0 && side(r, t, p) * side(r, t, q) < 0;
}

/** Whether a wire may be laid on pair `e` given the wires already down. */
export const canLay = (counts: readonly number[], e: number): boolean => counts.every((n, f) => n === 0 || !crosses(e, f));

/** The next count for a pair when tapped: none → one → two → none; null when a first wire would cross another. */
export function nextCount(counts: readonly number[], e: number): number | null {
  if (counts[e] === 0) return canLay(counts, e) ? 1 : null;
  return counts[e] === 1 ? 2 : 0;
}

export function degrees(counts: readonly number[]): number[] {
  const out = STARS.map(() => 0);
  EDGES.forEach(([a, b], e) => {
    out[a] += counts[e];
    out[b] += counts[e];
  });
  return out;
}

/** Every star has exactly its number of wires. */
export const isSolved = (counts: readonly number[]): boolean => degrees(counts).every((d, i) => d === NUMBERS[i]);

/** Groups of stars joined by wires, each as a sorted list of star indices; smallest group first. */
export function groups(counts: readonly number[]): number[][] {
  const parent = STARS.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  EDGES.forEach(([a, b], e) => { if (counts[e] > 0) parent[find(a)] = find(b); });
  const byRoot = new Map<number, number[]>();
  STARS.forEach((_, i) => {
    const r = find(i);
    byRoot.set(r, [...(byRoot.get(r) ?? []), i]);
  });
  return [...byRoot.values()].filter((g) => g.length > 1).sort((x, y) => x.length - y.length || x[0] - y[0]);
}

/** The answer: the constellations, from the group with the fewest stars to the one with the most. */
export const READING_ORDER: readonly GlyphId[] = SHAPES;

// ── Layout (scene units) ────────────────────────────────────────────────────────────────────
const CELL = 66;
const ORIGIN = { x: 437, y: 82 };
export const starCentre = (i: number): { x: number; y: number } => ({
  x: ORIGIN.x + STARS[i][1] * CELL,
  y: ORIGIN.y + STARS[i][0] * CELL,
});

/** Shows `n` wires (0–2) on pair `e` inside any copy of the scene. */
function setWire(root: ParentNode, e: number, n: number): void {
  const one = root.querySelector<SVGElement>(`[data-wire="${e}-1"]`);
  const two = root.querySelectorAll<SVGElement>(`[data-wire="${e}-2"]`);
  if (one) one.style.display = n === 1 ? '' : 'none';
  two.forEach((w) => { w.style.display = n === 2 ? '' : 'none'; });
}

/** Dot positions for `n` dots inside a star (a ring, with one in the middle when n is 1). */
const dotsFor = (n: number): [number, number][] =>
  n === 1 ? [[0, 0]] : Array.from({ length: n }, (_, k): [number, number] => {
    const a = (k / n) * Math.PI * 2 - Math.PI / 2;
    return [Math.cos(a) * 12, Math.sin(a) * 12];
  });

export const copperWires: PuzzleDef = {
  id: 'copper-wires',
  name: 'Dây đồng nối sao',
  answer: [...READING_ORDER],
  help: [
    'Số chấm trong mỗi ngôi sao là số sợi dây đồng phải nối vào nó. Chạm một sao rồi chạm sao kề ngay trên một đường thẳng (ngang, dọc hoặc chéo) để nối dây; chạm lần nữa để thành dây đôi, lần thứ ba để gỡ.',
    'Dây đi ngang, dọc hoặc chéo, tới sao kề ngay trên đường đó và không được cắt nhau; giữa hai sao tối đa hai sợi. Sao đủ dây thì sáng vàng. Khi mọi sao đều đủ dây, các dây vẽ nên những chòm sao.',
  ],
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    const counts: number[] = EDGES.map(() => 0);
    let selected = -1;
    let wasSolved = false;
    const starDisc: SVGCircleElement[] = [];
    const starDots: SVGGElement[] = [];
    const rings: SVGCircleElement[] = [];
    const tags: SVGGElement[] = [];

    // Back: the observatory wall.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#14172b' }, back);
    starfield(back, { x: 0, y: 0, w: SCENE_W, h: SCENE_H }, 50, 5808);
    scene.grain('back', 0.45);

    // Mid: the board, and one set of wires for each candidate pair (shown by count).
    const boardW = (GRID - 1) * CELL;
    el('rect', { x: ORIGIN.x - 60, y: ORIGIN.y - 56, width: boardW + 120, height: boardW + 112, rx: 22, fill: '#1c1830', stroke: '#6b4f24', 'stroke-width': 6, 'pointer-events': 'none' }, mid);
    EDGES.forEach(([a, b], e) => {
      const p = starCentre(a);
      const q = starCentre(b);
      const len = Math.hypot(q.x - p.x, q.y - p.y);
      const nx = -(q.y - p.y) / len;
      const ny = (q.x - p.x) / len;
      const line = (d: number, key: string) =>
        el('line', { x1: p.x + nx * d, y1: p.y + ny * d, x2: q.x + nx * d, y2: q.y + ny * d, stroke: '#d8935a', 'stroke-width': 7, 'stroke-linecap': 'round', 'data-wire': `${e}-${key}`, 'pointer-events': 'none' }, mid);
      line(0, '1');
      line(-8, '2');
      line(8, '2');
    });

    // Front: the stars, with their dots, and the group tags shown at the end.
    STARS.forEach((_, i) => {
      const p = starCentre(i);
      const g = el('g', { class: 'interactive', transform: `translate(${p.x} ${p.y})` }, front);
      el('circle', { r: 40, fill: 'transparent' }, g);
      rings.push(el('circle', { r: 36, fill: 'none', stroke: '#f4c66a', 'stroke-width': 4, 'stroke-dasharray': '7 7', 'pointer-events': 'none' }, g));
      starDisc.push(el('circle', { r: 28, fill: '#2c3566', stroke: '#8a8fbf', 'stroke-width': 4, 'pointer-events': 'none' }, g));
      const dots = el('g', { 'pointer-events': 'none' }, g);
      for (const [x, y] of dotsFor(NUMBERS[i])) el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: NUMBERS[i] > 4 ? 4 : 5, fill: '#fff1c4' }, dots);
      starDots.push(dots);
      asButton(g, `Sao hàng ${STARS[i][0] + 1}, cột ${STARS[i][1] + 1}, cần ${NUMBERS[i]} dây`, () => tapStar(i));
    });
    for (let rank = 0; rank < 4; rank += 1) {
      const tag = el('g', { 'pointer-events': 'none' }, front);
      const width = (rank + 1) * 18 + 14;
      el('rect', { x: -width / 2, y: -15, width, height: 30, rx: 15, fill: '#f4c66a', stroke: '#fff1c4', 'stroke-width': 3 }, tag);
      for (let k = 0; k <= rank; k += 1) el('circle', { cx: -width / 2 + 16 + k * 18, cy: 0, r: 6, fill: '#3a2a18' }, tag);
      tag.style.display = 'none';
      tags.push(tag);
    }
    drawOwl(front, 1330, 800, 0.9);

    const render = () => {
      counts.forEach((n, e) => setWire(scene.root, e, n));
      const deg = degrees(counts);
      STARS.forEach((_, i) => {
        const done = deg[i] === NUMBERS[i];
        const over = deg[i] > NUMBERS[i];
        starDisc[i].setAttribute('fill', done ? '#f4c66a' : '#2c3566');
        starDisc[i].setAttribute('stroke', over ? '#e0584f' : done ? '#fff1c4' : '#8a8fbf');
        starDots[i].setAttribute('opacity', '1');
        starDots[i].querySelectorAll('circle').forEach((c) => c.setAttribute('fill', done ? '#3a2a18' : '#fff1c4'));
      });
      const partners = new Set<number>();
      if (selected >= 0) {
        EDGES.forEach(([a, b], e) => {
          if (a !== selected && b !== selected) return;
          if (counts[e] > 0 || canLay(counts, e)) partners.add(a === selected ? b : a);
        });
      }
      rings.forEach((ring, i) => { ring.style.display = i === selected || partners.has(i) ? '' : 'none'; });
      const done = isSolved(counts);
      // A group's tag goes in a free spot beside the group's top-left star: clear of every star and of the other tags.
      const placed: { x: number; y: number }[] = [];
      const spots: [number, number][] = [[-14, -52], [-56, -14], [58, -14], [-14, 52], [-60, -44], [44, -48], [-60, 40], [50, 46]];
      groups(counts).forEach((g, rank) => {
        const top = g.reduce((best, i) => (STARS[i][0] < STARS[best][0] || (STARS[i][0] === STARS[best][0] && STARS[i][1] < STARS[best][1]) ? i : best), g[0]);
        const p = starCentre(top);
        const free = (x: number, y: number) =>
          STARS.every((_, i) => i === top || Math.hypot(starCentre(i).x - x, starCentre(i).y - y) > 46)
          && placed.every((t) => Math.hypot(t.x - x, t.y - y) > 70);
        const spot = spots.map(([dx, dy]) => ({ x: p.x + dx, y: p.y + dy })).find((q) => free(q.x, q.y)) ?? { x: p.x - 14, y: p.y - 52 };
        placed.push(spot);
        tags[rank]?.setAttribute('transform', `translate(${spot.x} ${spot.y})`);
      });
      tags.forEach((tag, rank) => { tag.style.display = done && rank < groups(counts).length ? '' : 'none'; });
    };
    function tapStar(i: number): void {
      if (selected >= 0 && selected !== i) {
        const e = edgeIndex(selected, i);
        if (e >= 0) {
          const next = nextCount(counts, e);
          if (next === null) {
            sound.paper();
          } else {
            counts[e] = next;
            if (next === 0) sound.tick();
            else sound.knock();
          }
          selected = -1;
          render();
          const done = isSolved(counts);
          if (done && !wasSolved) sound.ding();
          wasSolved = done;
          return;
        }
      }
      selected = selected === i ? -1 : i;
      render();
    }
    render();

    return {
      // Nothing is marked in the scene; the hint card shows the whole solution instead.
      revealHints: () => 0,
      hintSteps: (): HintStep[] => {
        const order = SOLUTION.map(([a, b]) => edgeIndex(a, b));
        const first = starCentre(SOLUTION[0][0]);
        return [
          {
            note: 'Chạm một sao rồi chạm sao kề trên đường ngang, dọc hoặc chéo để nối dây (chạm lần nữa thành dây đôi). Mỗi sao phải đủ số dây bằng số chấm của nó; dây không cắt nhau. Làm lần lượt cho tới khi mọi sao đều sáng vàng.',
            targets: [
              {
                x: first.x, y: first.y, r: 45, verb: 'tap',
                act: (picture) => (p) => {
                  order.forEach((e, k) => setWire(picture, e, p > (k + 0.5) / order.length ? SOLUTION_COUNTS[e] : 0));
                },
              },
            ],
            apply: () => {
              SOLUTION_COUNTS.forEach((n, e) => { counts[e] = n; });
              selected = -1;
              wasSolved = true;
              render();
            },
          },
          {
            note: 'Các dây đã vẽ nên bốn chòm sao. Mỗi nhóm có một thẻ chấm: đọc các chòm theo thẻ từ 1 đến 4 chấm, tức từ nhóm ít sao nhất đến nhóm nhiều sao nhất.',
            targets: groups(SOLUTION_COUNTS).map((g) => {
              const xs = g.map((i) => starCentre(i).x);
              const ys = g.map((i) => starCentre(i).y);
              const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
              const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
              return { x: cx, y: cy, r: Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) / 2 + 40, verb: 'look' as const };
            }),
          },
        ];
      },
      destroy: () => undefined,
    };
  },
};
