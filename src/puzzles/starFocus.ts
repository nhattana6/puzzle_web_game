import { url } from '../core/defs';
import { placeStars, type GlyphId } from '../core/glyphs';
import { drawOwl } from '../core/owl';
import { SCENE_H, SCENE_W } from '../core/scene';
import { annulusPath, el, moonPhase, uid } from '../core/svg';
import { clamp, mod } from '../core/tween';
import { dist, glyphAt, seeded, skyGradient, starfield } from './sky';
import type { HintTarget, PuzzleDef } from './types';

/**
 * Level 9 — focusing the telescope ("chỉnh tiêu cự"). Through the eyepiece every
 * star is a blur. The four constellations hang at four different distances, so
 * turning the focus ring brings only one of them, and its moon, sharp at a time.
 */

export const EYE = { x: 640, y: 450, r: 400 };
export const GLYPH_SIZE = 150;
export const LAYERS: readonly { id: GlyphId; x: number; y: number; phase: number; depth: number }[] = [
  { id: 'arrow', x: 480, y: 320, phase: 3, depth: 0.12 },
  { id: 'square', x: 820, y: 570, phase: 1, depth: 0.38 },
  { id: 'crown', x: 790, y: 280, phase: 4, depth: 0.64 },
  { id: 'belt', x: 440, y: 600, phase: 2, depth: 0.88 },
];
export const FOCUS_START = 0.25;
export const SHARP = 0.02;
export const SNAP = 0.045;
export const MAX_BLUR = 18;
/** The focus ring: a barrel turned by dragging sideways; the scale above it shows the focus. */
export const RING = { x: 1140, y: 680, w: 380, h: 110 };

/** Blur (SVG stdDeviation) of a layer at this depth with the telescope at this focus. */
export function blurFor(focus: number, depth: number): number {
  const gap = Math.abs(focus - depth);
  return gap < SHARP ? 0 : Math.min(MAX_BLUR, 3 + gap * 150);
}

/** The layer in sharp focus, or -1. */
export const sharpLayer = (focus: number): number => LAYERS.findIndex((l) => Math.abs(focus - l.depth) < SHARP);

/** On release, a focus close to a layer clicks onto it. */
export function snapFocus(focus: number): number {
  const near = LAYERS.find((l) => Math.abs(focus - l.depth) < SNAP);
  return near ? near.depth : focus;
}

export const moonSpot = (l: { x: number; y: number }): [number, number] => [l.x + GLYPH_SIZE / 2 + 16, l.y - GLYPH_SIZE / 2 + 6];

/** Loose stars at each distance, kept off that layer's constellation and moon. */
export function layerStars(i: number): [number, number][] {
  const rand = seeded(120 + i);
  const l = LAYERS[i];
  const keepOff = [...placeStars(l.id, l.x, l.y, GLYPH_SIZE), moonSpot(l)];
  const out: [number, number][] = [];
  let tries = 0;
  while (out.length < 24 && tries < 4000) {
    tries += 1;
    const a = rand() * Math.PI * 2;
    const r = Math.sqrt(rand()) * (EYE.r - 30);
    const p: [number, number] = [EYE.x + Math.cos(a) * r, EYE.y + Math.sin(a) * r];
    if (keepOff.some((s) => dist(p[0], p[1], s[0], s[1]) < 34)) continue;
    if (out.some((s) => dist(p[0], p[1], s[0], s[1]) < 26)) continue;
    out.push(p);
  }
  return out;
}

export const starFocus: PuzzleDef = {
  id: 'star-focus',
  name: 'Chỉnh tiêu cự',
  answer: [...LAYERS].sort((a, b) => a.phase - b.phase).map((l) => l.id),
  guide: {
    goal: 'Chỉnh tiêu cự kính viễn vọng để nhìn rõ 4 chòm sao nằm ở 4 độ xa khác nhau.',
    steps: [
      { icon: 'drag', text: 'Kéo vòng chỉnh tiêu cự (ống có khía bên phải) sang trái hoặc phải.' },
      { icon: 'look', text: 'Mỗi lúc chỉ một lớp sao nét. Chòm sao thật có nét nối; sao lẻ xung quanh thì không.' },
      { icon: 'moon', text: 'Trăng cạnh mỗi chòm cũng chỉ nét cùng lúc với nó. Đọc theo pha trăng: khuyết → nửa → gần tròn → tròn.' },
    ],
    tip: 'Mỗi chòm chỉ nét trong một khoảng rất hẹp. Kéo chậm; thả tay gần đúng chỗ thì vòng tự khớp.',
  },
  fireflies: [
    { id: 'star-focus/corner', layer: 'back', x: 1480, y: 110 },
    { id: 'star-focus/desk', layer: 'back', x: 110, y: 830 },
  ],
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    let focus = FOCUS_START;
    let lastSharp = -1;
    const seen = new Set<number>();
    const hinted: number[] = [];

    // Back: the dark observatory.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#0a0b18' }, back);
    scene.grain('back', 0.25);

    // Mid: the view through the eyepiece, one blur filter per distance.
    const clipId = uid('eyepiece');
    el('circle', { cx: EYE.x, cy: EYE.y, r: EYE.r }, el('clipPath', { id: clipId }, scene.defs));
    const view = el('g', { 'clip-path': url(clipId) }, mid);
    el('circle', { cx: EYE.x, cy: EYE.y, r: EYE.r, fill: skyGradient(scene.defs, '#0e1638', '#1c1840') }, view);
    starfield(view, { x: EYE.x - EYE.r, y: EYE.y - EYE.r, w: EYE.r * 2, h: EYE.r * 2 }, 70, 9, '#c9cff5');
    const blurs = LAYERS.map((l, i) => {
      const id = uid('focus-blur');
      const filter = el('filter', {
        id, filterUnits: 'userSpaceOnUse',
        x: EYE.x - EYE.r - 60, y: EYE.y - EYE.r - 60, width: EYE.r * 2 + 120, height: EYE.r * 2 + 120,
      }, scene.defs);
      const blur = el('feGaussianBlur', { stdDeviation: 0 }, filter);
      const g = el('g', { filter: url(id), class: 'focus-layer' }, view);
      g.style.color = '#fff1c4';
      glyphAt(g, l.id, l.x, l.y, GLYPH_SIZE, { star: 5.5, line: 2.4, lineOpacity: 0.85 });
      const [mx, my] = moonSpot(l);
      moonPhase(g, l.phase, mx, my, 15);
      for (const [x, y] of layerStars(i)) el('circle', { cx: x, cy: y, r: 4 + ((x * 7 + y) % 3), fill: '#fff1c4' }, g);
      return blur;
    });

    // Front: eyepiece rim, the owl, and the focus ring with its scale.
    el('path', { d: annulusPath(EYE.x, EYE.y, EYE.r, EYE.r + 46), fill: '#2a2740', 'fill-rule': 'evenodd' }, front);
    el('circle', { cx: EYE.x, cy: EYE.y, r: EYE.r + 46, fill: 'none', stroke: '#4a4668', 'stroke-width': 6 }, front);
    el('circle', { cx: EYE.x, cy: EYE.y, r: EYE.r + 4, fill: 'none', stroke: '#14121f', 'stroke-width': 10 }, front);
    el('rect', { x: 1180, y: 330, width: 300, height: 26, rx: 8, fill: '#3a3354' }, front);
    drawOwl(front, 1330, 270, 0.9);

    const scale = el('g', { 'pointer-events': 'none' }, front);
    const sx = (f: number) => RING.x + 20 + f * (RING.w - 40);
    el('line', { x1: sx(0), y1: RING.y - 40, x2: sx(1), y2: RING.y - 40, stroke: '#8a8fbf', 'stroke-width': 3 }, scale);
    for (let i = 0; i <= 20; i += 1) {
      el('line', { x1: sx(i / 20), y1: RING.y - 40, x2: sx(i / 20), y2: RING.y - (i % 5 === 0 ? 58 : 50), stroke: '#8a8fbf', 'stroke-width': 2 }, scale);
    }
    // Near on the left (a little flower), far on the right (mountains).
    el('path', { d: `M${sx(0) - 6} ${RING.y - 92} m-8 0 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0 M${sx(0) - 6} ${RING.y - 84} l0 18`, fill: 'none', stroke: '#8a8fbf', 'stroke-width': 3 }, scale);
    el('path', { d: `M${sx(1) - 22} ${RING.y - 66} l14 -24 l10 14 l8 -10 l12 20 Z`, fill: 'none', stroke: '#8a8fbf', 'stroke-width': 3, 'stroke-linejoin': 'round' }, scale);
    const hintTicks = el('g', {}, scale);
    const pointer = el('path', { d: 'M0 0 l-11 -18 l22 0 Z', fill: '#f4c66a' }, scale);

    const ring = el('g', { class: 'focus-ring interactive', tabindex: 0, role: 'slider', 'aria-label': 'Vòng chỉnh tiêu cự', 'aria-valuemin': 0, 'aria-valuemax': 100 }, front);
    el('rect', { x: RING.x - 20, y: RING.y - 30, width: RING.w + 40, height: RING.h + 60, fill: 'transparent' }, ring);
    el('rect', { x: RING.x, y: RING.y, width: RING.w, height: RING.h, rx: 18, fill: '#3b3656', stroke: '#5c5680', 'stroke-width': 4 }, ring);
    const knurlClip = uid('knurl');
    el('rect', { x: RING.x + 8, y: RING.y + 8, width: RING.w - 16, height: RING.h - 16, rx: 10 }, el('clipPath', { id: knurlClip }, scene.defs));
    const knurl = el('g', { 'clip-path': url(knurlClip) }, ring);

    const render = () => {
      LAYERS.forEach((l, i) => blurs[i].setAttribute('stdDeviation', blurFor(focus, l.depth).toFixed(2)));
      pointer.setAttribute('transform', `translate(${sx(focus).toFixed(1)} ${RING.y - 62})`);
      ring.setAttribute('aria-valuenow', String(Math.round(focus * 100)));
      knurl.replaceChildren();
      for (let i = 0; i < 26; i += 1) {
        const x = RING.x + mod(i * 16 - focus * 600, RING.w + 16) - 8;
        el('line', { x1: x, y1: RING.y + 8, x2: x, y2: RING.y + RING.h - 8, stroke: '#24203a', 'stroke-width': 5 }, knurl);
      }
      hintTicks.replaceChildren();
      for (const i of hinted) el('path', { d: `M${sx(LAYERS[i].depth)} ${RING.y - 36} l-10 18 l20 0 Z`, class: 'hint-tick' }, hintTicks);
      const sharp = sharpLayer(focus);
      if (sharp >= 0 && sharp !== lastSharp) sound.chime();
      if (sharp >= 0) seen.add(sharp);
      lastSharp = sharp;
    };

    let startX = 0;
    let startFocus = 0;
    scene.draggable(ring, {
      start: (p) => {
        startX = p.x;
        startFocus = focus;
      },
      move: (p) => {
        focus = clamp(startFocus + (p.x - startX) / (RING.w * 1.6), 0, 1);
        render();
      },
      end: () => {
        focus = snapFocus(focus);
        render();
      },
    });
    ring.addEventListener('keydown', (event) => {
      const step = { ArrowRight: 0.02, ArrowUp: 0.02, ArrowLeft: -0.02, ArrowDown: -0.02 }[event.key];
      if (!step) return;
      event.preventDefault();
      focus = snapFocus(clamp(focus + step, 0, 1));
      render();
    });
    render();

    const byPhase = LAYERS.map((l, i) => ({ l, i })).sort((a, b) => a.l.phase - b.l.phase).map(({ i }) => i);
    return {
      revealHints: (count) => {
        while (hinted.length < count) {
          const next = byPhase.find((i) => !seen.has(i) && !hinted.includes(i));
          if (next === undefined) break;
          hinted.push(next);
        }
        render();
        return hinted.length;
      },
      hintTargets: () => {
        const sharp = sharpLayer(focus);
        const targets: HintTarget[] = [];
        if (hinted.includes(sharp)) targets.push({ x: LAYERS[sharp].x, y: LAYERS[sharp].y, r: 120, verb: 'look' });
        if (hinted.some((i) => i !== sharp)) targets.push({ x: RING.x + RING.w / 2, y: RING.y + RING.h / 2, r: 110, verb: 'drag' });
        return targets;
      },
      destroy: () => undefined,
    };
  },
};
