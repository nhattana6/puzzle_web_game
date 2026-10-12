import { DEF, url } from '../core/defs';
import { glyph, placeStars, type GlyphId } from '../core/glyphs';
import { SCENE_H, SCENE_W } from '../core/scene';
import { el, moonPhase } from '../core/svg';
import { clamp, tween } from '../core/tween';
import { dist, seeded } from './sky';
import type { HintStep, PuzzleDef } from './types';

/**
 * Level 6 — two glass plates ("hai tấm kính"). One plate is scratched with a
 * tangle of lines, the other dotted with stars. Lay the star plate exactly over
 * the line plate, the right way up: only lines with a star at both ends light up.
 */

export const PLATE = { w: 520, h: 380 };
export const LINE_PLATE: readonly [number, number] = [980, 470];
export const STAR_START: readonly [number, number] = [360, 470];
export const SNAP = 30;
export const GLYPH_SIZE = 130;
export const GLYPH_SPOTS: readonly { id: GlyphId; x: number; y: number; phase: number }[] = [
  { id: 'cross', x: -165, y: -25, phase: 3 },
  { id: 'crown', x: 10, y: 70, phase: 1 },
  { id: 'square', x: 170, y: -45, phase: 2 },
];

/** Constellations scratched on the line plate that no star will ever light. */
export const FAKE_SPOTS: readonly { id: GlyphId; x: number; y: number }[] = [
  { id: 'triangle', x: -60, y: -95 },
  { id: 'diamond', x: 150, y: 110 },
  { id: 'arrow', x: -170, y: 105 },
];

type Pt = [number, number];
export interface PlateArt {
  /** On the star plate, relative to its centre. */
  stars: Pt[];
  /** On the line plate, relative to its centre. */
  lines: [Pt, Pt][];
  /** How many of `lines` belong to constellations (they come first). */
  glyphLines: number;
}

export function plateArt(): PlateArt {
  const rand = seeded(73);
  const stars: Pt[] = [];
  const lines: [Pt, Pt][] = [];
  for (const g of GLYPH_SPOTS) {
    const pts = placeStars(g.id, g.x, g.y, GLYPH_SIZE);
    stars.push(...pts);
    for (const [a, b] of glyph(g.id).lines) lines.push([pts[a], pts[b]]);
  }
  const glyphLines = lines.length;
  const rnd = (): Pt => [-PLATE.w / 2 + 30 + rand() * (PLATE.w - 60), -PLATE.h / 2 + 30 + rand() * (PLATE.h - 60)];
  const decoyEnds: Pt[] = [];
  // Fake constellations scratched in too, so the line plate alone gives nothing away.
  for (const fake of FAKE_SPOTS) {
    const pts = placeStars(fake.id, fake.x, fake.y, GLYPH_SIZE);
    if (pts.some((p) => stars.some((s) => dist(p[0], p[1], s[0], s[1]) < 28))) continue;
    for (const [a, b] of glyph(fake.id).lines) lines.push([pts[a], pts[b]]);
    decoyEnds.push(...pts);
  }
  let tries = 0;
  while (lines.length < glyphLines + 30 && tries < 4000) {
    tries += 1;
    const a = rnd();
    const b = rnd();
    const len = dist(a[0], a[1], b[0], b[1]);
    if (len < 50 || len > 170) continue;
    if ([a, b].some((p) => stars.some((s) => dist(p[0], p[1], s[0], s[1]) < 28))) continue;
    lines.push([a, b]);
    decoyEnds.push(a, b);
  }
  tries = 0;
  const glyphStars = stars.length;
  while (stars.length < glyphStars + 14 && tries < 4000) {
    tries += 1;
    const p = rnd();
    if (stars.some((s) => dist(p[0], p[1], s[0], s[1]) < 30)) continue;
    if (decoyEnds.some((e) => dist(p[0], p[1], e[0], e[1]) < 28)) continue;
    stars.push(p);
  }
  return { stars, lines, glyphLines };
}

/** Lines that light up: a star sits on both ends (stars given in line-plate coordinates). */
export function litLines(art: PlateArt, stars: readonly Pt[]): number[] {
  const on = (p: Pt) => stars.some((s) => dist(p[0], p[1], s[0], s[1]) < 8);
  return art.lines.map((l, i) => ({ l, i })).filter(({ l }) => on(l[0]) && on(l[1])).map(({ i }) => i);
}

/** Star positions relative to the line plate, for the star plate's centre and turn. */
export function starsOnLinePlate(art: PlateArt, cx: number, cy: number, turned: boolean): Pt[] {
  return art.stars.map(([x, y]) => (turned ? [-x, -y] : [x, y]) as Pt).map(([x, y]) => [cx + x - LINE_PLATE[0], cy + y - LINE_PLATE[1]] as Pt);
}

export const glassPlates: PuzzleDef = {
  id: 'glass-plates',
  name: 'Hai tấm kính',
  answer: [...GLYPH_SPOTS].sort((a, b) => a.phase - b.phase).map((g) => g.id),
  fireflies: [
    { id: 'glass-plates/box', layer: 'back', x: 1450, y: 820 },
    { id: 'glass-plates/shelf', layer: 'back', x: 160, y: 120 },
  ],
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    const art = plateArt();
    let pos: [number, number] = [STAR_START[0], STAR_START[1]];
    let turned = true;
    let shownTurn = 180;
    const hinted: ('turn' | 'place')[] = [];

    // Back: workshop wall and the light box.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#16131f' }, back);
    el('rect', { x: LINE_PLATE[0] - PLATE.w / 2 - 40, y: LINE_PLATE[1] - PLATE.h / 2 - 40, width: PLATE.w + 80, height: PLATE.h + 80, rx: 18, fill: '#2d2a3c' }, back);
    el('rect', { x: LINE_PLATE[0] - PLATE.w / 2 - 14, y: LINE_PLATE[1] - PLATE.h / 2 - 14, width: PLATE.w + 28, height: PLATE.h + 28, rx: 10, class: 'lightbox' }, back);
    scene.grain('back', 0.4);

    // Mid: the line plate, fixed on the light box.
    const linePlate = el('g', { transform: `translate(${LINE_PLATE[0]} ${LINE_PLATE[1]})` }, mid);
    el('rect', { x: -PLATE.w / 2, y: -PLATE.h / 2, width: PLATE.w, height: PLATE.h, rx: 8, class: 'glass' }, linePlate);
    const lineNodes = art.lines.map(([a, b]) => el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], class: 'scratch' }, linePlate));
    const glowLines = el('g', { filter: url(DEF.glow) }, linePlate);

    // Front: the star plate.
    const ghost = el('rect', { x: LINE_PLATE[0] - PLATE.w / 2, y: LINE_PLATE[1] - PLATE.h / 2, width: PLATE.w, height: PLATE.h, rx: 8, class: 'plate-ghost', opacity: 0 }, front);
    const starPlate = el('g', { class: 'star-plate interactive', tabindex: 0, role: 'button', 'aria-label': 'Tấm kính có sao' }, front);
    const turn = el('g', {}, starPlate);
    el('rect', { x: -PLATE.w / 2, y: -PLATE.h / 2, width: PLATE.w, height: PLATE.h, rx: 8, class: 'glass top' }, turn);
    el('path', { d: `M${-PLATE.w / 2 + 14} ${-PLATE.h / 2 + 14} l26 0 m-26 0 l0 26`, class: 'plate-corner' }, turn);
    for (const [x, y] of art.stars) el('circle', { cx: x, cy: y, r: 6, class: 'plate-star' }, turn);
    // Moons painted beside the real constellations, plus a few loose ones to mislead.
    for (const g of GLYPH_SPOTS) moonPhase(turn, g.phase, g.x + GLYPH_SIZE / 2 + 18, g.y - GLYPH_SIZE / 2 + 4, 12, { class: 'moon-phase etched' });
    moonPhase(turn, 4, -PLATE.w / 2 + 60, PLATE.h / 2 - 40, 12, { class: 'moon-phase etched' });
    moonPhase(turn, 2, PLATE.w / 2 - 50, PLATE.h / 2 - 60, 12, { class: 'moon-phase etched' });

    let wasAligned = false;
    const render = () => {
      starPlate.setAttribute('transform', `translate(${pos[0].toFixed(1)} ${pos[1].toFixed(1)})`);
      turn.setAttribute('transform', `rotate(${shownTurn.toFixed(1)})`);
      const aligned = !turned && pos[0] === LINE_PLATE[0] && pos[1] === LINE_PLATE[1];
      const lit = aligned ? litLines(art, starsOnLinePlate(art, pos[0], pos[1], false)) : [];
      glowLines.replaceChildren();
      lineNodes.forEach((n, i) => n.classList.toggle('lit', lit.includes(i)));
      for (const i of lit) {
        const [a, b] = art.lines[i];
        el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], class: 'scratch-glow' }, glowLines);
      }
      if (aligned && !wasAligned) sound.chime();
      wasAligned = aligned;
      ghost.setAttribute('opacity', hinted.includes('place') && !aligned ? '1' : '0');
    };

    const snap = () => {
      if (Math.abs(pos[0] - LINE_PLATE[0]) < SNAP && Math.abs(pos[1] - LINE_PLATE[1]) < SNAP) pos = [LINE_PLATE[0], LINE_PLATE[1]];
      render();
    };
    const flip = () => {
      turned = !turned;
      const from = shownTurn;
      tween(350, (t) => {
        shownTurn = from + 180 * t;
        render();
      });
      sound.paper();
    };

    let grab = [0, 0];
    let start = [0, 0];
    let moved = false;
    scene.draggable(starPlate, {
      start: (p) => {
        grab = [p.x - pos[0], p.y - pos[1]];
        start = [p.x, p.y];
        moved = false;
      },
      move: (p) => {
        if (!moved && dist(p.x, p.y, start[0], start[1]) < 6) return;
        moved = true;
        pos = [clamp(p.x - grab[0], 200, SCENE_W - 200), clamp(p.y - grab[1], 160, SCENE_H - 160)];
        render();
      },
      end: () => {
        if (!moved) flip();
        else {
          sound.paper();
          snap();
        }
      },
    });
    starPlate.addEventListener('keydown', (event) => {
      const moves: Record<string, [number, number]> = { ArrowLeft: [-20, 0], ArrowRight: [20, 0], ArrowUp: [0, -20], ArrowDown: [0, 20] };
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'r') flip();
      else if (moves[event.key]) {
        pos = [pos[0] + moves[event.key][0], pos[1] + moves[event.key][1]];
        snap();
      } else return;
      event.preventDefault();
    });
    render();

    return {
      revealHints: (count) => {
        while (hinted.length < count) {
          const next = (['turn', 'place'] as const).find((k) => !hinted.includes(k) && (k === 'turn' ? turned : !(pos[0] === LINE_PLATE[0] && pos[1] === LINE_PLATE[1])));
          if (!next) break;
          hinted.push(next);
        }
        render();
        return hinted.length;
      },
      hintSteps: (): HintStep[] => {
        const placed = pos[0] === LINE_PLATE[0] && pos[1] === LINE_PLATE[1];
        const key = [...hinted].reverse().find((k) => (k === 'turn' ? turned : !placed));
        if (key === undefined) return [];
        const steps: HintStep[] = [];
        if (turned) steps.push({ note: 'Bấm (không kéo) tấm kính có sao để xoay ngược 180° cho đúng chiều.', targets: [{ x: pos[0], y: pos[1], r: 120, verb: 'rotate' }] });
        if (!placed) steps.push({ note: 'Kéo tấm kính có sao đặt khít vào khung vàng trên hộp đèn.', targets: [{ x: pos[0], y: pos[1] + 90, r: 80, verb: 'drag', to: { x: LINE_PLATE[0], y: LINE_PLATE[1] + 90 } }] });
        steps.push({ note: 'Khi khít và đúng chiều, chỉ những đường có sao ở cả hai đầu mới sáng lên. Đọc các chòm sáng, cùng trăng cạnh chúng.', targets: [{ x: LINE_PLATE[0], y: LINE_PLATE[1], r: 250, verb: 'look' }] });
        return steps;
      },
      destroy: () => undefined,
    };
  },
};
