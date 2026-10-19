import { url } from '../core/defs';
import { glyph, placeStars, type GlyphId } from '../core/glyphs';
import { drawOwl } from '../core/owl';
import { SCENE_H, SCENE_W } from '../core/scene';
import { el, uid } from '../core/svg';
import { clamp } from '../core/tween';
import { dist, seeded } from './sky';
import type { HintStep, PuzzleDef } from './types';
import { tr } from '../core/i18n';

/**
 * Chapter 5, level 2 — the glow-worm tunnel ("hầm đom đóm"). The wall is pitch dark. Drop the owl
 * somewhere and it hoots: a ring of sound spreads and the glow-worms light up one by one, each a
 * little after the ring reaches it (every worm has its own slow reaction). The four constellations
 * are made of worms whose delays cancel the distance from one spot, so standing exactly there the
 * whole of a constellation flashes at once, one constellation after another. Standing elsewhere the
 * same worms flash one at a time among the loose ones. A fifth little constellation (a decoy) does
 * the same trick from a different spot. Read the four in the order they flash.
 */

export const SOUND_SPEED = 330;
/** Half-width in seconds of one flash: a worm glows brightest at its time and fades linearly. */
export const GLOW = 0.14;
/** The spot where the four constellations flash whole, and the moments (seconds after the hoot) they do. */
export const CENTER = { x: 800, y: 450 };
export const FLASH_TIMES: readonly number[] = [1.3, 2.1, 2.9, 3.7];
/** The decoy: one constellation that flashes whole from another spot. */
export const DECOY_CENTER = { x: 1260, y: 790 };
export const DECOY_TIME = 4.5;
export const NOISE_COUNT = 56;
export const OWL_START = { x: 170, y: 760 };
export const WALL = { x1: 90, y1: 110, x2: 1510, y2: 790 };

export interface SkyPlace {
  glyph: GlyphId;
  x: number;
  y: number;
  size: number;
}
/** The answer, in the order they flash from the centre. */
export const SKY: readonly SkyPlace[] = [
  { glyph: 'dipper', x: 1050, y: 290, size: 170 },
  { glyph: 'crown', x: 550, y: 610, size: 160 },
  { glyph: 'triangle', x: 540, y: 280, size: 150 },
  { glyph: 'cross', x: 1060, y: 620, size: 150 },
];
export const DECOY: SkyPlace = { glyph: 'square', x: 1340, y: 560, size: 130 };

export interface Larva {
  x: number;
  y: number;
  /** Index into SKY, 4 for the decoy, -1 for a loose worm. */
  group: number;
  /** Seconds the worm waits after the sound reaches it. */
  delay: number;
}
export const DECOY_GROUP = 4;

/** Every worm: the five constellations (delays chosen so they flash whole from their spot) and loose ones. */
function makeLarvae(): Larva[] {
  const out: Larva[] = [];
  SKY.forEach((s, k) => {
    for (const [x, y] of placeStars(s.glyph, s.x, s.y, s.size)) out.push({ x, y, group: k, delay: FLASH_TIMES[k] - dist(x, y, CENTER.x, CENTER.y) / SOUND_SPEED });
  });
  for (const [x, y] of placeStars(DECOY.glyph, DECOY.x, DECOY.y, DECOY.size)) {
    out.push({ x, y, group: DECOY_GROUP, delay: DECOY_TIME - dist(x, y, DECOY_CENTER.x, DECOY_CENTER.y) / SOUND_SPEED });
  }
  const rand = seeded(5202);
  const fixed = out.length;
  let tries = 0;
  while (out.length < fixed + NOISE_COUNT && tries < 40000) {
    tries += 1;
    const x = WALL.x1 + rand() * (WALL.x2 - WALL.x1);
    const y = WALL.y1 + rand() * (WALL.y2 - WALL.y1);
    if (out.some((o) => dist(o.x, o.y, x, y) < (o.group >= 0 ? 40 : 34))) continue;
    const delay = rand() * 3.6;
    // From the true spots a loose worm must not flash together with the constellation being read.
    const atCentre = dist(x, y, CENTER.x, CENTER.y) / SOUND_SPEED + delay;
    const atDecoy = dist(x, y, DECOY_CENTER.x, DECOY_CENTER.y) / SOUND_SPEED + delay;
    if (FLASH_TIMES.some((t) => Math.abs(atCentre - t) < 0.34) || Math.abs(atDecoy - DECOY_TIME) < 0.34) continue;
    out.push({ x, y, group: -1, delay });
  }
  return out;
}
export const LARVAE: readonly Larva[] = makeLarvae();

/** Seconds after the hoot at which a worm flashes, with the owl at (x, y). */
export const flashTime = (owl: { x: number; y: number }, w: Larva): number => dist(w.x, w.y, owl.x, owl.y) / SOUND_SPEED + w.delay;

/** Brightness 0..1 of a worm at time `t` seconds after the hoot. */
export const glowAt = (t: number, flash: number): number => Math.max(0, 1 - Math.abs(t - flash) / GLOW);

/** How lit each worm is `t` seconds after a hoot from `owl`. */
export const brightness = (owl: { x: number; y: number }, t: number): number[] => LARVAE.map((w) => glowAt(t, flashTime(owl, w)));

/** When the last flash of a hoot has faded. */
export const hootLength = (owl: { x: number; y: number }): number => Math.max(...LARVAE.map((w) => flashTime(owl, w))) + GLOW;

/**
 * The best moment to read group `k` (a constellation) from `owl`: how much of it is lit at once (mean
 * brightness 0..1) and how many other worms are more than half lit then.
 */
export function bestBurst(owl: { x: number; y: number }, k: number): { lit: number; time: number; others: number } {
  const members = LARVAE.map((w, i) => ({ w, i })).filter(({ w }) => w.group === k);
  let best = { lit: 0, time: 0, others: 0 };
  for (let t = 0; t <= hootLength(owl); t += 0.02) {
    const b = brightness(owl, t);
    const lit = members.reduce((s, { i }) => s + b[i], 0) / members.length;
    if (lit > best.lit) best = { lit, time: t, others: LARVAE.filter((w, i) => w.group !== k && b[i] > 0.5).length };
  }
  return best;
}

export const clampOwl = (p: { x: number; y: number }): { x: number; y: number } => ({
  x: clamp(p.x, WALL.x1 - 10, WALL.x2 + 10),
  y: clamp(p.y, WALL.y1, WALL.y2),
});

/** Handles to the pieces a hoot repaints, in the scene or in a copy of it. */
interface WaveNodes {
  worms: (SVGElement | null)[];
  ring: SVGElement | null;
}
const collect = (root: ParentNode): WaveNodes => ({
  worms: LARVAE.map((_, i) => root.querySelector<SVGElement>(`[data-larva="${i}"]`)),
  ring: root.querySelector<SVGElement>('[data-role="ring"]'),
});

/** Paints the wall `t` seconds after a hoot from `owl` (the ring, then each worm's glow). */
function paintWave(nodes: WaveNodes, owl: { x: number; y: number }, t: number, length: number): void {
  const b = brightness(owl, t);
  nodes.worms.forEach((node, i) => node?.setAttribute('opacity', b[i].toFixed(3)));
  if (nodes.ring) {
    nodes.ring.setAttribute('cx', String(owl.x));
    nodes.ring.setAttribute('cy', String(owl.y));
    nodes.ring.setAttribute('r', Math.max(1, SOUND_SPEED * t).toFixed(1));
    nodes.ring.setAttribute('opacity', clamp(0.55 * (1 - t / length), 0, 0.55).toFixed(3));
  }
}

export const glowTunnel: PuzzleDef = {
  id: 'glow-tunnel',
  get name() {
    return tr('Hầm đom đóm', 'Glow-worm Tunnel');
  },
  answer: SKY.map((s) => s.glyph),
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    const owl = { ...OWL_START };
    let raf = 0;

    // Back: the tunnel wall, black rock.
    const rock = uid('rock');
    const grad = el('linearGradient', { id: rock, x1: 0, y1: 0, x2: 0, y2: 1 }, scene.defs);
    el('stop', { offset: 0, 'stop-color': '#0a0b12' }, grad);
    el('stop', { offset: 1, 'stop-color': '#17141d' }, grad);
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: url(rock) }, back);
    scene.grain('back', 0.35);

    // Mid: the arch ribs of the tunnel, then the worms (dark until they flash), then the ring of sound.
    for (let i = 0; i < 5; i += 1) {
      const x = 40 + i * 380;
      el('path', { d: `M${x} 900 V300 Q${x} 40 ${x + 190} 40`, fill: 'none', stroke: '#14111a', 'stroke-width': 30, 'stroke-linecap': 'round', opacity: 0.8 }, mid);
    }
    const glow = uid('worm-glow');
    const radial = el('radialGradient', { id: glow }, scene.defs);
    el('stop', { offset: 0, 'stop-color': '#e9ff9a', 'stop-opacity': 0.95 }, radial);
    el('stop', { offset: 1, 'stop-color': '#e9ff9a', 'stop-opacity': 0 }, radial);
    const worms = el('g', { 'pointer-events': 'none' }, mid);
    LARVAE.forEach((w, i) => {
      const g = el('g', { 'data-larva': i, opacity: 0 }, worms);
      el('circle', { cx: w.x.toFixed(1), cy: w.y.toFixed(1), r: 30, fill: url(glow) }, g);
      el('circle', { cx: w.x.toFixed(1), cy: w.y.toFixed(1), r: 7, fill: '#f6ffc4' }, g);
    });
    el('circle', { 'data-role': 'ring', cx: 0, cy: 0, r: 1, fill: 'none', stroke: '#f4c66a', 'stroke-width': 3, opacity: 0, 'pointer-events': 'none' }, mid);

    // Front: the rails along the bottom and the owl, which can be dragged anywhere on the wall.
    el('rect', { x: -60, y: 850, width: SCENE_W + 120, height: 80, fill: '#0e0c13' }, front);
    el('line', { x1: -60, y1: 872, x2: SCENE_W + 60, y2: 872, stroke: '#3a3548', 'stroke-width': 8 }, front);
    el('line', { x1: -60, y1: 890, x2: SCENE_W + 60, y2: 890, stroke: '#3a3548', 'stroke-width': 8 }, front);
    const holder = el('g', { class: 'owl-holder interactive', 'data-hint': 'owl', tabindex: 0, role: 'button', 'aria-label': tr('Chú cú: kéo để đổi chỗ, thả ra hoặc bấm Enter để hú', 'The owl: drag to move, let go or press Enter to hoot') }, front);
    el('circle', { cx: 0, cy: 0, r: 84, fill: 'transparent' }, holder);
    drawOwl(holder, 0, 0, 1);

    const nodes = collect(scene.root);
    const render = () => holder.setAttribute('transform', `translate(${owl.x.toFixed(1)} ${owl.y.toFixed(1)})`);
    const setOwl = (p: { x: number; y: number }) => {
      Object.assign(owl, clampOwl(p));
      render();
    };

    const hoot = () => {
      cancelAnimationFrame(raf);
      sound.knock();
      const from = { ...owl };
      const length = hootLength(from);
      const began = performance.now();
      const frame = () => {
        const t = (performance.now() - began) / 1000;
        if (t >= length) {
          paintWave(nodes, from, length, length);
          nodes.worms.forEach((n) => n?.setAttribute('opacity', '0'));
          nodes.ring?.setAttribute('opacity', '0');
          return;
        }
        paintWave(nodes, from, t, length);
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    };

    let grab = { x: 0, y: 0 };
    scene.draggable(holder, {
      start: (p) => {
        grab = { x: p.x - owl.x, y: p.y - owl.y };
      },
      move: (p) => setOwl({ x: p.x - grab.x, y: p.y - grab.y }),
      end: hoot,
    });
    holder.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        hoot();
        return;
      }
      const step = { ArrowLeft: [-40, 0], ArrowRight: [40, 0], ArrowUp: [0, -40], ArrowDown: [0, 40] }[event.key];
      if (!step) return;
      event.preventDefault();
      setOwl({ x: owl.x + step[0], y: owl.y + step[1] });
    });
    render();

    return {
      revealHints: () => 0,
      hintSteps: (): HintStep[] => {
        const from = { x: owl.x, y: owl.y };
        return [
          {
            note: tr('Kéo chú cú tới giữa hầm rồi thả ra: tiếng hú lan thành vòng sóng và đánh thức các ấu trùng.', 'Drag the owl to the middle of the tunnel and let go: its hoot spreads out in a ring and wakes the glow-worms.'),
            targets: [{ ...from, r: 80, verb: 'drag', to: CENTER, object: '[data-hint="owl"]' }],
            apply: () => setOwl(CENTER),
          },
          {
            note: tr('Đứng đúng chỗ thì mỗi chòm sao loé lên cùng một lúc, lần lượt từng chòm. Đứng lệch thì các chấm loé rời rạc. Đọc theo thứ tự loé.', 'From the right spot, each constellation flashes all at once, one constellation after another. From the wrong spot the dots flash scattered. Read in the order they flash.'),
            targets: [{
              x: CENTER.x, y: CENTER.y, r: 0, verb: 'look',
              // Not the real hoot (its flashes are over in a blink at this speed): the four constellations take turns.
              act: (picture) => {
                const mine = collect(picture);
                return (p) => {
                  const turn = Math.min(SKY.length - 1, Math.floor(p * SKY.length));
                  const glow = Math.sin(Math.PI * (p * SKY.length - turn));
                  LARVAE.forEach((w, i) => mine.worms[i]?.setAttribute('opacity', (w.group === turn ? glow : 0).toFixed(3)));
                };
              },
            }],
          },
          {
            note: tr('Bốn chòm theo thứ tự loé: 1, 2, 3, 4.', 'The four constellations in the order they flash: 1, 2, 3, 4.'),
            targets: SKY.map((s) => ({ x: s.x, y: s.y, r: s.size * 0.7, verb: 'look' as const })),
            prepare: (picture) => {
              const overlay = picture.querySelector('.layer-overlay') ?? picture;
              const mine = collect(picture);
              LARVAE.forEach((w, i) => mine.worms[i]?.setAttribute('opacity', w.group >= 0 && w.group < DECOY_GROUP ? '1' : '0'));
              SKY.forEach((s, k) => {
                const stars = placeStars(s.glyph, s.x, s.y, s.size);
                for (const [a, b] of glyph(s.glyph).lines) {
                  el('line', { x1: stars[a][0], y1: stars[a][1], x2: stars[b][0], y2: stars[b][1], class: 'hint-line', 'pointer-events': 'none' }, overlay);
                }
                const badge = el('g', { transform: `translate(${s.x} ${s.y - s.size / 2 - 22})`, 'pointer-events': 'none' }, overlay);
                el('circle', { r: 17, class: 'number-badge' }, badge);
                el('text', { y: 1, class: 'number-text' }, badge).textContent = String(k + 1);
              });
            },
          },
        ];
      },
      destroy: () => cancelAnimationFrame(raf),
    };
  },
};
