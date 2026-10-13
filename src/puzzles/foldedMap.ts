import { placeStars, type GlyphId } from '../core/glyphs';
import { SCENE_H, SCENE_W } from '../core/scene';
import { asButton, el } from '../core/svg';
import { easeInOutSine, tween } from '../core/tween';
import { dist, seeded } from './sky';
import type { HintStep, PuzzleDef } from './types';

/**
 * Level 5 — the folded star map ("gấp bản đồ sao"). The stars of three
 * constellations are printed scattered over the four quarters of a thin sheet.
 * Fold it in half one way, then the other: the stars come together in the
 * top-left quarter, left to right.
 */

export const MAP = { x0: 300, y0: 130, x1: 1300, y1: 770 };
export const CX = (MAP.x0 + MAP.x1) / 2;
export const CY = (MAP.y0 + MAP.y1) / 2;
export const GLYPH_SIZE = 140;
export const GLYPH_SPOTS: readonly { id: GlyphId; x: number; y: number }[] = [
  { id: 'diamond', x: 400, y: 290 },
  { id: 'hook', x: 555, y: 290 },
  { id: 'triangle', x: 710, y: 290 },
];

export interface MapStar {
  /** Where the star ends up once both folds are made (top-left quarter). */
  final: [number, number];
  /** Where it is printed on the open sheet. */
  open: [number, number];
  glyph: number | null;
}

/** Folding mirrors the right half onto the left (v) and the bottom onto the top (h). */
export function foldPoint(x: number, y: number, v: number, h: number): [number, number] {
  const fx = x <= CX ? x : CX + (x - CX) * Math.cos(Math.PI * v);
  const fy = y <= CY ? y : CY + (y - CY) * Math.cos(Math.PI * h);
  return [fx, fy];
}

/** Every printed star: the constellations' stars spread over the quarters, plus loose decoys. */
export function mapStars(): MapStar[] {
  const rand = seeded(57);
  const stars: MapStar[] = [];
  GLYPH_SPOTS.forEach((g, gi) => {
    placeStars(g.id, g.x, g.y, GLYPH_SIZE).forEach(([x, y], si) => {
      // Neighbouring stars go to different quarters, so no constellation can be read unfolded.
      const quarter = (si * 3 + gi) % 4;
      const ox = quarter === 1 || quarter === 3 ? 2 * CX - x : x;
      const oy = quarter === 2 || quarter === 3 ? 2 * CY - y : y;
      stars.push({ final: [x, y], open: [ox, oy], glyph: gi });
    });
  });
  const finals = stars.map((s) => s.final);
  let tries = 0;
  while (stars.filter((s) => s.glyph === null).length < 16 && tries < 2000) {
    tries += 1;
    const x = MAP.x0 + 30 + rand() * (MAP.x1 - MAP.x0 - 60);
    const y = MAP.y0 + 30 + rand() * (MAP.y1 - MAP.y0 - 60);
    const final = foldPoint(x, y, 1, 1);
    // A decoy must not land on or between a constellation's stars once folded.
    if (finals.some(([fx, fy]) => dist(fx, fy, final[0], final[1]) < 40)) continue;
    if (GLYPH_SPOTS.some((g) => Math.abs(final[0] - g.x) < GLYPH_SIZE / 2 + 12 && Math.abs(final[1] - g.y) < GLYPH_SIZE / 2 + 12)) continue;
    finals.push(final);
    stars.push({ final, open: [x, y], glyph: null });
  }
  return stars;
}

/** Lays the sheet's four quarters and its stars out for fold progress v (vertical crease) and h (horizontal). */
function paintFold(quarters: readonly Element[], nodes: readonly Element[], stars: readonly MapStar[], v: number, h: number): void {
  const corners: [number, number, number, number][] = [
    [MAP.x0, MAP.y0, CX, CY], [CX, MAP.y0, MAP.x1, CY], [MAP.x0, CY, CX, MAP.y1], [CX, CY, MAP.x1, MAP.y1],
  ];
  corners.forEach(([x0, y0, x1, y1], q) => {
    const [ax, ay] = foldPoint(x0, y0, v, h);
    const [bx, by] = foldPoint(x1, y1, v, h);
    const flipped = (q % 2 === 1 && v > 0.5) !== (q >= 2 && h > 0.5);
    quarters[q].setAttribute('x', Math.min(ax, bx).toFixed(1));
    quarters[q].setAttribute('y', Math.min(ay, by).toFixed(1));
    quarters[q].setAttribute('width', Math.max(1, Math.abs(bx - ax)).toFixed(1));
    quarters[q].setAttribute('height', Math.max(1, Math.abs(by - ay)).toFixed(1));
    quarters[q].classList.toggle('back-side', flipped);
  });
  stars.forEach((s, i) => {
    const [x, y] = foldPoint(s.open[0], s.open[1], v, h);
    nodes[i].setAttribute('cx', x.toFixed(1));
    nodes[i].setAttribute('cy', y.toFixed(1));
  });
}

/** In a hint picture's copy of the map, the fold moving from (v0, h0) to (v1, h1). */
const foldDemo = (stars: readonly MapStar[], v0: number, h0: number, v1: number, h1: number) => (picture: SVGSVGElement) => {
  const quarters = [...picture.querySelectorAll('.map-quarter')];
  const nodes = [...picture.querySelectorAll('circle.map-star')];
  return (k: number) => paintFold(quarters, nodes, stars, v0 + (v1 - v0) * k, h0 + (h1 - h0) * k);
};

export const foldedMap: PuzzleDef = {
  id: 'folded-map',
  name: 'Gấp bản đồ sao',
  answer: GLYPH_SPOTS.map((g) => g.id),
  mount({ scene, sound }) {
    const { back, front } = scene.layers;
    const stars = mapStars();
    let v = 0;
    let h = 0;
    let vOn = false;
    let hOn = false;
    const hinted: ('v' | 'h')[] = [];
    let cancelV: (() => void) | null = null;
    let cancelH: (() => void) | null = null;

    // Back: a dark wooden desk with an inkpot and a quill.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#23180f' }, back);
    for (let y = -40; y < SCENE_H; y += 70) el('path', { d: `M-60 ${y} Q800 ${y + 30} 1660 ${y}`, stroke: '#2c1f14', 'stroke-width': 4, fill: 'none' }, back);
    el('ellipse', { cx: 1430, cy: 230, rx: 60, ry: 22, fill: '#0d0d18' }, back);
    el('rect', { x: 1380, y: 150, width: 100, height: 80, rx: 18, fill: '#1b1b30' }, back);
    el('path', { d: 'M1440 160 Q1500 60 1560 20', stroke: '#e8dcc0', 'stroke-width': 6, fill: 'none' }, back);
    scene.grain('back', 0.5);

    // Front: four quarters of the sheet, the stars, the creases.
    const quarters = [0, 1, 2, 3].map((q) => el('rect', { class: 'map-quarter', 'data-q': q }, front));
    const dots = el('g', { 'pointer-events': 'none' }, front);
    const nodes = stars.map((s) => el('circle', { r: s.glyph === null ? 5 : 7, class: s.glyph === null ? 'map-star decoy' : 'map-star' }, dots));

    const vCrease = el('g', { class: 'crease interactive' }, front);
    el('rect', { x: CX - 24, y: MAP.y0, width: 48, height: MAP.y1 - MAP.y0, fill: 'transparent' }, vCrease);
    el('line', { x1: CX, y1: MAP.y0 + 6, x2: CX, y2: MAP.y1 - 6, class: 'crease-line' }, vCrease);
    const hCrease = el('g', { class: 'crease interactive' }, front);
    el('rect', { x: MAP.x0, y: CY - 24, width: MAP.x1 - MAP.x0, height: 48, fill: 'transparent' }, hCrease);
    el('line', { x1: MAP.x0 + 6, y1: CY, x2: MAP.x1 - 6, y2: CY, class: 'crease-line' }, hCrease);

    const render = () => {
      paintFold(quarters, nodes, stars, v, h);
      // The creases sit on the sheet's folded edges.
      const right = foldPoint(MAP.x1, MAP.y0, v, h)[0];
      const bottom = foldPoint(MAP.x0, MAP.y1, v, h)[1];
      vCrease.querySelector('rect')?.setAttribute('height', String(Math.max(bottom, CY) - MAP.y0));
      vCrease.querySelector('line')?.setAttribute('y2', String(Math.max(bottom, CY) - 6));
      hCrease.querySelector('rect')?.setAttribute('width', String(Math.max(right, CX) - MAP.x0));
      hCrease.querySelector('line')?.setAttribute('x2', String(Math.max(right, CX) - 6));
    };

    const fold = (axis: 'v' | 'h') => {
      sound.paper();
      if (axis === 'v') {
        vOn = !vOn;
        const from = v;
        cancelV?.();
        cancelV = tween(600, (t) => {
          v = from + ((vOn ? 1 : 0) - from) * t;
          render();
        }, easeInOutSine);
      } else {
        hOn = !hOn;
        const from = h;
        cancelH?.();
        cancelH = tween(600, (t) => {
          h = from + ((hOn ? 1 : 0) - from) * t;
          render();
        }, easeInOutSine);
      }
      if (vOn && hOn) setTimeout(() => sound.chime(), 650);
    };
    asButton(vCrease, 'Nếp gấp dọc', () => fold('v'));
    asButton(hCrease, 'Nếp gấp ngang', () => fold('h'));
    render();

    return {
      revealHints: (count) => {
        while (hinted.length < count) {
          const next = (['v', 'h'] as const).find((a) => !hinted.includes(a) && !(a === 'v' ? vOn : hOn));
          if (!next) break;
          hinted.push(next);
        }
        return hinted.length;
      },
      hintSteps: (): HintStep[] => {
        const steps: HintStep[] = [];
        if (!vOn) {
          steps.push({
            note: 'Bấm vào nếp gấp dọc để gấp đôi bản đồ: nửa phải lật sang trái.',
            targets: [{ x: CX, y: MAP.y0 + 160, r: 50, verb: 'tap', act: foldDemo(stars, v, h, 1, h) }],
            apply: () => {
              vOn = true;
              v = 1;
              render();
            },
          });
        }
        if (!hOn) {
          steps.push({
            note: 'Bấm vào nếp gấp ngang để gấp tiếp: nửa dưới lật lên trên.',
            targets: [{ x: MAP.x0 + 250, y: CY, r: 50, verb: 'tap', act: foldDemo(stars, 1, h, 1, 1) }],
            apply: () => {
              hOn = true;
              h = 1;
              render();
            },
          });
        }
        steps.push({ note: 'Giấy mỏng nên sao ở các lớp chồng lên nhau và nối thành chòm sao. Đọc từ trái sang phải.', targets: [{ x: 555, y: 290, r: 230, verb: 'look' }] });
        return steps;
      },
      destroy: () => {
        cancelV?.();
        cancelH?.();
      },
    };
  },
};
