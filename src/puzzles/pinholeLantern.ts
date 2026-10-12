import { DEF, url } from '../core/defs';
import { glyph, type GlyphId } from '../core/glyphs';
import { SCENE_H, SCENE_W } from '../core/scene';
import { asButton, el, moonPhase, uid } from '../core/svg';
import { clamp, easeInOutSine, tween } from '../core/tween';
import { dist, starfield } from './sky';
import type { HintStep, PuzzleDef } from './types';

/**
 * Level 4 — the pinhole lantern ("đèn lồng lỗ kim"). Light the candle inside and
 * the lantern throws dots of light onto the wall: a constellation without its
 * lines, and mirrored. Turn the lantern to throw each of its four faces; the moon
 * painted on the face towards you gives the order.
 */

export const FACES: readonly { glyph: GlyphId; phase: number }[] = [
  { glyph: 'arrow', phase: 3 },
  { glyph: 'hook', phase: 1 },
  { glyph: 'belt', phase: 4 },
  { glyph: 'dipper', phase: 2 },
];
export const LANTERN = { x: 800, y: 650, size: 220 };
export const CANDLE_START: readonly [number, number] = [1180, 760];
export const WALL = { x: 800, y: 270, size: 330 };

/** Where the light dots of a face land on the wall: the constellation mirrored left–right. */
export function projectedDots(id: GlyphId): [number, number][] {
  const s = WALL.size / 100;
  return glyph(id).stars.map(([x, y]) => [WALL.x - (x - 50) * s, WALL.y + (y - 50) * s]);
}

export const lightsLantern = (x: number, y: number): boolean => dist(x, y, LANTERN.x, LANTERN.y) < 110;

export const pinholeLantern: PuzzleDef = {
  id: 'pinhole-lantern',
  name: 'Đèn lồng lỗ kim',
  answer: [...FACES].sort((a, b) => a.phase - b.phase).map((f) => f.glyph),
  fireflies: [
    { id: 'pinhole-lantern/shelf', layer: 'back', x: 1460, y: 520 },
    { id: 'pinhole-lantern/floor', layer: 'mid', x: 160, y: 850 },
  ],
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    let lit = false;
    let face = 0;
    let candle: [number, number] = [CANDLE_START[0], CANDLE_START[1]];
    const hinted: ('light' | number)[] = [];
    let cancelTurn: (() => void) | null = null;

    // Back: a dark plaster wall, a shelf, and the table.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#191523' }, back);
    starfield(back, { x: 1300, y: 60, w: 220, h: 300 }, 30, 41);
    el('rect', { x: 1280, y: 40, width: 260, height: 340, fill: 'none', stroke: '#2e2638', 'stroke-width': 14 }, back);
    el('rect', { x: 1360, y: 540, width: 200, height: 14, fill: '#3a2c3a' }, back);
    el('rect', { x: -60, y: 760, width: SCENE_W + 120, height: 200, fill: '#2b1f1a' }, back);
    scene.grain('back', 0.4);

    // Mid: the glow and light dots on the wall.
    const glowId = uid('lantern-glow');
    const glow = el('radialGradient', { id: glowId }, scene.defs);
    el('stop', { offset: 0, 'stop-color': '#f4c66a', 'stop-opacity': 0.28 }, glow);
    el('stop', { offset: 1, 'stop-color': '#f4c66a', 'stop-opacity': 0 }, glow);
    const wallGlow = el('ellipse', { cx: WALL.x, cy: WALL.y + 60, rx: 420, ry: 320, fill: url(glowId), opacity: 0 }, mid);
    const projection = el('g', { filter: url(DEF.glow), opacity: 0 }, mid);
    const hintLines = el('g', { class: 'hint-lines' }, mid);

    // Front: the lantern and the candle.
    const lanternG = el('g', { class: 'pin-lantern interactive', transform: `translate(${LANTERN.x} ${LANTERN.y})` }, front);
    const h = LANTERN.size / 2;
    el('path', { d: `M${-h - 20} ${-h} L0 ${-h - 70} L${h + 20} ${-h} Z`, fill: '#5e2f22' }, lanternG);
    el('circle', { cx: 0, cy: -h - 82, r: 12, fill: 'none', stroke: '#3a2c3a', 'stroke-width': 5 }, lanternG);
    const body = el('g', { 'data-hint': 'lantern-body' }, lanternG);
    el('rect', { x: -h, y: -h, width: 2 * h, height: 2 * h, rx: 6, class: 'pin-face' }, body);
    el('rect', { x: -h, y: -h, width: 2 * h, height: 2 * h, rx: 6, fill: 'none', stroke: '#3a2620', 'stroke-width': 10 }, body);
    for (const x of [-h / 3, h / 3]) el('line', { x1: x, y1: -h, x2: x, y2: h, stroke: '#3a2620', 'stroke-width': 4, opacity: 0.6 }, body);
    const phaseSlot = el('g', {}, body);
    el('rect', { x: -h - 16, y: h, width: 2 * h + 32, height: 24, rx: 4, fill: '#3a2620' }, lanternG);

    const candleG = el('g', { class: 'candle interactive', tabindex: 0, role: 'button', 'aria-label': 'Cây nến', 'data-hint': 'candle' }, front);
    el('rect', { x: -40, y: -100, width: 80, height: 140, fill: 'transparent' }, candleG);
    el('ellipse', { cx: 0, cy: 34, rx: 30, ry: 8, fill: '#8a6a45' }, candleG);
    el('rect', { x: -12, y: -30, width: 24, height: 64, rx: 4, fill: '#efe6d2' }, candleG);
    el('path', { d: 'M0 -78 Q13 -54 0 -34 Q-13 -54 0 -78 Z', fill: '#f4c66a', filter: url(DEF.glow), class: 'flame' }, candleG);

    const drawFace = () => {
      phaseSlot.replaceChildren();
      moonPhase(phaseSlot, FACES[face].phase, 0, 0, 34, { class: 'moon-phase painted' });
      projection.replaceChildren();
      for (const [x, y] of projectedDots(FACES[face].glyph)) el('circle', { cx: x, cy: y, r: 11, fill: '#fff1c4' }, projection);
      drawHintLines();
    };
    const drawHintLines = () => {
      hintLines.replaceChildren();
      if (!lit || !hinted.includes(face)) return;
      const dots = projectedDots(FACES[face].glyph);
      for (const [a, b] of glyph(FACES[face].glyph).lines) {
        el('line', { x1: dots[a][0], y1: dots[a][1], x2: dots[b][0], y2: dots[b][1], class: 'hint-line' }, hintLines);
      }
    };
    const showLight = () => {
      lanternG.classList.toggle('lit', lit);
      tween(500, (t) => {
        projection.setAttribute('opacity', String(lit ? t : 0));
        wallGlow.setAttribute('opacity', String(lit ? t : 0));
      });
    };

    const renderCandle = () => {
      candleG.setAttribute('transform', `translate(${candle[0].toFixed(1)} ${candle[1].toFixed(1)})`);
      candleG.style.display = lit ? 'none' : '';
    };
    const tryLight = () => {
      if (lit || !lightsLantern(candle[0], candle[1])) return;
      lit = true;
      sound.chime();
      renderCandle();
      showLight();
      drawFace();
    };
    let grab = [0, 0];
    scene.draggable(candleG, {
      start: (p) => (grab = [p.x - candle[0], p.y - candle[1]]),
      move: (p) => {
        candle = [clamp(p.x - grab[0], 60, SCENE_W - 60), clamp(p.y - grab[1], 300, SCENE_H - 40)];
        renderCandle();
      },
      end: tryLight,
    });
    candleG.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      candle = [LANTERN.x, LANTERN.y];
      tryLight();
    });

    const turn = () => {
      cancelTurn?.();
      sound.paper();
      let swapped = false;
      cancelTurn = tween(420, (t) => {
        const sx = Math.max(0.05, Math.abs(Math.cos(t * Math.PI)));
        body.setAttribute('transform', `scale(${sx.toFixed(3)} 1)`);
        projection.setAttribute('opacity', lit ? sx.toFixed(2) : '0');
        if (!swapped && t >= 0.5) {
          swapped = true;
          face = (face + 1) % FACES.length;
          drawFace();
        }
      }, easeInOutSine);
    };
    asButton(lanternG, 'Xoay đèn lồng', turn);

    renderCandle();
    drawFace();

    const nextHint = (): 'light' | number | undefined => {
      if (!lit && !hinted.includes('light')) return 'light';
      return [...FACES.keys()].sort((a, b) => FACES[a].phase - FACES[b].phase).find((f) => !hinted.includes(f));
    };
    return {
      revealHints: (count) => {
        while (hinted.length < count) {
          const next = nextHint();
          if (next === undefined) break;
          hinted.push(next);
        }
        drawHintLines();
        return hinted.length;
      },
      hintSteps: (): HintStep[] => {
        const steps: HintStep[] = [];
        if (!lit) {
          steps.push({
            note: 'Kéo cây nến vào trong đèn lồng để thắp sáng.',
            targets: [{ x: candle[0], y: candle[1] - 30, r: 70, verb: 'drag', to: { x: LANTERN.x, y: LANTERN.y - 30 }, object: '[data-hint="candle"]' }],
            apply: () => {
              candle = [LANTERN.x, LANTERN.y];
              lit = true;
              renderCandle();
              lanternG.classList.add('lit');
              projection.setAttribute('opacity', '1');
              wallGlow.setAttribute('opacity', '1');
              drawFace();
            },
          });
        }
        // One tap step and one reading step stand for all four faces: the same two moves repeat.
        steps.push({
          note: 'Bấm đèn lồng để xoay sang mặt khác. Đèn có 4 mặt, mỗi mặt chiếu một chòm sao lên tường.',
          targets: [{ x: LANTERN.x, y: LANTERN.y, r: 150, verb: 'tap', object: '[data-hint="lantern-body"]', flip: true }],
        });
        steps.push({
          note: 'Chấm sáng trên tường bị lật như soi gương. Trăng trên mặt đèn cho biết thứ tự: khuyết → nửa → gần tròn → tròn.',
          targets: [{ x: WALL.x, y: WALL.y, r: 210, verb: 'look' }, { x: LANTERN.x, y: LANTERN.y, r: 70, verb: 'look' }],
        });
        return steps;
      },
      destroy: () => cancelTurn?.(),
    };
  },
};
