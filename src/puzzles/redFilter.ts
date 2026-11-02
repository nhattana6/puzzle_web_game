import { url } from '../core/defs';
import { SCENE_H, SCENE_W } from '../core/scene';
import { el, moonPhase, uid } from '../core/svg';
import { clamp } from '../core/tween';
import { ease, inside, runIntro, within } from './intro';
import { glyphAt, seeded } from './sky';
import type { HintStep, PuzzleDef } from './types';
import { tr } from '../core/i18n';

/**
 * Level 3 — the red decoder ("kính lọc đỏ"). An old star chart is scribbled over
 * with red ink. Slide the red glass across it: under the glass the red ink
 * vanishes and the constellations, each with a moon giving the order, appear.
 * Neither shows on the chart without the glass.
 */

export const CHART = { x: 260, y: 130, w: 1080, h: 660 };
export const FILTER = { w: 320, h: 280 };
export const GLYPH_SIZE = 190;
export const GLYPH_SPOTS = [
  { id: 'square', x: 480, y: 340, phase: 2 },
  { id: 'diamond', x: 820, y: 590, phase: 3 },
  { id: 'hook', x: 1130, y: 350, phase: 1 },
] as const;
export const FILTER_START: readonly [number, number] = [1430, 650];

/** Constellations fully inside the red glass when its centre is at (x, y). */
export function decodedUnder(x: number, y: number): number[] {
  const half = GLYPH_SIZE / 2 - 4;
  return GLYPH_SPOTS.map((g, i) => ({ g, i }))
    .filter(({ g }) => Math.abs(g.x - x) <= FILTER.w / 2 - half && Math.abs(g.y - y) <= FILTER.h / 2 - half)
    .map(({ i }) => i);
}

// --- The first-run demonstration: a finger drags the red glass from the corner onto the chart, over the constellation whose moon
// is the thinnest (the first to read); the red ink under the glass goes and the constellation shows. A strip of the four
// moon phases appears with the thin one lit (that is its place: first); the finger goes to the keypad and taps the constellation (it
// fills the first slot) while the strip's light goes on to the rounder moons, up to the full one (the later ones, the full
// moon last); then the strip goes and the glass slides back. Seconds of one round, as [start, end] of each part.
export const INTRO = {
  fadeIn: [0, 0.5], press: [0.5, 0.7], slide: [0.7, 2.2], release: [2.2, 2.4], legendIn: [2.5, 2.9], glide: [3.2, 4.1], keyPress: [4.1, 4.35],
  slot: [4.25, 6.4], fadeOut: [6.3, 6.7], legendOut: [6.5, 6.9], back: [6.4, 7.5], rest: 9.0, rounds: 3,
} as const;
/** The moment (s) each moon of the strip, after the first, takes the light: the thin one has it from the strip's start. */
export const LIGHT_AT = [0, 4.9, 5.4, 5.9] as const;
/** The constellation the demonstration uncovers: the first to read (thinnest moon). */
const FIRST = [...GLYPH_SPOTS].sort((a, b) => a.phase - b.phase)[0];
export const INTRO_GLYPH = FIRST.id;

/**
 * Where the red glass is (scene units) and the finger, `t` seconds into one round: `along` 0 on the glass and 1 on the keypad key,
 * how visible it is, whether it presses; whether the first answer slot shows the constellation; and the strip of moon phases:
 * how visible, and which of the four is lit (0 thinnest … 3 full).
 */
export function introPose(t: number): {
  glass: [number, number];
  finger: { along: number; opacity: number; pressed: boolean };
  slot: boolean;
  legend: { opacity: number; lit: number };
} {
  const out = ease(within(t, INTRO.slide)) - ease(within(t, INTRO.back));
  return {
    glass: [FILTER_START[0] + (FIRST.x - FILTER_START[0]) * out, FILTER_START[1] + (FIRST.y - FILTER_START[1]) * out],
    finger: {
      along: ease(within(t, INTRO.glide)),
      opacity: within(t, INTRO.fadeIn) * (1 - within(t, INTRO.fadeOut)),
      pressed: (t >= INTRO.press[0] && t < INTRO.release[0]) || inside(t, INTRO.keyPress),
    },
    slot: inside(t, INTRO.slot),
    legend: { opacity: within(t, INTRO.legendIn) * (1 - within(t, INTRO.legendOut)), lit: LIGHT_AT.reduce<number>((lit, at, i) => (t >= at ? i : lit), 0) },
  };
}

export const redFilter: PuzzleDef = {
  id: 'red-filter',
  moonOrder: true,
  get name() {
    return tr('Kính lọc đỏ', 'Red Filter');
  },
  answer: [...GLYPH_SPOTS].sort((a, b) => a.phase - b.phase).map((g) => g.id),
  mount({ scene, sound }) {
    const { back, front } = scene.layers;
    let fx = FILTER_START[0];
    let fy = FILTER_START[1];
    const seen = new Set<number>();
    const hinted: number[] = [];
    let stopIntro: () => void = () => undefined;

    // Back: the desk under a warm lamp.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#2a1d18' }, back);
    for (let y = 0; y < SCENE_H; y += 60) el('line', { x1: -60, y1: y, x2: SCENE_W + 60, y2: y + 20, stroke: '#24180f', 'stroke-width': 3 }, back);
    scene.grain('back', 0.5);

    // Front: the chart, the decoded view under the glass, and the glass itself.
    const chart = el('g', {}, front);
    el('rect', { x: CHART.x, y: CHART.y, width: CHART.w, height: CHART.h, rx: 6, fill: '#efe6cf', stroke: '#b9a27f', 'stroke-width': 3 }, chart);
    el('circle', { cx: CHART.x + CHART.w / 2, cy: CHART.y + CHART.h / 2, r: 300, fill: 'none', stroke: '#c9b48c', 'stroke-width': 2 }, chart);
    el('line', { x1: CHART.x + 20, y1: CHART.y + CHART.h / 2, x2: CHART.x + CHART.w - 20, y2: CHART.y + CHART.h / 2, stroke: '#c9b48c', 'stroke-width': 2 }, chart);
    // The constellations and their moons are not drawn on the chart at all: only the
    // view under the red glass (below) shows them.
    const rand = seeded(31);
    const reds = ['#d23a2a', '#e0533c', '#c24060', '#e2785a', '#b8334a'];
    const noise = el('g', {}, chart);
    for (let i = 0; i < 1300; i += 1) {
      const x = CHART.x + 10 + rand() * (CHART.w - 20);
      const y = CHART.y + 10 + rand() * (CHART.h - 20);
      const c = reds[Math.floor(rand() * reds.length)];
      if (rand() < 0.35) {
        el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: (2 + rand() * 4).toFixed(1), fill: c }, noise);
      } else {
        const a = rand() * Math.PI;
        const l = 12 + rand() * 30;
        el('path', {
          d: `M${x.toFixed(1)} ${y.toFixed(1)} q${(Math.cos(a) * l * 0.5).toFixed(1)} ${(Math.sin(a) * l * 0.5 - 6).toFixed(1)} ${(Math.cos(a) * l).toFixed(1)} ${(Math.sin(a) * l).toFixed(1)}`,
          stroke: c, 'stroke-width': 2.5, fill: 'none', 'stroke-linecap': 'round',
        }, noise);
      }
    }

    const clipId = uid('filter-view');
    const clipRect = el('rect', { width: FILTER.w - 24, height: FILTER.h - 24 }, el('clipPath', { id: clipId }, scene.defs));
    const decoded = el('g', { 'clip-path': url(clipId), 'pointer-events': 'none' }, front);
    el('rect', { x: CHART.x, y: CHART.y, width: CHART.w, height: CHART.h, fill: '#f2d2c4' }, decoded);
    const dark = el('g', {}, decoded);
    dark.style.color = '#1d2140';
    for (const g of GLYPH_SPOTS) glyphAt(dark, g.id, g.x, g.y, GLYPH_SIZE, { star: 7, line: 4, lineOpacity: 0.9 });
    for (const g of GLYPH_SPOTS) moonPhase(decoded, g.phase, g.x, g.y - GLYPH_SIZE / 2 - 30, 16, { class: 'moon-phase ink' });

    const ghost = el('rect', { width: FILTER.w, height: FILTER.h, rx: 14, class: 'filter-ghost', opacity: 0 }, front);
    const glass = el('g', { class: 'red-glass interactive', tabindex: 0, role: 'button', 'aria-label': tr('Tấm kính đỏ', 'The red glass'), 'data-hint': 'red-glass' }, front);
    el('rect', { x: -FILTER.w / 2, y: -FILTER.h / 2, width: FILTER.w, height: FILTER.h, rx: 14, class: 'glass-tint' }, glass);
    el('rect', { x: -FILTER.w / 2, y: -FILTER.h / 2, width: FILTER.w, height: FILTER.h, rx: 14, fill: 'none', stroke: '#5e3820', 'stroke-width': 12 }, glass);
    el('rect', { x: FILTER.w / 2 - 6, y: -18, width: 70, height: 36, rx: 10, fill: '#6b4f36' }, glass);

    const render = () => {
      glass.setAttribute('transform', `translate(${fx.toFixed(1)} ${fy.toFixed(1)})`);
      clipRect.setAttribute('x', (fx - FILTER.w / 2 + 12).toFixed(1));
      clipRect.setAttribute('y', (fy - FILTER.h / 2 + 12).toFixed(1));
      const next = hinted.find((g) => !seen.has(g));
      if (next === undefined) ghost.setAttribute('opacity', '0');
      else {
        ghost.setAttribute('opacity', '1');
        ghost.setAttribute('x', String(GLYPH_SPOTS[next].x - FILTER.w / 2));
        ghost.setAttribute('y', String(GLYPH_SPOTS[next].y - FILTER.h / 2));
      }
    };
    const check = () => {
      for (const g of decodedUnder(fx, fy)) {
        if (seen.has(g)) continue;
        seen.add(g);
        sound.chime();
      }
      render();
    };

    let grab = [0, 0];
    scene.draggable(glass, {
      start: (p) => (grab = [p.x - fx, p.y - fy]),
      move: (p) => {
        fx = clamp(p.x - grab[0], 140, SCENE_W - 140);
        fy = clamp(p.y - grab[1], 120, SCENE_H - 120);
        check();
      },
      end: () => sound.paper(),
    });
    glass.addEventListener('keydown', (event) => {
      const moves: Record<string, [number, number]> = { ArrowLeft: [-30, 0], ArrowRight: [30, 0], ArrowUp: [0, -30], ArrowDown: [0, 30] };
      const m = moves[event.key];
      if (!m) return;
      event.preventDefault();
      fx = clamp(fx + m[0], 140, SCENE_W - 140);
      fy = clamp(fy + m[1], 120, SCENE_H - 120);
      check();
    });
    render();

    const byPhase = GLYPH_SPOTS.map((g, i) => ({ g, i })).sort((a, b) => a.g.phase - b.g.phase).map(({ i }) => i);
    return {
      revealHints: (count) => {
        while (hinted.length < count) {
          const next = byPhase.find((g) => !seen.has(g) && !hinted.includes(g));
          if (next === undefined) break;
          hinted.push(next);
        }
        render();
        return hinted.length;
      },
      hintSteps: (): HintStep[] => {
        const steps: HintStep[] = [];
        let cur = { x: fx, y: fy };
        byPhase.forEach((g, n) => {
          const s = GLYPH_SPOTS[g];
          steps.push({
            note: tr(`Kéo tấm kính đỏ ${n === 0 ? 'lên bản đồ' : 'sang chỗ tiếp theo'}, phủ trọn khung vàng.`, `Drag the red glass ${n === 0 ? 'onto the map' : 'to the next spot'}, covering the whole gold frame.`),
            targets: [{ ...cur, r: 120, verb: 'drag', to: { x: s.x, y: s.y }, object: '[data-hint="red-glass"]' }],
            apply: () => {
              fx = s.x;
              fy = s.y;
              check();
            },
          });
          steps.push({ note: tr('Dưới kính đỏ, mực đỏ biến mất và hiện chòm sao cùng vầng trăng bên cạnh. Nhớ pha trăng của nó.', 'Under the red glass the red ink disappears, and a constellation shows with a moon beside it. Remember its moon phase.'), targets: [{ x: s.x, y: s.y, r: 130, verb: 'look' }] });
          cur = { x: s.x, y: s.y };
        });
        return steps;
      },
      intro: (host) => {
        // The strip of moon phases, over the top of the chart on a dark band (so it reads on the paper).
        const legend = el('g', { opacity: 0, 'pointer-events': 'none' }, scene.overlay);
        el('rect', { x: CHART.x + CHART.w / 2 - 210, y: CHART.y + 8, width: 420, height: 64, rx: 32, fill: '#24180f', opacity: 0.92, stroke: '#f4c66a', 'stroke-width': 2 }, legend);
        const moons = [1, 2, 3, 4].map((phase, i) => moonPhase(legend, phase, CHART.x + CHART.w / 2 + (i - 1.5) * 90, CHART.y + 40, 18, { class: 'moon-phase painted' }));
        stopIntro = runIntro(host, {
          rest: INTRO.rest,
          rounds: INTRO.rounds,
          startDelayMs: 1200,
          key: INTRO_GLYPH,
          frame: (t) => {
            const pose = introPose(t);
            // The glass is only moved and drawn: nothing is "seen" or chimed, the player's own first move still counts.
            [fx, fy] = pose.glass;
            render();
            legend.setAttribute('opacity', pose.legend.opacity.toFixed(2));
            moons.forEach((moon, i) => {
              const lit = i === pose.legend.lit;
              const x = CHART.x + CHART.w / 2 + (i - 1.5) * 90;
              moon.setAttribute('transform', `translate(${x} ${CHART.y + 40}) scale(${lit ? 1.3 : 1})`);
              moon.setAttribute('opacity', lit ? '1' : '0.45');
            });
            return { at: { x: pose.glass[0], y: pose.glass[1] }, along: pose.finger.along, opacity: pose.finger.opacity, pressed: pose.finger.pressed, slot: pose.slot ? INTRO_GLYPH : null, moved: pose.glass[0] !== FILTER_START[0] || pose.glass[1] !== FILTER_START[1] };
          },
          reset: () => {
            [fx, fy] = FILTER_START;
            render();
          },
          done: () => legend.remove(),
          isMoved: (target) => !!target.closest('[data-hint="red-glass"]'),
        });
      },
      destroy: () => stopIntro(),
    };
  },
};
