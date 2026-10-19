import { drawOwl } from '../core/owl';
import type { GlyphId } from '../core/glyphs';
import { GLYPHS, glyph, placeStars } from '../core/glyphs';
import { SCENE_H, SCENE_W } from '../core/scene';
import { asButton, el } from '../core/svg';
import { clamp } from '../core/tween';
import type { HintStep, PuzzleDef } from './types';
import { tr } from '../core/i18n';

/**
 * Chapter 3, level 3 — the row of glasses ("dàn ly nước"). Nine bronze bells hang in a row,
 * each engraved with a constellation. Seven glasses of water stand below, each tuned to one
 * bell: strike that bell and its glass ripples (the sound is not needed — the water shows
 * it). Two bells match no glass. Only glasses with a lotus afloat count, and they are read
 * from the lowest water to the highest; the answer is the constellations on the bells that
 * made those glasses ripple.
 */

export const BELLS: readonly GlyphId[] = GLYPHS.map((g) => g.id);

export interface GlassDef {
  /** The bell (index into BELLS) this glass is tuned to. */
  bell: number;
  /** Water depth as a share of the glass, 0..1. */
  level: number;
  lotus: boolean;
}

/** Left to right on the shelf. */
export const GLASSES: readonly GlassDef[] = [
  { bell: 2, level: 0.78, lotus: true },
  { bell: 7, level: 0.15, lotus: false },
  { bell: 0, level: 0.42, lotus: true },
  { bell: 6, level: 0.68, lotus: false },
  { bell: 5, level: 0.28, lotus: true },
  { bell: 8, level: 0.58, lotus: true },
  { bell: 3, level: 0.5, lotus: false },
];

/** Which glass rings when this bell is struck, or -1 when none does. */
export const glassFor = (bell: number): number => GLASSES.findIndex((g) => g.bell === bell);

/** The answer: lotus glasses, lowest water first, as the bells that ring them. */
export const READING_ORDER: readonly number[] = GLASSES.map((g, i) => ({ g, i }))
  .filter(({ g }) => g.lotus)
  .sort((a, b) => a.g.level - b.g.level)
  .map(({ i }) => i);

export const BELL_X = (i: number): number => 150 + i * 162.5;
export const BELL_Y = 240;
export const GLASS_X = (k: number): number => 190 + k * 205;
export const GLASS = { w: 112, h: 210, bottom: 800 };
const FILL_H = GLASS.h - 20;
export const waterY = (level: number): number => GLASS.bottom - 10 - level * FILL_H;

/** How long a ripple lasts, in seconds. */
export const RIPPLE_S = 1.8;
const swing = (t: number) => (t < 0 ? 0 : 14 * Math.exp(-3.2 * t) * Math.sin(17 * t));

export const glassChimes: PuzzleDef = {
  id: 'glass-chimes',
  get name() {
    return tr('Dàn ly nước', 'Water Glasses');
  },
  answer: READING_ORDER.map((k) => BELLS[GLASSES[k].bell]),
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    const bellNodes: SVGGElement[] = [];
    const rings = GLASSES.map(() => null as SVGGElement | null);
    const waters = GLASSES.map(() => null as SVGGElement | null);
    const struck: { bell: number; at: number }[] = [];
    const rippling: { glass: number; at: number }[] = [];
    let frame = 0;

    // Back: the temple porch at night.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#1c1a2b' }, back);
    for (let x = 100; x < SCENE_W; x += 220) el('rect', { x: x - 10, y: 0, width: 20, height: SCENE_H, fill: '#171526' }, back);
    el('rect', { x: -60, y: 826, width: SCENE_W + 120, height: 120, fill: '#2d2433' }, back);
    scene.grain('back', 0.45);

    // Mid: the beam with its bells, and the shelf with its glasses.
    el('rect', { x: 50, y: 100, width: 1500, height: 18, rx: 6, fill: '#5a3f2a', stroke: '#3a2818', 'stroke-width': 3 }, mid);
    BELLS.forEach((id, i) => {
      const x = BELL_X(i);
      el('line', { x1: x, y1: 118, x2: x, y2: BELL_Y - 70, stroke: '#8a6a48', 'stroke-width': 3 }, mid);
      const swinger = el('g', { transform: `translate(${x} 118)`, 'data-hint': `bell-${i}` }, mid);
      const body = el('g', { transform: `translate(${-x} -118)` }, swinger);
      const hit = el('g', { class: 'bell interactive' }, body);
      el('path', { d: `M${x - 52} ${BELL_Y + 70} Q${x - 56} ${BELL_Y - 20} ${x} ${BELL_Y - 70} Q${x + 56} ${BELL_Y - 20} ${x + 52} ${BELL_Y + 70} Z`, fill: '#cfa04a', stroke: '#7e5b1c', 'stroke-width': 4 }, hit);
      el('rect', { x: x - 60, y: BELL_Y + 64, width: 120, height: 14, rx: 6, fill: '#e2bd6b', stroke: '#7e5b1c', 'stroke-width': 3 }, hit);
      el('circle', { cx: x, cy: BELL_Y + 92, r: 9, fill: '#7e5b1c' }, hit);
      for (const [sx, sy] of placeStars(id, x, BELL_Y + 10, 70)) el('circle', { cx: sx.toFixed(1), cy: sy.toFixed(1), r: 5.5, fill: '#fff3c8' }, hit);
      bellNodes.push(swinger);
      asButton(hit, tr(`Chuông ${glyph(id).name}`, `${glyph(id).name} bell`), () => strike(i));
    });

    el('rect', { x: 60, y: GLASS.bottom, width: 1480, height: 26, rx: 8, fill: '#5a3f2a', stroke: '#3a2818', 'stroke-width': 3 }, mid);
    GLASSES.forEach((g, k) => {
      const x = GLASS_X(k);
      const grp = el('g', { transform: `translate(${x} 0)`, 'data-hint': `glass-${k}`, 'pointer-events': 'none' }, mid);
      const wy = waterY(g.level);
      const water = el('g', {}, grp);
      waters[k] = water;
      el('rect', { x: -GLASS.w / 2, y: wy, width: GLASS.w, height: GLASS.bottom - 6 - wy, rx: 6, fill: '#6fb4d8', opacity: 0.75 }, water);
      el('ellipse', { cx: 0, cy: wy, rx: GLASS.w / 2, ry: 9, fill: '#a5d8ee', opacity: 0.9 }, water);
      el('path', {
        d: `M${-GLASS.w / 2} ${GLASS.bottom - GLASS.h} V${GLASS.bottom - 10} Q${-GLASS.w / 2} ${GLASS.bottom} ${-GLASS.w / 2 + 12} ${GLASS.bottom} H${GLASS.w / 2 - 12} Q${GLASS.w / 2} ${GLASS.bottom} ${GLASS.w / 2} ${GLASS.bottom - 10} V${GLASS.bottom - GLASS.h}`,
        fill: 'none', stroke: '#d8ecf5', 'stroke-width': 4, opacity: 0.85, 'stroke-linejoin': 'round',
      }, grp);
      if (g.lotus) {
        const lotus = el('g', { transform: `translate(0 ${wy - 4})` }, water);
        for (const a of [-50, -25, 0, 25, 50]) {
          el('ellipse', { cx: 0, cy: -13, rx: 7, ry: 15, fill: '#f4b9d0', stroke: '#c0678b', 'stroke-width': 2, transform: `rotate(${a})` }, lotus);
        }
        el('circle', { cy: -6, r: 5, fill: '#f6d86a' }, lotus);
        el('ellipse', { cx: -30, cy: 2, rx: 14, ry: 5, fill: '#3f8a4e' }, lotus);
        el('ellipse', { cx: 30, cy: 2, rx: 14, ry: 5, fill: '#3f8a4e' }, lotus);
      }
      rings[k] = el('g', { transform: `translate(0 ${wy})`, fill: 'none', stroke: '#0e4670', 'stroke-width': 5 }, water);
    });

    drawOwl(front, 1545, 770, 0.55);

    const loop = (now: number) => {
      const t = now / 1000;
      for (const s of struck) bellNodes[s.bell].setAttribute('transform', `translate(${BELL_X(s.bell)} 118) rotate(${swing(t - s.at).toFixed(2)})`);
      for (let n = struck.length - 1; n >= 0; n -= 1) {
        if (t - struck[n].at > 2.2) {
          bellNodes[struck[n].bell].setAttribute('transform', `translate(${BELL_X(struck[n].bell)} 118)`);
          struck.splice(n, 1);
        }
      }
      rings.forEach((r, k) => {
        if (!r) return;
        r.replaceChildren();
        const w = rippling.find((x) => x.glass === k);
        if (!w) {
          waters[k]?.setAttribute('transform', '');
          return;
        }
        const age = Math.max(0, t - w.at);
        if (age > RIPPLE_S) {
          waters[k]?.setAttribute('transform', '');
          return;
        }
        const fade = 1 - age / RIPPLE_S;
        waters[k]?.setAttribute('transform', `translate(0 ${(-5 * fade * Math.sin(age * 26)).toFixed(1)})`);
        for (let n = 0; n < 3; n += 1) {
          const ph = (age * 0.9 + n / 3) % 1;
          el('ellipse', { rx: (8 + ph * 46).toFixed(1), ry: (3 + ph * 14).toFixed(1), opacity: Math.min(1, (1 - ph) * 1.6 * (0.35 + fade)).toFixed(2) }, r);
        }
      });
      for (let n = rippling.length - 1; n >= 0; n -= 1) if (t - rippling[n].at > RIPPLE_S) rippling.splice(n, 1);
      frame = struck.length || rippling.length ? requestAnimationFrame(loop) : 0;
    };

    function strike(bell: number): void {
      const t = performance.now() / 1000;
      sound.note(BELLS[bell]);
      struck.push({ bell, at: t });
      const glass = glassFor(bell);
      if (glass >= 0) rippling.push({ glass, at: t });
      if (!frame) frame = requestAnimationFrame(loop);
    }

    return {
      // Nothing is marked in the scene; the hint card shows the whole solution instead.
      revealHints: () => 0,
      hintSteps: (): HintStep[] => {
        const first = READING_ORDER[0];
        const bell = GLASSES[first].bell;
        return [
          {
            note: tr('Chạm một chuông: nếu có ly cùng nốt thì mặt nước ly đó gợn sóng. Làm lần lượt với cả 9 chuông; có 2 chuông không làm ly nào gợn.', 'Tap a bell: if a glass has the same note, its water ripples. Go through all 9 bells; 2 bells make no glass ripple.'),
            targets: [{
              x: BELL_X(bell), y: BELL_Y + 10, r: 70, verb: 'tap',
              act: (picture) => {
                const water = picture.querySelector(`[data-hint="glass-${first}"]`);
                const ringsG = water ? el('g', { transform: `translate(0 ${waterY(GLASSES[first].level)})`, fill: 'none', stroke: '#0e4670', 'stroke-width': 5 }, water) : null;
                return (p) => {
                  ringsG?.replaceChildren();
                  if (!ringsG || p <= 0) return;
                  for (let n = 0; n < 3; n += 1) {
                    const ph = (p * 1.4 + n / 3) % 1;
                    el('ellipse', { rx: (4 + ph * 48).toFixed(1), ry: (1.5 + ph * 11).toFixed(1), opacity: clamp(1 - ph, 0, 1).toFixed(2) }, ringsG);
                  }
                };
              },
            }],
          },
          {
            note: tr('Chỉ tính các ly có hoa sen. Xếp chúng theo mực nước từ thấp lên cao, rồi đọc chòm trên chuông làm mỗi ly gợn.', 'Only count the glasses with a lotus flower. Order them by water level from low to high, then read the constellation on the bell that makes each one ripple.'),
            targets: READING_ORDER.map((k) => ({ x: GLASS_X(k), y: waterY(GLASSES[k].level), r: 70, verb: 'look' as const })),
            prepare: (picture) => {
              const overlay = picture.querySelector('.layer-overlay') ?? picture;
              READING_ORDER.forEach((k, n) => {
                const b = GLASSES[k].bell;
                const stars = placeStars(BELLS[b], BELL_X(b), BELL_Y + 10, 70);
                for (const [p, q] of glyph(BELLS[b]).lines) {
                  el('line', { x1: stars[p][0], y1: stars[p][1], x2: stars[q][0], y2: stars[q][1], class: 'hint-line', 'pointer-events': 'none' }, overlay);
                }
                const badge = el('g', { transform: `translate(${GLASS_X(k)} ${GLASS.bottom - GLASS.h - 30})`, 'pointer-events': 'none' }, overlay);
                el('circle', { r: 17, class: 'number-badge' }, badge);
                el('text', { y: 1, class: 'number-text' }, badge).textContent = String(n + 1);
              });
            },
          },
        ];
      },
      destroy: () => cancelAnimationFrame(frame),
    };
  },
};
