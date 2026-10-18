import { url } from '../core/defs';
import { glyph, placeStars, type GlyphId } from '../core/glyphs';
import { drawOwl } from '../core/owl';
import { SCENE_H, SCENE_W } from '../core/scene';
import { el, uid } from '../core/svg';
import { clamp, easeInOutSine, tween } from '../core/tween';
import { dist, seeded, starfield } from './sky';
import type { HintStep, PuzzleDef } from './types';

/**
 * Chapter 5, level 5 — the reversed binoculars ("ống nhòm ngược"). Out of the train window lies a
 * round valley far wider than anything the binoculars can show: used the right way round they
 * magnify, and all you find is the roofs of one village at a time, each with its lit windows. Turn
 * the binoculars round and they shrink the whole valley into the lens: every village becomes one
 * warm dot, and four of them groups make constellations. A railway wanders through the valley from the
 * engine at one end to the buffers at the other; the constellations are read in the order the rail
 * reaches them from the engine.
 */

export const WORLD_R = 2300;
export const LENS = { x: 800, y: 450, r: 330 };
/** Magnifying (the right way round) and shrinking (reversed) scales, in screen units per world unit. */
export const SCALE_FWD = 1.6;
/** The whole valley, with a little room round it, just fits in the lens. */
export const SCALE_MIN = LENS.r / (WORLD_R + 100);
/** Scale at a zoom position: 1 is fully magnified, 0 shows the whole valley (the path between is logarithmic). */
export const scaleAt = (u: number): number => Math.exp(Math.log(SCALE_MIN) + (Math.log(SCALE_FWD) - Math.log(SCALE_MIN)) * clamp(u, 0, 1));
export const zoomOf = (scale: number): number => (Math.log(scale) - Math.log(SCALE_MIN)) / (Math.log(SCALE_FWD) - Math.log(SCALE_MIN));
/** The barrel swings over as the zoom passes the middle: the width factor of the tube (1 right way round, -1 reversed). */
export const barrelFlip = (u: number): number => clamp((u - 0.5) * 8, -1, 1);
/** The zoom slider on the wall: the thumb is up when magnified, down when the whole valley shows. */
export const ZOOM = { x: 1500, top: 230, bottom: 700 };
export const yOfZoom = (u: number): number => ZOOM.bottom - clamp(u, 0, 1) * (ZOOM.bottom - ZOOM.top);
export const zoomAtY = (y: number): number => clamp((ZOOM.bottom - y) / (ZOOM.bottom - ZOOM.top), 0, 1);

export interface Chom {
  glyph: GlyphId;
  x: number;
  y: number;
  size: number;
}
/** The four constellations, in the order the rail reaches them from the engine. */
export const CHOMS: readonly Chom[] = [
  { glyph: 'square', x: -1050, y: -650, size: 1100 },
  { glyph: 'dipper', x: 1050, y: -650, size: 1500 },
  { glyph: 'triangle', x: 1000, y: 700, size: 1200 },
  { glyph: 'crown', x: -1000, y: 700, size: 1400 },
];

/** Control points of the railway, from the engine to the buffers. */
export const RAIL_CONTROLS: readonly (readonly [number, number])[] = [
  [-2150, -250], [-1700, -420], [-1050, -650], [-200, -560], [600, -420], [1470, -330], [1480, 100], [1000, 780],
  [400, 900], [-300, 830], [-1000, 800], [-1700, 880], [-2100, 700],
];

/** The railway sampled into a dense polyline (Catmull–Rom through the control points). */
export function railPoints(): [number, number][] {
  const p = RAIL_CONTROLS;
  const out: [number, number][] = [];
  for (let i = 0; i < p.length - 1; i += 1) {
    const a = p[Math.max(0, i - 1)];
    const b = p[i];
    const c = p[i + 1];
    const d = p[Math.min(p.length - 1, i + 2)];
    for (let k = 0; k < 24; k += 1) {
      const t = k / 24;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (u0: number, u1: number, u2: number, u3: number) => 0.5 * (2 * u1 + (-u0 + u2) * t + (2 * u0 - 5 * u1 + 4 * u2 - u3) * t2 + (-u0 + 3 * u1 - 3 * u2 + u3) * t3);
      out.push([f(a[0], b[0], c[0], d[0]), f(a[1], b[1], c[1], d[1])]);
    }
  }
  out.push([...p[p.length - 1]] as [number, number]);
  return out;
}
export const RAIL: readonly (readonly [number, number])[] = railPoints();

/** Where along the rail (index into RAIL) a world point is nearest, and how far away. */
export function nearestOnRail(x: number, y: number): { index: number; distance: number } {
  let best = { index: 0, distance: Infinity };
  RAIL.forEach(([rx, ry], index) => {
    const d = dist(x, y, rx, ry);
    if (d < best.distance) best = { index, distance: d };
  });
  return best;
}

/**
 * What a village looks like. The villages of one constellation all share a signature (how many houses,
 * the colour of their lamps and the size of the dot they make from afar), so the player can tell which
 * dots belong together. Loose villages use the same four signatures, so a signature alone is not enough
 * and the shape still has to be found.
 */
export interface Signature {
  houses: number;
  /** Radius, in world units, of the dot the village shrinks to. */
  dot: number;
  colour: string;
}
export const SIGNATURES: readonly Signature[] = [
  { houses: 3, dot: 40, colour: '#cfe8ff' },
  { houses: 4, dot: 50, colour: '#ffe9a8' },
  { houses: 5, dot: 60, colour: '#ffc27a' },
  { houses: 6, dot: 70, colour: '#d4ffb8' },
];
/** The signature of each constellation's villages, by index into CHOMS (not in the order of the rail). */
export const CHOM_SIGNATURE: readonly number[] = [2, 0, 3, 1];

export interface Village {
  x: number;
  y: number;
  /** Index into CHOMS for a star of a constellation, -1 for a village on its own. */
  chom: number;
  /** Index into SIGNATURES. */
  sig: number;
}

export const chomStars = (k: number): [number, number][] => placeStars(CHOMS[k].glyph, CHOMS[k].x, CHOMS[k].y, CHOMS[k].size);
export const LOOSE_COUNT = 12;

function makeVillages(): Village[] {
  const out: Village[] = CHOMS.flatMap((_, k) => chomStars(k).map(([x, y]) => ({ x, y, chom: k, sig: CHOM_SIGNATURE[k] })));
  const fixed = out.length;
  const rand = seeded(5505);
  let tries = 0;
  while (out.length < fixed + LOOSE_COUNT && tries < 60000) {
    tries += 1;
    const a = rand() * Math.PI * 2;
    const r = Math.sqrt(rand()) * (WORLD_R - 260);
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (out.some((v) => dist(v.x, v.y, x, y) < (v.chom >= 0 ? 520 : 440))) continue;
    if (nearestOnRail(x, y).distance < 130) continue;
    out.push({ x, y, chom: -1, sig: (out.length - fixed) % SIGNATURES.length });
  }
  return out;
}
export const VILLAGES: readonly Village[] = makeVillages();
/** Where the player first looks: a village that is not part of a constellation, near the middle. */
export const START_CENTER: { x: number; y: number } = (() => {
  const loose = VILLAGES.filter((v) => v.chom < 0).sort((a, b) => Math.hypot(a.x, a.y) - Math.hypot(b.x, b.y));
  return { x: loose[0].x, y: loose[0].y };
})();

/** Villages whose centre is inside the lens when it looks at `center` at `scale`. */
export const villagesInLens = (center: { x: number; y: number }, scale: number): number[] =>
  VILLAGES.flatMap((v, i) => (dist(v.x, v.y, center.x, center.y) * scale <= LENS.r ? [i] : []));

/** Keeps the lens inside the valley: the further out it zooms, the less it can move (none at all with the whole valley showing). */
export function clampCenter(c: { x: number; y: number }, scale: number = SCALE_FWD): { x: number; y: number } {
  const d = Math.hypot(c.x, c.y);
  const max = Math.max(0, WORLD_R + 100 - LENS.r / scale);
  return d > max ? { x: (c.x / d) * max, y: (c.y / d) * max } : c;
}

/** The order the rail reaches the constellations, as indices into CHOMS (nearest rail point to each one's middle). */
export const railOrder = (): number[] => CHOMS.map((c, k) => ({ k, at: nearestOnRail(c.x, c.y).index })).sort((a, b) => a.at - b.at).map(({ k }) => k);

const ease = easeInOutSine;
/** The view (centre and scale) at progress 0..1 of a flip from `a` to `b`: the scale moves on a logarithmic path. */
export function viewBetween(
  a: { x: number; y: number; scale: number },
  b: { x: number; y: number; scale: number },
  t: number,
): { x: number; y: number; scale: number } {
  const k = ease(clamp(t, 0, 1));
  return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, scale: Math.exp(Math.log(a.scale) + (Math.log(b.scale) - Math.log(a.scale)) * k) };
}
export const worldTransform = (v: { x: number; y: number; scale: number }): string =>
  `translate(${LENS.x} ${LENS.y}) scale(${v.scale.toFixed(4)}) translate(${(-v.x).toFixed(1)} ${(-v.y).toFixed(1)})`;

/** Where a world point lands on the screen for a view. */
export const toScreen = (p: { x: number; y: number }, v: { x: number; y: number; scale: number }): { x: number; y: number } => ({
  x: LENS.x + (p.x - v.x) * v.scale,
  y: LENS.y + (p.y - v.y) * v.scale,
});

/** A press that moves less than this (in scene units) is a tap. */
export const TAP_DISTANCE = 14;
/** How much of the houses (1) rather than the single glowing dot (0) a village shows at this scale. */
export const houseDetail = (scale: number): number => clamp((scale - 0.3) / 0.5, 0, 1);

/** Shows the villages as houses when magnified and as one dot when shrunk, in the scene or in a copy of it. */
export function paintDetail(root: ParentNode, scale: number): void {
  const k = houseDetail(scale);
  root.querySelectorAll('[data-role="houses"]').forEach((n) => n.setAttribute('opacity', k.toFixed(3)));
  root.querySelectorAll('[data-role="dot"]').forEach((n) => n.setAttribute('opacity', (1 - k).toFixed(3)));
}

/** The whole look of the lens at a zoom position (world, villages, barrel), in the scene or in a copy of it. */
export function paintZoom(root: ParentNode, focus: { x: number; y: number }, u: number): void {
  const scale = scaleAt(u);
  const c = clampCenter(focus, scale);
  root.querySelector('[data-hint="world"]')?.setAttribute('transform', worldTransform({ ...c, scale }));
  root.querySelector('[data-hint="tube"]')?.setAttribute('transform', `translate(${LENS.x} ${LENS.y}) scale(${barrelFlip(u).toFixed(3)} 1)`);
  paintDetail(root, scale);
}

/** The whole valley in the lens. */
const FAR_VIEW = { x: 0, y: 0, scale: SCALE_MIN };
/** Timing of a drag in the hint picture: rest, slide, hold. */
const slide = (p: number): number => (p < 0.2 ? 0 : p > 0.75 ? 1 : easeInOutSine((p - 0.2) / 0.55));

export const reverseBinoculars: PuzzleDef = {
  id: 'reverse-binoculars',
  name: 'Ống nhòm ngược',
  answer: CHOMS.map((c) => c.glyph),
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    /** Where the lens is looking (before it is held inside the valley) and how far it is zoomed (1 magnified, 0 the whole valley). */
    let focus = { ...START_CENTER };
    let zoom = 1;
    let cancel = () => {};

    // Back: the compartment, a window onto the dark valley.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#1c1626' }, back);
    el('rect', { x: 180, y: 60, width: 1240, height: 780, rx: 40, fill: '#0b1030', stroke: '#3a2c3a', 'stroke-width': 24 }, back);
    starfield(back, { x: 200, y: 80, w: 1200, h: 740 }, 70, 505);
    scene.grain('back', 0.35);

    // The valley, seen only through the lens.
    const clipId = uid('lens');
    el('circle', { cx: LENS.x, cy: LENS.y, r: LENS.r }, el('clipPath', { id: clipId }, scene.defs));
    const glows = SIGNATURES.map((sg) => {
      const id = uid('village-glow');
      const radial = el('radialGradient', { id }, scene.defs);
      el('stop', { offset: 0, 'stop-color': sg.colour, 'stop-opacity': 0.85 }, radial);
      el('stop', { offset: 1, 'stop-color': sg.colour, 'stop-opacity': 0 }, radial);
      return id;
    });
    const tube = el('g', { 'data-hint': 'tube', class: 'interactive', tabindex: 0, role: 'button', 'aria-label': 'Ống nhòm: chạm để lùi ra xa hoặc lại gần', transform: `translate(${LENS.x} ${LENS.y})` }, mid);
    el('path', { d: 'M0 -300 L600 -150 L600 150 L0 300 Z', fill: '#3a3354', stroke: '#241f33', 'stroke-width': 8 }, tube);
    el('rect', { x: 560, y: -170, width: 64, height: 340, rx: 18, fill: '#6b4f24', stroke: '#3a2a10', 'stroke-width': 6 }, tube);
    for (const x of [200, 330, 460]) el('line', { x1: x, y1: -(300 - x / 4), x2: x, y2: 300 - x / 4, stroke: '#2a2540', 'stroke-width': 6 }, tube);
    const lens = el('g', { 'clip-path': url(clipId) }, mid);
    el('circle', { cx: LENS.x, cy: LENS.y, r: LENS.r, fill: '#0c1a1c' }, lens);
    const world = el('g', { 'data-hint': 'world' }, lens);
    el('circle', { cx: 0, cy: 0, r: WORLD_R, fill: '#12262a', stroke: '#2f5a52', 'stroke-width': 30 }, world);
    const rand = seeded(55);
    for (let i = 0; i < 40; i += 1) {
      const a = rand() * Math.PI * 2;
      const r = Math.sqrt(rand()) * (WORLD_R - 200);
      el('ellipse', { cx: Math.cos(a) * r, cy: Math.sin(a) * r, rx: 120 + rand() * 260, ry: 50 + rand() * 120, fill: '#16302f', opacity: 0.7 }, world);
    }
    // The railway: thin lines whatever the zoom.
    const d = RAIL.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(0)} ${y.toFixed(0)}`).join(' ');
    el('path', { d, fill: 'none', stroke: '#1a1722', 'stroke-width': 9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'vector-effect': 'non-scaling-stroke' }, world);
    el('path', { d, fill: 'none', stroke: '#a39cb8', 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'vector-effect': 'non-scaling-stroke' }, world);
    // Engine at the start, buffers at the far end.
    const [ex, ey] = RAIL[0];
    const engine = el('g', { transform: `translate(${ex} ${ey}) scale(1.5)` }, world);
    el('rect', { x: -60, y: -26, width: 120, height: 44, rx: 12, fill: '#3b3f6a', stroke: '#c9cff5', 'stroke-width': 4 }, engine);
    el('rect', { x: 14, y: -44, width: 40, height: 30, rx: 5, fill: '#4a4f86', stroke: '#c9cff5', 'stroke-width': 4 }, engine);
    el('circle', { cx: -34, cy: -34, r: 9, fill: '#c9cff5', opacity: 0.6 }, engine);
    const [bx, by] = RAIL[RAIL.length - 1];
    const stop = el('g', { transform: `translate(${bx} ${by})` }, world);
    el('rect', { x: -22, y: -60, width: 44, height: 120, rx: 8, fill: '#a8453a', stroke: '#f0e6c8', 'stroke-width': 6 }, stop);
    // The villages: five lit houses around each point.
    const villageRand = seeded(5506);
    VILLAGES.forEach((v) => {
      const g = el('g', { transform: `translate(${v.x.toFixed(1)} ${v.y.toFixed(1)})` }, world);
      const sg = SIGNATURES[v.sig];
      el('circle', { r: 70 + sg.dot * 1.1, fill: url(glows[v.sig]) }, g);
      el('circle', { r: sg.dot, fill: sg.colour, 'data-role': 'dot', opacity: 0 }, g);
      const houses = el('g', { 'data-role': 'houses' }, g);
      for (let i = 0; i < sg.houses; i += 1) {
        const a = villageRand() * Math.PI * 2;
        const r = 14 + villageRand() * 48;
        const hx = Math.cos(a) * r;
        const hy = Math.sin(a) * r;
        el('path', { d: `M${(hx - 14).toFixed(1)} ${(hy + 9).toFixed(1)} h28 v-14 l-14 -12 l-14 12 Z`, fill: '#2a2438', stroke: '#6a5a78', 'stroke-width': 2 }, houses);
        el('rect', { x: (hx - 4).toFixed(1), y: (hy - 3).toFixed(1), width: 8, height: 8, fill: sg.colour }, houses);
      }
    });
    el('circle', { cx: LENS.x, cy: LENS.y, r: LENS.r + 8, fill: 'none', stroke: '#6b4f24', 'stroke-width': 24, 'pointer-events': 'none' }, front);
    el('circle', { cx: LENS.x, cy: LENS.y, r: LENS.r - 6, fill: 'none', stroke: '#ffffff', 'stroke-width': 3, opacity: 0.12, 'pointer-events': 'none' }, front);
    drawOwl(front, 250, 790, 0.9);

    const render = () => paintZoom(scene.root, focus, zoom);

    // The zoom slider on the wall: magnifier at the top, the whole valley (dots) at the bottom.
    const slider = el('g', { class: 'interactive', tabindex: 0, role: 'slider', 'aria-label': 'Núm zoom ống nhòm', 'aria-valuemin': 0, 'aria-valuemax': 100 }, front);
    el('rect', { x: ZOOM.x - 56, y: ZOOM.top - 100, width: 112, height: ZOOM.bottom - ZOOM.top + 200, rx: 36, fill: '#3a3354', stroke: '#6b4f24', 'stroke-width': 5 }, slider);
    el('rect', { x: ZOOM.x - 10, y: ZOOM.top - 14, width: 20, height: ZOOM.bottom - ZOOM.top + 28, rx: 10, fill: '#1a1424' }, slider);
    const mag = el('g', { transform: `translate(${ZOOM.x} ${ZOOM.top - 56})`, fill: 'none', stroke: '#f6efd8', 'stroke-width': 5, 'stroke-linecap': 'round', 'pointer-events': 'none' }, slider);
    el('circle', { cx: -3, cy: -3, r: 15 }, mag);
    el('path', { d: 'M8 8 L20 20 M-3 -10 V4 M-10 -3 H4' }, mag);
    const far = el('g', { transform: `translate(${ZOOM.x} ${ZOOM.bottom + 56})`, fill: '#ffe9a8', 'pointer-events': 'none' }, slider);
    for (const [dx, dy] of [[-14, -10], [10, -14], [-4, 6], [16, 8], [-18, 14]]) el('circle', { cx: dx, cy: dy, r: 4.5 }, far);
    const thumb = el('g', { 'data-hint': 'zoom-thumb', 'pointer-events': 'none' }, slider);
    el('rect', { x: ZOOM.x - 38, y: -24, width: 76, height: 48, rx: 14, fill: '#ead3a0', stroke: '#8a6a3a', 'stroke-width': 4 }, thumb);
    for (const dy of [-8, 0, 8]) el('line', { x1: ZOOM.x - 22, y1: dy, x2: ZOOM.x + 22, y2: dy, stroke: '#8a6a3a', 'stroke-width': 3, 'stroke-linecap': 'round' }, thumb);

    const paintSlider = () => {
      thumb.setAttribute('transform', `translate(0 ${yOfZoom(zoom).toFixed(1)})`);
      slider.setAttribute('aria-valuenow', String(Math.round(zoom * 100)));
    };
    const show = () => {
      render();
      paintSlider();
    };
    const setZoom = (u: number) => {
      cancel();
      zoom = clamp(u, 0, 1);
      show();
    };
    /** Glides to the far end (the whole valley) or the near one (magnified). */
    const glideTo = (target: number) => {
      cancel();
      const from = zoom;
      sound.knock();
      cancel = tween(900, (t) => {
        zoom = from + (target - from) * t;
        show();
      }, easeInOutSine);
    };
    const toggle = () => glideTo(zoom > 0.5 ? 0 : 1);
    scene.draggable(slider, {
      start: (p) => setZoom(zoomAtY(p.y)),
      move: (p) => setZoom(zoomAtY(p.y)),
    });
    slider.addEventListener('keydown', (event) => {
      const step = { ArrowUp: 0.06, ArrowRight: 0.06, ArrowDown: -0.06, ArrowLeft: -0.06 }[event.key];
      if (!step) return;
      event.preventDefault();
      setZoom(zoom + step);
    });
    tube.addEventListener('click', toggle);
    tube.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggle();
      }
    });

    // On the lens: drag to look around, tap to glide between the two ends, the wheel (or + and -) to zoom.
    const pane = el('circle', { cx: LENS.x, cy: LENS.y, r: LENS.r, fill: 'transparent', class: 'interactive', tabindex: 0, role: 'application', 'aria-label': 'Ống nhòm: kéo để nhìn quanh, chạm để lùi ra xa hoặc lại gần' }, front);
    let grab = { x: 0, y: 0, fx: 0, fy: 0, moved: 0 };
    scene.draggable(pane, {
      start: (p) => {
        cancel();
        grab = { x: p.x, y: p.y, fx: focus.x, fy: focus.y, moved: 0 };
      },
      move: (p) => {
        grab.moved = Math.max(grab.moved, Math.hypot(p.x - grab.x, p.y - grab.y));
        const scale = scaleAt(zoom);
        focus = clampCenter({ x: grab.fx - (p.x - grab.x) / scale, y: grab.fy - (p.y - grab.y) / scale }, scale);
        render();
      },
      end: () => {
        if (grab.moved < TAP_DISTANCE) toggle();
      },
    });
    pane.addEventListener('wheel', (event) => {
      event.preventDefault();
      setZoom(zoom - event.deltaY * 0.0012);
    }, { passive: false });
    pane.addEventListener('keydown', (event) => {
      if (event.key === '+' || event.key === '=' || event.key === 'PageUp') {
        event.preventDefault();
        setZoom(zoom + 0.08);
        return;
      }
      if (event.key === '-' || event.key === 'PageDown') {
        event.preventDefault();
        setZoom(zoom - 0.08);
        return;
      }
      const step = { ArrowLeft: [-90, 0], ArrowRight: [90, 0], ArrowUp: [0, -90], ArrowDown: [0, 90] }[event.key];
      if (!step) return;
      event.preventDefault();
      const scale = scaleAt(zoom);
      focus = clampCenter({ x: focus.x + step[0], y: focus.y + step[1] }, scale);
      render();
    });
    show();

    return {
      revealHints: () => 0,
      hintSteps: (): HintStep[] => {
        const start = { ...focus };
        const z0 = zoom;
        return [
          {
            note: 'Qua ống nhòm chỉ thấy từng làng một, quá gần để thấy cả hình. Kéo núm zoom xuống (hoặc chạm vào kính) để lùi ra xa: thung lũng thu nhỏ dần, mỗi làng thành một chấm sáng và các chòm sao hiện ra.',
            targets: [
              { x: ZOOM.x, y: yOfZoom(z0), r: 60, verb: 'drag', to: { x: ZOOM.x, y: yOfZoom(0) }, object: '[data-hint="zoom-thumb"]' },
              {
                x: LENS.x, y: LENS.y, r: 0, verb: 'look',
                act: (picture) => (p) => paintZoom(picture, start, z0 * (1 - slide(p))),
              },
            ],
            apply: () => setZoom(0),
          },
          {
            note: 'Các làng cùng một chòm giống nhau: cùng số nhà, cùng màu đèn, cùng cỡ chấm. Bốn nhóm làng là bốn chòm sao. Đường ray đi từ đầu máy (ở một đầu) tới các chòm: đọc theo thứ tự đường ray đi qua.',
            targets: CHOMS.map((c) => ({ ...toScreen(c, FAR_VIEW), r: c.size * SCALE_MIN * 0.62, verb: 'look' as const })),
            prepare: (picture) => {
              const overlay = picture.querySelector('.layer-overlay') ?? picture;
              railOrder().forEach((k, n) => {
                const c = CHOMS[k];
                const stars = chomStars(k).map((st) => toScreen({ x: st[0], y: st[1] }, FAR_VIEW));
                for (const [a, b] of glyph(c.glyph).lines) {
                  el('line', { x1: stars[a].x, y1: stars[a].y, x2: stars[b].x, y2: stars[b].y, class: 'hint-line', 'pointer-events': 'none' }, overlay);
                }
                const at = toScreen({ x: c.x, y: c.y }, FAR_VIEW);
                const top = Math.min(...stars.map((st) => st.y));
                const badge = el('g', { transform: `translate(${at.x} ${top - 26})`, 'pointer-events': 'none' }, overlay);
                el('circle', { r: 17, class: 'number-badge' }, badge);
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
