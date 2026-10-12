import { glyph, type GlyphId } from '../core/glyphs';
import { SCENE_H, SCENE_W } from '../core/scene';
import { el, moonPhase, uid } from '../core/svg';
import { clamp, easeInOutSine, tween } from '../core/tween';
import { dist, seeded, skyGradient, starfield } from './sky';
import type { HintStep, PuzzleDef } from './types';

/**
 * Level 11 — the glass of water ("cốc nước"). Behind a tall glass hangs a paper
 * strip whose pictures are squeezed thin and drawn backwards. A round glass of
 * water is a lens that stretches and flips what is behind it: fill the glass and
 * slide each picture behind it to read it.
 */

export const GLASS = { cx: 800, top: 230, bottom: 770, half: 120 };
export const STRIP = { y: 350, h: 290, w: 2600 };
export const WATER_TOP = 300;
/** How much the water stretches the strip sideways. */
export const MAG = 3;
/** Height (and, through the water, width) of a picture. */
export const GLYPH_H = 180;
export const GLYPH_CY = 175;
export const MOON_Y = 42;
export const SNAP = 45;
/** Pictures along the strip (strip x). Only those with a moon count; the others are decoys. */
export const SPOTS: readonly { id: GlyphId; x: number; phase?: number }[] = [
  { id: 'dipper', x: 380, phase: 3 },
  { id: 'arrow', x: 700 },
  { id: 'square', x: 1010, phase: 4 },
  { id: 'crown', x: 1620, phase: 1 },
  { id: 'cross', x: 1930 },
  { id: 'hook', x: 2240, phase: 2 },
];
/** Strip offset (scene x of its left end) at the start: the glass over a blank stretch. */
export const STRIP_START = GLASS.cx - 1310;
export const STRIP_MIN = GLASS.cx - STRIP.w + 200;
export const STRIP_MAX = GLASS.cx - 200;
export const JUG_START: readonly [number, number] = [1300, 640];

/** Where a scene x behind the glass shows up when seen through the water. */
export const throughWater = (x: number): number => GLASS.cx - MAG * (x - GLASS.cx);

/** Star positions of a picture in strip coordinates: squeezed sideways and mirrored, so the water undoes both. */
export function stripStars(id: GlyphId, sx: number): [number, number][] {
  const s = GLYPH_H / 100;
  return glyph(id).stars.map(([x, y]) => [sx - ((x - 50) * s) / MAG, GLYPH_CY + (y - 50) * s]);
}

/** The picture centred behind the glass for this strip offset, or -1. */
export const centredSpot = (stripX: number): number => SPOTS.findIndex((s) => Math.abs(GLASS.cx - stripX - s.x) < 1);

/** On release, a picture close to the glass slides in behind it. */
export function snapStrip(stripX: number): number {
  const near = SPOTS.find((s) => Math.abs(GLASS.cx - stripX - s.x) < SNAP);
  return near ? GLASS.cx - near.x : stripX;
}

/**
 * Scribbles and dots all along the strip so the pictures don't stand out. Behind
 * the glass (near a picture) there are only a few loose dots, clear of its stars,
 * since anything there is seen stretched; spare moons hide which pictures count.
 */
export function stripNoise(): { dots: [number, number][]; lines: [[number, number], [number, number]][]; moons: [number, number][] } {
  const rand = seeded(97);
  const dots: [number, number][] = [];
  const lines: [[number, number], [number, number]][] = [];
  const zone = (x: number) => SPOTS.find((s) => Math.abs(x - s.x) < GLASS.half / MAG + 8);
  for (let i = 0; i < 420; i += 1) {
    const x = 20 + rand() * (STRIP.w - 40);
    const y = 30 + rand() * (STRIP.h - 60);
    const near = zone(x);
    if (near) {
      // Measured as seen through the water, where x is stretched.
      const clear = stripStars(near.id, near.x).every(([sx, sy]) => Math.hypot((x - sx) * MAG, y - sy) > 42) && (near.phase === undefined || y > MOON_Y + 40);
      if (clear && rand() < 0.35) dots.push([x, y]);
    } else if (rand() < 0.5 || SPOTS.some((s) => Math.abs(x - s.x) < 70)) dots.push([x, y]);
    else lines.push([[x, y], [x + (rand() - 0.5) * 30, y + (rand() - 0.5) * 120]]);
  }
  const moons: [number, number][] = [];
  for (const x of [150, 540, 1310, 1780, 2450]) moons.push([x, 1 + Math.floor(rand() * 4)]);
  return { dots, lines, moons };
}

export const isOverGlass = (x: number, y: number): boolean => dist(x, y, GLASS.cx + 60, GLASS.top - 40) < 170;

export const waterGlass: PuzzleDef = {
  id: 'water-glass',
  name: 'Cốc nước',
  answer: SPOTS.filter((s) => s.phase !== undefined).sort((a, b) => (a.phase ?? 0) - (b.phase ?? 0)).map((s) => s.id),
  fireflies: [
    { id: 'water-glass/window', layer: 'back', x: 1460, y: 120 },
    { id: 'water-glass/table', layer: 'front', x: 150, y: 850 },
  ],
  mount({ scene, sound }) {
    const { back, front } = scene.layers;
    let stripX = STRIP_START;
    let water = GLASS.bottom;
    let poured = false;
    let pouring = false;
    let jug: [number, number] = [JUG_START[0], JUG_START[1]];
    const seen = new Set<number>();
    const hinted: ('pour' | number)[] = [];
    let cancelPour: (() => void) | null = null;
    let pourTimer = 0;

    // Back: kitchen wall with a night window, and the table.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#2a2236' }, back);
    el('rect', { x: 1320, y: 40, width: 260, height: 230, rx: 8, fill: skyGradient(scene.defs) }, back);
    starfield(back, { x: 1330, y: 50, w: 240, h: 210 }, 26, 61);
    el('rect', { x: 1320, y: 40, width: 260, height: 230, rx: 8, fill: 'none', stroke: '#4a3a52', 'stroke-width': 12 }, back);
    el('line', { x1: 1450, y1: 40, x2: 1450, y2: 270, stroke: '#4a3a52', 'stroke-width': 8 }, back);
    el('rect', { x: -60, y: GLASS.bottom, width: SCENE_W + 120, height: SCENE_H - GLASS.bottom + 60, fill: '#5a3e2c' }, back);
    el('rect', { x: -60, y: GLASS.bottom, width: SCENE_W + 120, height: 12, fill: '#6e4c36' }, back);
    scene.grain('back', 0.4);

    // Front: the strip (draggable), then the glass and its water view, then the jug.
    const stripId = uid('strip');
    const strip = el('g', { id: stripId, class: 'paper-strip interactive', tabindex: 0, role: 'slider', 'aria-label': 'Dải giấy' }, front);
    el('rect', { width: STRIP.w, height: STRIP.h, fill: '#efe6cf', stroke: '#b9a27f', 'stroke-width': 3 }, strip);
    el('line', { x1: 0, y1: 12, x2: STRIP.w, y2: 12, stroke: '#c9b48c', 'stroke-width': 2 }, strip);
    el('line', { x1: 0, y1: STRIP.h - 12, x2: STRIP.w, y2: STRIP.h - 12, stroke: '#c9b48c', 'stroke-width': 2 }, strip);
    const ink = el('g', { class: 'strip-ink' }, strip);
    const squeezedDot = (x: number, y: number, r: number) => el('ellipse', { cx: x.toFixed(1), cy: y.toFixed(1), rx: (r / MAG).toFixed(2), ry: r }, ink);
    const squeezedLine = (a: readonly [number, number], b: readonly [number, number]) =>
      el('line', { x1: a[0].toFixed(1), y1: a[1].toFixed(1), x2: b[0].toFixed(1), y2: b[1].toFixed(1), 'vector-effect': 'non-scaling-stroke', class: 'strip-line' }, ink);
    const squeezedMoon = (x: number, phase: number) =>
      moonPhase(el('g', { transform: `translate(${x.toFixed(1)} ${MOON_Y}) scale(${-1 / MAG} 1)` }, ink), phase, 0, 0, 20, { class: 'moon-phase ink' });
    // Stars only, no joining lines: squeezed lines would still read as a W or an arrow.
    for (const s of SPOTS) {
      for (const [x, y] of stripStars(s.id, s.x)) squeezedDot(x, y, 8);
      if (s.phase !== undefined) squeezedMoon(s.x, s.phase);
    }
    const noise = stripNoise();
    for (const [x, y] of noise.dots) squeezedDot(x, y, 4 + ((x * 13) % 4));
    for (const [a, b] of noise.lines) squeezedLine(a, b);
    for (const [x, phase] of noise.moons) squeezedMoon(x, phase);
    const markers = SPOTS.map((s) => el('path', { d: `M${s.x} ${STRIP.h + 6} l-14 22 l28 0 Z`, class: 'hint-tick', opacity: 0 }, strip));

    const glassG = el('g', { 'pointer-events': 'none' }, front);
    el('rect', { x: GLASS.cx - GLASS.half, y: GLASS.top, width: GLASS.half * 2, height: GLASS.bottom - GLASS.top, class: 'glass-body' }, glassG);
    const clipId = uid('water');
    const waterClip = el('rect', { x: GLASS.cx - GLASS.half, width: GLASS.half * 2 }, el('clipPath', { id: clipId }, scene.defs));
    const waterView = el('g', { 'clip-path': `url(#${clipId})` }, glassG);
    el('rect', { x: GLASS.cx - GLASS.half, y: GLASS.top, width: GLASS.half * 2, height: GLASS.bottom - GLASS.top, fill: '#2a2236' }, waterView);
    el('use', { href: `#${stripId}`, transform: `matrix(${-MAG} 0 0 1 ${(MAG + 1) * GLASS.cx} 0)` }, waterView);
    el('rect', { x: GLASS.cx - GLASS.half, y: GLASS.top, width: GLASS.half * 2, height: GLASS.bottom - GLASS.top, class: 'water-tint' }, waterView);
    const surface = el('ellipse', { cx: GLASS.cx, rx: GLASS.half, ry: 12, class: 'water-surface' }, glassG);
    el('path', { d: `M${GLASS.cx - GLASS.half} ${GLASS.top} L${GLASS.cx - GLASS.half} ${GLASS.bottom} Q${GLASS.cx} ${GLASS.bottom + 26} ${GLASS.cx + GLASS.half} ${GLASS.bottom} L${GLASS.cx + GLASS.half} ${GLASS.top}`, class: 'glass-edge' }, glassG);
    el('ellipse', { cx: GLASS.cx, cy: GLASS.top, rx: GLASS.half, ry: 14, class: 'glass-edge' }, glassG);
    el('line', { x1: GLASS.cx - GLASS.half + 22, y1: GLASS.top + 30, x2: GLASS.cx - GLASS.half + 22, y2: GLASS.bottom - 40, class: 'glass-shine' }, glassG);

    const jugG = el('g', { class: 'jug interactive', tabindex: 0, role: 'button', 'aria-label': 'Bình nước' }, front);
    const jugBody = el('g', {}, jugG);
    el('rect', { x: -90, y: -140, width: 180, height: 270, fill: 'transparent' }, jugBody);
    el('path', { d: 'M-60 -100 L60 -100 L72 120 L-72 120 Z', fill: '#9fb6e0', 'fill-opacity': 0.35, stroke: '#cfe0ff', 'stroke-width': 4 }, jugBody);
    const jugWater = el('path', { d: 'M-66 -10 L66 -10 L72 120 L-72 120 Z', fill: '#5a8ad0', 'fill-opacity': 0.5 }, jugBody);
    el('path', { d: 'M-60 -100 L-92 -126 L-48 -100', fill: '#9fb6e0', stroke: '#cfe0ff', 'stroke-width': 4 }, jugBody);
    el('path', { d: 'M62 -70 Q120 -60 110 10 Q104 50 68 60', fill: 'none', stroke: '#cfe0ff', 'stroke-width': 10 }, jugBody);
    const stream = el('path', { class: 'water-stream' }, front);
    stream.style.display = 'none';

    const render = () => {
      strip.setAttribute('transform', `translate(${stripX.toFixed(1)} ${STRIP.y})`);
      strip.setAttribute('aria-valuenow', String(Math.round(GLASS.cx - stripX)));
      waterClip.setAttribute('y', water.toFixed(1));
      waterClip.setAttribute('height', Math.max(0, GLASS.bottom - water + 20).toFixed(1));
      surface.setAttribute('cy', water.toFixed(1));
      surface.style.display = water < GLASS.bottom - 4 ? '' : 'none';
      jugG.setAttribute('transform', `translate(${jug[0].toFixed(1)} ${jug[1].toFixed(1)})`);
      jugWater.setAttribute('opacity', poured ? '0' : '1');
      const pending = hinted.filter((h): h is number => h !== 'pour' && !seen.has(h));
      markers.forEach((m, i) => m.setAttribute('opacity', pending.includes(i) ? '1' : '0'));
      const c = centredSpot(stripX);
      if (poured && c >= 0 && SPOTS[c].phase !== undefined && !seen.has(c)) {
        seen.add(c);
        sound.chime();
      }
    };

    const pour = () => {
      if (poured || pouring) return;
      pouring = true;
      sound.paper();
      const from: [number, number] = [jug[0], jug[1]];
      const at: [number, number] = [GLASS.cx + 190, GLASS.top - 120];
      cancelPour = tween(500, (t) => {
        jug = [from[0] + (at[0] - from[0]) * t, from[1] + (at[1] - from[1]) * t];
        jugBody.setAttribute('transform', `rotate(${(-55 * t).toFixed(1)})`);
        render();
      }, easeInOutSine);
      pourTimer = window.setTimeout(() => {
        stream.setAttribute('d', `M${GLASS.cx + 60} ${GLASS.top - 120} Q${GLASS.cx + 30} ${GLASS.top} ${GLASS.cx + 20} ${GLASS.bottom}`);
        stream.style.display = '';
        cancelPour = tween(1400, (t) => {
          water = GLASS.bottom - (GLASS.bottom - WATER_TOP) * t;
          render();
          if (t >= 1) {
            poured = true;
            pouring = false;
            stream.style.display = 'none';
            sound.chime();
            cancelPour = tween(500, (u) => {
              jug = [at[0] + (JUG_START[0] - at[0]) * u, at[1] + (JUG_START[1] - at[1]) * u];
              jugBody.setAttribute('transform', `rotate(${(-55 * (1 - u)).toFixed(1)})`);
              render();
            }, easeInOutSine);
          }
        }, easeInOutSine);
      }, 520);
    };

    let grab = [0, 0];
    scene.draggable(jugG, {
      start: (p) => (grab = [p.x - jug[0], p.y - jug[1]]),
      move: (p) => {
        if (pouring) return;
        jug = [clamp(p.x - grab[0], 100, SCENE_W - 100), clamp(p.y - grab[1], 150, SCENE_H - 140)];
        render();
      },
      end: () => {
        if (pouring) return;
        if (!poured && isOverGlass(jug[0], jug[1])) pour();
        else {
          jug = [JUG_START[0], JUG_START[1]];
          render();
        }
      },
    });
    jugG.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      pour();
    });

    let grabX = 0;
    scene.draggable(strip, {
      start: (p) => (grabX = p.x - stripX),
      move: (p) => {
        stripX = clamp(p.x - grabX, STRIP_MIN, STRIP_MAX);
        render();
      },
      end: () => {
        stripX = snapStrip(stripX);
        sound.paper();
        render();
      },
    });
    strip.addEventListener('keydown', (event) => {
      const step = { ArrowLeft: -20, ArrowRight: 20 }[event.key];
      if (!step) return;
      event.preventDefault();
      stripX = snapStrip(clamp(stripX + step, STRIP_MIN, STRIP_MAX));
      render();
    });
    render();

    const byPhase = SPOTS.map((s, i) => ({ s, i })).filter(({ s }) => s.phase !== undefined).sort((a, b) => (a.s.phase ?? 0) - (b.s.phase ?? 0)).map(({ i }) => i);
    return {
      revealHints: (count) => {
        while (hinted.length < count) {
          const next: 'pour' | number | undefined = !poured && !hinted.includes('pour') ? 'pour' : byPhase.find((i) => !seen.has(i) && !hinted.includes(i));
          if (next === undefined) break;
          hinted.push(next);
        }
        render();
        return hinted.length;
      },
      hintSteps: (): HintStep[] => {
        const steps: HintStep[] = [];
        if (!poured) steps.push({ note: 'Kéo bình nước thả lên miệng cốc để rót đầy nước.', targets: [{ x: jug[0], y: jug[1], r: 130, verb: 'drag', to: { x: GLASS.cx + 60, y: GLASS.top - 40 } }] });
        const y = STRIP.y + STRIP.h + 20;
        let cur = stripX;
        byPhase.forEach((h) => {
          steps.push({ note: 'Kéo dải giấy sang trái hoặc phải cho hình có dấu đỏ nằm ngay sau cốc nước.', targets: [{ x: cur + SPOTS[h].x, y, r: 60, verb: 'drag', to: { x: GLASS.cx, y } }] });
          steps.push({ note: 'Qua cốc nước, hình được kéo giãn và lật lại. Đọc các chấm sao cùng vầng trăng.', targets: [{ x: GLASS.cx, y: STRIP.y + STRIP.h / 2, r: 150, verb: 'look' }] });
          cur = GLASS.cx - SPOTS[h].x;
        });
        return steps;
      },
      destroy: () => {
        clearTimeout(pourTimer);
        cancelPour?.();
      },
    };
  },
};
