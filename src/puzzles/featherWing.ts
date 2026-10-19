import { drawOwl } from '../core/owl';
import type { GlyphId } from '../core/glyphs';
import { glyph, placeStars } from '../core/glyphs';
import { SCENE_H, SCENE_W } from '../core/scene';
import { el, uid } from '../core/svg';
import { url } from '../core/defs';
import { clamp } from '../core/tween';
import { dist, seeded } from './sky';
import type { HintStep, PuzzleDef } from './types';

/**
 * Chapter 2, level 1 — the owl's wing ("lông cánh"). A paper wing on the wall has three
 * hollows shaped like feathers, and three loose feathers stand in jars below. Each feather
 * is speckled; when it sits in its own hollow its speckles join the wing's speckles and a
 * constellation made of plain dots is there to be imagined. No lines, no glow, no chime.
 * Read the feathers by their dark bars: one bar first, then two, then three.
 */

export interface FeatherDef {
  glyph: GlyphId;
  /** Positions of the dark bars, measured along the feather from its base. One bar, two bars, three. */
  bars: readonly number[];
  length: number;
  width: number;
  /** The base of the hollow, and the tilt (degrees, clockwise) shared by feather and hollow. */
  slot: { x: number; y: number };
  rot: number;
  /** Where the loose feather stands in its jar (its base). */
  start: { x: number; y: number };
  /** Centre and size of the constellation when the feather is in place. */
  centre: { x: number; y: number };
  size: number;
}

/** Left to right on the wing; the answer reads them by bars instead. */
export const FEATHERS: readonly FeatherDef[] = [
  { glyph: 'triangle', bars: [160, 200], length: 340, width: 120, slot: { x: 560, y: 650 }, rot: -6, start: { x: 270, y: 872 }, centre: { x: 560, y: 650 }, size: 180 },
  { glyph: 'hook', bars: [70, 110, 150], length: 420, width: 130, slot: { x: 800, y: 650 }, rot: 0, start: { x: 150, y: 862 }, centre: { x: 800, y: 330 }, size: 180 },
  { glyph: 'crown', bars: [215], length: 270, width: 110, slot: { x: 1040, y: 650 }, rot: 6, start: { x: 1450, y: 866 }, centre: { x: 1048, y: 514 }, size: 180 },
];

/** A loose feather snaps into its hollow when its base is dropped this close. */
export const SNAP_R = 70;
/** Speckles are all this size, whether they belong to a constellation or not. */
export const DOT_R = 9;
export const PANEL = { x: 400, y: 130, w: 800, h: 630 };

/** Half the feather's width at `t` (0 at the base, 1 at the tip). */
export const halfWidth = (t: number, width: number): number => (width / 2) * Math.sin(Math.PI * Math.pow(clamp(t, 0, 1), 0.75));

/** A scene point in the frame of feather `f` sitting in its hollow: u across, v along from the base. */
export function featherFrame(f: FeatherDef, x: number, y: number): { u: number; v: number } {
  const dx = x - f.slot.x;
  const dy = f.slot.y - y; // up is positive
  const r = (f.rot * Math.PI) / 180;
  return { u: dx * Math.cos(r) - dy * Math.sin(r), v: dx * Math.sin(r) + dy * Math.cos(r) };
}

export type Footprint = 'in' | 'edge' | 'out';

/** Is the point well inside the feather's shape, well outside it, or too close to its edge to say? */
export function footprint(f: FeatherDef, x: number, y: number, margin = 12): Footprint {
  const { u, v } = featherFrame(f, x, y);
  return footprintLocal(f, u, v, margin);
}

function footprintLocal(f: FeatherDef, u: number, v: number, margin: number): Footprint {
  if (v < -margin || v > f.length + margin) return 'out';
  if (v < margin || v > f.length - margin) return 'edge';
  const h = halfWidth(v / f.length, f.width);
  if (Math.abs(u) <= h - margin) return 'in';
  if (Math.abs(u) >= h + margin) return 'out';
  return 'edge';
}

/** All the stars of a feather's constellation, in scene coordinates. */
export const constellationStars = (f: FeatherDef): [number, number][] => placeStars(f.glyph, f.centre.x, f.centre.y, f.size);

/** Which stars of the constellation sit on the feather (the rest are printed on the wing). */
export const carriedStars = (f: FeatherDef): number[] =>
  constellationStars(f).flatMap(([x, y], i) => (footprint(f, x, y) === 'in' ? [i] : []));

/** The answer: constellations in order of how many bars their feather has. */
export const READING_ORDER: readonly number[] = FEATHERS.map((_, i) => i).sort((a, b) => FEATHERS[a].bars.length - FEATHERS[b].bars.length);

export const isPlaced = (f: FeatherDef, x: number, y: number): boolean => dist(x, y, f.slot.x, f.slot.y) < 1;
export const nearSlot = (f: FeatherDef, x: number, y: number): boolean => dist(x, y, f.slot.x, f.slot.y) <= SNAP_R;

/** Stars of feather i's constellation showing for the given feather positions (wing stars always, carried ones once placed). */
export function shownStars(i: number, pos: readonly (readonly [number, number])[]): number[] {
  const f = FEATHERS[i];
  const carried = carriedStars(f);
  const placed = isPlaced(f, pos[i][0], pos[i][1]);
  return constellationStars(f).flatMap((_, s) => (placed || !carried.includes(s) ? [s] : []));
}

/** Constellations that are whole at the moment: all their stars showing. */
export const completeConstellations = (pos: readonly (readonly [number, number])[]): number[] =>
  FEATHERS.flatMap((f, i) => (shownStars(i, pos).length === constellationStars(f).length ? [i] : []));

// --- Speckles that belong to no constellation. Generated once, the same on every visit.

function featherPath(f: FeatherDef): string {
  const n = 28;
  const right: string[] = [];
  const left: string[] = [];
  for (let k = 0; k <= n; k += 1) {
    const t = k / n;
    const h = halfWidth(t, f.width);
    right.push(`${h.toFixed(1)} ${(-t * f.length).toFixed(1)}`);
    left.unshift(`${(-h).toFixed(1)} ${(-t * f.length).toFixed(1)}`);
  }
  return `M0 0 L${right.join(' L')} L${left.join(' L')} Z`;
}

const START_POS: readonly [number, number][] = FEATHERS.map((f) => [f.start.x, f.start.y]);

/** Speckles printed on the wing panel, away from every hollow and every constellation star. */
export const PANEL_DECOYS: readonly [number, number][] = (() => {
  const rand = seeded(2101);
  const stars = FEATHERS.flatMap(constellationStars);
  const out: [number, number][] = [];
  for (let tries = 0; tries < 4000 && out.length < 8; tries += 1) {
    const x = PANEL.x + 50 + rand() * (PANEL.w - 100);
    const y = PANEL.y + 60 + rand() * (PANEL.h - 110);
    if (FEATHERS.some((f) => footprint(f, x, y, 26) !== 'out')) continue;
    if (stars.some(([sx, sy]) => dist(x, y, sx, sy) < 100)) continue;
    if (out.some(([ox, oy]) => dist(x, y, ox, oy) < 120)) continue;
    out.push([x, y]);
  }
  return out;
})();

/** Speckles on each feather in its own frame (u across, v along), clear of its bars and stars. */
export const FEATHER_DECOYS: readonly (readonly [number, number])[][] = FEATHERS.map((f, i) => {
  const rand = seeded(77 + i * 31);
  const carried = carriedStars(f).map((s) => {
    const [x, y] = constellationStars(f)[s];
    const { u, v } = featherFrame(f, x, y);
    return [u, v] as const;
  });
  const out: [number, number][] = [];
  for (let tries = 0; tries < 4000 && out.length < (i === 1 ? 2 : 1); tries += 1) {
    const v = 30 + rand() * (f.length - 60);
    const u = (rand() * 2 - 1) * halfWidth(v / f.length, f.width);
    if (footprintLocal(f, u, v, 18) !== 'in') continue;
    if (f.bars.some((b) => Math.abs(b - v) < 26)) continue;
    if (carried.some(([cu, cv]) => dist(u, v, cu, cv) < 44)) continue;
    if (out.some(([ou, ov]) => dist(u, v, ou, ov) < 50)) continue;
    out.push([u, v]);
  }
  return out;
});

export const featherWing: PuzzleDef = {
  id: 'feather-wing',
  name: 'Lông cánh',
  answer: READING_ORDER.map((i) => FEATHERS[i].glyph),
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    const pos = START_POS.map(([x, y]) => [x, y] as [number, number]);
    const colours = { panel: '#6a5240', edge: '#8c7054', feather: '#b39366', ink: '#2b1d14', dot: '#fff3d0', hole: '#150f0d' };

    // Back: the attic wall, planks and a shelf for the jars.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#241a17' }, back);
    for (let x = 80; x < SCENE_W; x += 160) el('line', { x1: x, y1: -20, x2: x, y2: SCENE_H + 20, stroke: '#1a1210', 'stroke-width': 4 }, back);
    el('rect', { x: -60, y: 868, width: SCENE_W + 120, height: 80, fill: '#3a2a22' }, back);
    scene.grain('back', 0.4);

    // Mid: the wing panel with its three feather-shaped hollows, and the speckles printed on it.
    const bottom = PANEL.y + PANEL.h;
    const left = PANEL.x;
    const right = PANEL.x + PANEL.w;
    const scallops: string[] = [];
    for (let x = right; x > left; x -= 160) scallops.push(`Q${x - 80} ${bottom + 52} ${x - 160} ${bottom}`);
    const wing = `M${left} ${bottom} C${left - 50} ${bottom - 140} ${left - 40} ${PANEL.y + 200} ${left + 80} ${PANEL.y + 70} `
      + `C${left + 180} ${PANEL.y - 10} ${right - 180} ${PANEL.y - 10} ${right - 80} ${PANEL.y + 70} `
      + `C${right + 40} ${PANEL.y + 200} ${right + 50} ${bottom - 140} ${right} ${bottom} ${scallops.join(' ')} Z`;
    el('path', { d: wing, fill: colours.panel, stroke: colours.edge, 'stroke-width': 6, 'stroke-linejoin': 'round' }, mid);
    const shape = FEATHERS.map(featherPath);
    FEATHERS.forEach((f, i) => {
      el('path', {
        d: shape[i], class: 'feather-slot', fill: colours.hole, stroke: colours.edge, 'stroke-width': 3, 'stroke-dasharray': '10 8',
        transform: `translate(${f.slot.x} ${f.slot.y}) rotate(${f.rot})`,
      }, mid);
    });
    const printed = el('g', { 'pointer-events': 'none' }, mid);
    for (const [x, y] of PANEL_DECOYS) el('circle', { cx: x, cy: y, r: DOT_R, fill: colours.dot }, printed);
    for (const f of FEATHERS) {
      const carried = carriedStars(f);
      constellationStars(f).forEach(([x, y], s) => {
        if (!carried.includes(s)) el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: DOT_R, fill: colours.dot }, printed);
      });
    }

    // The loose feathers: an outer group moves, the inner one carries the tilt.
    const layer = el('g', {}, mid);
    const nodes = FEATHERS.map((f, i) => {
      const outer = el('g', {
        class: 'feather interactive', tabindex: 0, role: 'button', 'aria-label': `Lông vũ ${i + 1}`, 'data-hint': `feather-${i}`,
      }, layer);
      const inner = el('g', { transform: `rotate(${f.rot})` }, outer);
      const clipId = uid('feather-clip');
      el('path', { d: shape[i] }, el('clipPath', { id: clipId }, scene.defs));
      el('path', { d: shape[i], fill: colours.feather, stroke: colours.edge, 'stroke-width': 3, 'stroke-linejoin': 'round' }, inner);
      const bars = el('g', { 'clip-path': url(clipId), 'pointer-events': 'none' }, inner);
      for (const v of f.bars) {
        el('line', { x1: -f.width, y1: -v, x2: f.width, y2: -v, stroke: colours.ink, 'stroke-width': 13 }, bars);
      }
      el('line', { x1: 0, y1: 0, x2: 0, y2: -f.length * 0.96, stroke: '#7a5c3a', 'stroke-width': 3, 'stroke-linecap': 'round', 'pointer-events': 'none' }, inner);
      const dots = el('g', { 'pointer-events': 'none' }, inner);
      for (const s of carriedStars(f)) {
        const [x, y] = constellationStars(f)[s];
        const { u, v } = featherFrame(f, x, y);
        el('circle', { cx: u.toFixed(1), cy: (-v).toFixed(1), r: DOT_R, fill: colours.dot }, dots);
      }
      for (const [u, v] of FEATHER_DECOYS[i]) el('circle', { cx: u.toFixed(1), cy: (-v).toFixed(1), r: DOT_R, fill: colours.dot }, dots);
      return outer;
    });

    // Front: the jars the feathers stand in, and the owl.
    for (const [x, w] of [[220, 300], [1450, 190]] as const) {
      el('path', { d: `M${x - w / 2} 826 H${x + w / 2} L${x + w / 2 - 14} 896 H${x - w / 2 + 14} Z`, fill: '#4b3a47', stroke: '#6a5470', 'stroke-width': 4, 'pointer-events': 'none' }, front);
    }
    drawOwl(front, 1180, 846, 0.7);

    const render = (i: number) => nodes[i].setAttribute('transform', `translate(${pos[i][0].toFixed(1)} ${pos[i][1].toFixed(1)})`);
    /** Drops the feather into its hollow when it is close; true if it went in. */
    const trySnap = (i: number): boolean => {
      const f = FEATHERS[i];
      if (isPlaced(f, pos[i][0], pos[i][1]) || !nearSlot(f, pos[i][0], pos[i][1])) return false;
      pos[i] = [f.slot.x, f.slot.y];
      render(i);
      return true;
    };

    nodes.forEach((g, i) => {
      let grab = [0, 0];
      scene.draggable(g, {
        start: (p) => {
          grab = [p.x - pos[i][0], p.y - pos[i][1]];
          layer.appendChild(g);
        },
        move: (p) => {
          pos[i] = [clamp(p.x - grab[0], 0, SCENE_W), clamp(p.y - grab[1], 60, SCENE_H + 40)];
          render(i);
        },
        end: () => {
          if (trySnap(i)) sound.knock();
          else sound.paper();
        },
      });
      g.addEventListener('keydown', (event) => {
        const moves: Record<string, [number, number]> = { ArrowLeft: [-40, 0], ArrowRight: [40, 0], ArrowUp: [0, -40], ArrowDown: [0, 40] };
        const m = moves[event.key];
        if (!m) return;
        event.preventDefault();
        pos[i] = [clamp(pos[i][0] + m[0], 0, SCENE_W), clamp(pos[i][1] + m[1], 60, SCENE_H + 40)];
        render(i);
        if (trySnap(i)) sound.knock();
      });
      render(i);
    });

    return {
      // Nothing is marked in the scene; the hint card shows the whole solution instead.
      revealHints: () => 0,
      hintSteps: (): HintStep[] => {
        const first = FEATHERS[READING_ORDER[0]];
        const grabAt = (f: FeatherDef, at: { x: number; y: number }) => {
          const r = (f.rot * Math.PI) / 180;
          return { x: at.x + Math.sin(r) * f.length * 0.4, y: at.y - Math.cos(r) * f.length * 0.4 };
        };
        const firstIndex = READING_ORDER[0];
        return [
          {
            note: 'Kéo lông vũ vào chỗ trống cùng hình với nó. Làm tương tự với hai chiếc còn lại.',
            targets: [{ ...grabAt(first, first.start), r: 80, verb: 'drag', to: grabAt(first, first.slot), object: `[data-hint="feather-${firstIndex}"]` }],
            apply: () => {
              FEATHERS.forEach((f, i) => {
                pos[i] = [f.slot.x, f.slot.y];
                render(i);
              });
            },
          },
          {
            note: 'Các chấm trên lông nối với chấm trên cánh. Tự nối chúng trong đầu, rồi đọc theo số vạch sẫm: ít vạch trước.',
            targets: READING_ORDER.map((i) => ({ x: FEATHERS[i].centre.x, y: FEATHERS[i].centre.y, r: FEATHERS[i].size * 0.7, verb: 'look' as const })),
            prepare: (picture) => {
              const overlay = picture.querySelector('.layer-overlay') ?? picture;
              for (const f of FEATHERS) {
                const stars = constellationStars(f);
                for (const [a, b] of glyph(f.glyph).lines) {
                  el('line', { x1: stars[a][0], y1: stars[a][1], x2: stars[b][0], y2: stars[b][1], class: 'hint-line', 'pointer-events': 'none' }, overlay);
                }
              }
            },
          },
        ];
      },
      destroy: () => undefined,
    };
  },
};
