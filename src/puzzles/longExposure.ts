import { drawOwl } from '../core/owl';
import type { GlyphId } from '../core/glyphs';
import { glyph, placeStars } from '../core/glyphs';
import { SCENE_H, SCENE_W } from '../core/scene';
import { el } from '../core/svg';
import { clamp } from '../core/tween';
import { seeded } from './sky';
import type { HintStep, PuzzleDef } from './types';

/**
 * Chapter 3, level 10 — the long exposure ("ảnh phơi sáng"). A camera's shutter is open on a
 * yard where six people wave sparklers above their heads, each drawing the dots of a
 * constellation. Four are children standing still, each with a numbered bib; two are passers-by
 * who walk through the picture wearing bibs of their own that repeat two of the numbers. Drag the
 * exposure slider: a short exposure catches only a few sparks and everyone looks sharp, so the
 * bibs are ambiguous; a long one fills in the constellations and smears whoever walked into a
 * pale ghost. The answer is the constellations of the four sharp figures, in the order of
 * their bib numbers.
 */

export interface PersonDef {
  glyph: GlyphId;
  bib: number;
  /** A passer-by walks, so a long exposure smears them. */
  walking: boolean;
  coat: string;
}

/** Left to right across the yard. */
export const PEOPLE: readonly PersonDef[] = [
  { glyph: 'cross', bib: 2, walking: false, coat: '#4d6a9a' },
  { glyph: 'crown', bib: 2, walking: true, coat: '#9a5a4d' },
  { glyph: 'hook', bib: 4, walking: false, coat: '#5a8a6a' },
  { glyph: 'triangle', bib: 1, walking: false, coat: '#8a7a4d' },
  { glyph: 'dipper', bib: 1, walking: true, coat: '#6a4d8a' },
  { glyph: 'square', bib: 3, walking: false, coat: '#4d8a8a' },
];

/** The answer: the standing children, by bib number. */
export const READING_ORDER: readonly number[] = PEOPLE
  .map((p, i) => ({ p, i }))
  .filter(({ p }) => !p.walking)
  .sort((a, b) => a.p.bib - b.p.bib)
  .map(({ i }) => i);

export const PERSON_X = (i: number): number => 170 + i * 250;
export const GROUND_Y = 760;
export const CHOM = { y: 300, size: 150 };
/** How far a passer-by walks during a full exposure. */
export const WALK = 150;
export const SLIDER = { x0: 420, x1: 1180, y: 850 };

/** How blurred a walking figure is at exposure e (0 sharp … 1 a pale smear). */
export const smear = (e: number): number => clamp((e - 0.25) / 0.5, 0, 1);

/** The sparks of person i that have flashed by exposure e: fractions (0…1) of each star's moment. */
export function sparkCount(i: number, e: number): number {
  const n = placeStars(PEOPLE[i].glyph, 0, 0, 10).length;
  // Each star flashes at its own moment; by e = 0.8 all of them have.
  return Math.min(n, Math.floor((e / 0.8) * (n + 1)));
}
export const sparkTotal = (i: number): number => placeStars(PEOPLE[i].glyph, 0, 0, 10).length;

/** Dice-like dot positions for a bib number 1–4 in a box of half-size `s`. */
export function bibDots(n: number, s: number): [number, number][] {
  const c: [number, number][] = [];
  if (n === 1) return [[0, 0]];
  if (n === 2) return [[-s, -s], [s, s]];
  if (n === 3) return [[-s, -s], [0, 0], [s, s]];
  c.push([-s, -s], [s, -s], [-s, s], [s, s]);
  return c;
}

/** The bib numbers that can be read clearly at exposure e (the walking people's are smeared away). */
export const readableBibs = (e: number): number[] =>
  PEOPLE.flatMap((p) => (!p.walking || smear(e) < 0.4 ? [p.bib] : []));

export const longExposure: PuzzleDef = {
  id: 'long-exposure',
  name: 'Ảnh phơi sáng',
  answer: READING_ORDER.map((i) => PEOPLE[i].glyph),
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    let e = 0;
    const sparkNodes: SVGEllipseElement[][] = [];
    const ghostCopies: SVGGElement[][] = [];

    // Back: the night yard.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#10142e' }, back);
    el('rect', { x: -60, y: GROUND_Y, width: SCENE_W + 120, height: 200, fill: '#241f38' }, back);
    const rand = seeded(10101);
    for (let n = 0; n < 70; n += 1) el('circle', { cx: (rand() * SCENE_W).toFixed(0), cy: (rand() * 120).toFixed(0), r: (0.8 + rand() * 1.4).toFixed(1), fill: '#f6efd8', opacity: (0.25 + rand() * 0.4).toFixed(2) }, back);
    scene.grain('back', 0.35);

    const drawPerson = (parent: Element, p: PersonDef): SVGGElement => {
      const g = el('g', {}, parent);
      el('rect', { x: -12, y: -52, width: 10, height: 52, rx: 4, fill: '#241830' }, g);
      el('rect', { x: 2, y: -52, width: 10, height: 52, rx: 4, fill: '#241830' }, g);
      el('rect', { x: -26, y: -128, width: 52, height: 82, rx: 16, fill: p.coat }, g);
      el('circle', { cx: 0, cy: -150, r: 20, fill: '#e8c9a0' }, g);
      el('circle', { cx: -7, cy: -153, r: 2.6, fill: '#2a1d14' }, g);
      el('circle', { cx: 7, cy: -153, r: 2.6, fill: '#2a1d14' }, g);
      el('line', { x1: 24, y1: -112, x2: 40, y2: -178, stroke: p.coat, 'stroke-width': 11, 'stroke-linecap': 'round' }, g);
      el('line', { x1: 40, y1: -178, x2: 46, y2: -204, stroke: '#cfc7b0', 'stroke-width': 3, 'stroke-linecap': 'round' }, g);
      el('rect', { x: -17, y: -118, width: 34, height: 34, rx: 6, fill: '#f6efd8' }, g);
      for (const [dx, dy] of bibDots(p.bib, 8)) el('circle', { cx: dx, cy: -101 + dy, r: 4.2, fill: '#2a1d14' }, g);
      return g;
    };

    // Mid: the people, and the sparks above them.
    PEOPLE.forEach((p, i) => {
      const x = PERSON_X(i);
      const group = el('g', { transform: `translate(${x} ${GROUND_Y})` }, mid);
      const sharp = drawPerson(group, p);
      sharp.setAttribute('data-hint', `person-${i}`);
      const copies: SVGGElement[] = [];
      if (p.walking) {
        for (let k = 0; k < 5; k += 1) {
          const copy = drawPerson(group, p);
          copy.setAttribute('opacity', '0');
          copies.push(copy);
        }
      }
      ghostCopies.push([sharp, ...copies]);
      const stars = placeStars(p.glyph, x + 30, CHOM.y, CHOM.size);
      sparkNodes.push(stars.map(([sx, sy]) => el('ellipse', { cx: sx.toFixed(1), cy: sy.toFixed(1), rx: 6, ry: 6, fill: '#ffd98a', opacity: 0 }, mid)));
    });

    // Front: the exposure slider and the owl.
    el('line', { x1: SLIDER.x0, y1: SLIDER.y, x2: SLIDER.x1, y2: SLIDER.y, stroke: '#3a2a22', 'stroke-width': 16, 'stroke-linecap': 'round' }, front);
    for (let k = 0; k <= 4; k += 1) {
      const x = SLIDER.x0 + ((SLIDER.x1 - SLIDER.x0) * k) / 4;
      el('line', { x1: x, y1: SLIDER.y - 22, x2: x, y2: SLIDER.y + 22, stroke: '#8a6a48', 'stroke-width': 4, 'stroke-linecap': 'round' }, front);
    }
    // A shutter at the short end and an open lens at the long end, as the slider's two ends.
    el('rect', { x: SLIDER.x0 - 70, y: SLIDER.y - 20, width: 40, height: 40, rx: 8, fill: '#2b2430', stroke: '#8a6a48', 'stroke-width': 4 }, front);
    el('circle', { cx: SLIDER.x0 - 50, cy: SLIDER.y, r: 9, fill: '#f6efd8' }, front);
    el('circle', { cx: SLIDER.x1 + 50, cy: SLIDER.y, r: 22, fill: '#2b2430', stroke: '#8a6a48', 'stroke-width': 4 }, front);
    el('circle', { cx: SLIDER.x1 + 50, cy: SLIDER.y, r: 12, fill: '#6fb4d8' }, front);
    const handle = el('g', { class: 'exposure-handle interactive', tabindex: 0, role: 'slider', 'aria-label': 'Thời gian phơi sáng', 'aria-valuemin': 0, 'aria-valuemax': 100, 'data-hint': 'handle' }, front);
    el('rect', { x: -34, y: -34, width: 68, height: 68, fill: 'transparent' }, handle);
    el('circle', { r: 24, fill: '#d3a64f', stroke: '#7e5b1c', 'stroke-width': 5 }, handle);
    el('circle', { r: 8, fill: '#f6efd8' }, handle);
    drawOwl(front, 1500, 840, 0.6);

    const render = () => {
      const hx = SLIDER.x0 + (SLIDER.x1 - SLIDER.x0) * e;
      handle.setAttribute('transform', `translate(${hx.toFixed(1)} ${SLIDER.y})`);
      handle.setAttribute('aria-valuenow', String(Math.round(e * 100)));
      const s = smear(e);
      PEOPLE.forEach((p, i) => {
        const shown = sparkCount(i, e);
        sparkNodes[i].forEach((n, k) => {
          n.setAttribute('opacity', k < shown ? '1' : '0');
          // Whoever walked drags their sparks into short dashes.
          n.setAttribute('rx', (6 + (p.walking ? 11 * s : 0)).toFixed(1));
        });
        if (p.walking) {
          const [sharp, ...copies] = ghostCopies[i];
          sharp.setAttribute('opacity', (1 - s).toFixed(2));
          copies.forEach((c, k) => {
            const t = (k + 1) / copies.length;
            c.setAttribute('transform', `translate(${(WALK * s * t - WALK * s * 0.5).toFixed(1)} 0)`);
            c.setAttribute('opacity', (0.32 * s).toFixed(2));
          });
          sharp.setAttribute('transform', `translate(${(-WALK * s * 0.5).toFixed(1)} 0)`);
        }
      });
    };

    scene.draggable(handle, {
      move: (p) => {
        e = clamp((p.x - SLIDER.x0) / (SLIDER.x1 - SLIDER.x0), 0, 1);
        render();
      },
      end: () => sound.paper(),
    });
    handle.addEventListener('keydown', (event) => {
      const d = { ArrowRight: 0.1, ArrowUp: 0.1, ArrowLeft: -0.1, ArrowDown: -0.1 }[event.key];
      if (!d) return;
      event.preventDefault();
      e = clamp(e + d, 0, 1);
      render();
    });
    render();

    return {
      // Nothing is marked in the scene; the hint card shows the whole solution instead.
      revealHints: () => 0,
      hintSteps: (): HintStep[] => [
        {
          note: 'Kéo thanh phơi sáng sang hết phải: các đốm lửa dồn đủ thành chòm sao, và hai người đi ngang qua bị nhoè thành bóng mờ (đốm lửa của họ cũng kéo thành vệt ngắn).',
          targets: [{ x: SLIDER.x0, y: SLIDER.y, r: 60, verb: 'drag', to: { x: SLIDER.x1, y: SLIDER.y }, object: '[data-hint="handle"]' }],
          apply: () => {
            e = 1;
            render();
          },
        },
        {
          note: 'Bỏ hai bóng mờ. Bốn bạn đứng yên đeo yếm số 1, 2, 3, 4 (số chấm): đọc chòm trên đầu từng bạn theo số yếm.',
          targets: READING_ORDER.map((i) => ({ x: PERSON_X(i) + 30, y: CHOM.y, r: 90, verb: 'look' as const })),
          prepare: (picture) => {
            const overlay = picture.querySelector('.layer-overlay') ?? picture;
            READING_ORDER.forEach((i, n) => {
              const stars = placeStars(PEOPLE[i].glyph, PERSON_X(i) + 30, CHOM.y, CHOM.size);
              for (const [a, b] of glyph(PEOPLE[i].glyph).lines) {
                el('line', { x1: stars[a][0], y1: stars[a][1], x2: stars[b][0], y2: stars[b][1], class: 'hint-line', 'pointer-events': 'none' }, overlay);
              }
              const badge = el('g', { transform: `translate(${PERSON_X(i) + 30} ${CHOM.y - 110})`, 'pointer-events': 'none' }, overlay);
              el('circle', { r: 17, class: 'number-badge' }, badge);
              el('text', { y: 1, class: 'number-text' }, badge).textContent = String(n + 1);
            });
          },
        },
      ],
      destroy: () => undefined,
    };
  },
};
