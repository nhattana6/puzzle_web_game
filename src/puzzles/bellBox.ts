import { drawOwl } from '../core/owl';
import { GLYPHS } from '../core/glyphs';
import { SCENE_H, SCENE_W } from '../core/scene';
import { asButton, el } from '../core/svg';
import { clamp } from '../core/tween';
import type { HintStep, PuzzleDef } from './types';
import { tr } from '../core/i18n';

/**
 * Chapter 2, level 4 — the bell box ("hộp chuông"). Nine bells hang in a 3×3 grid laid out
 * (and tuned) like the keypad. Winding the key stores one note per turn; when you stop, the
 * box plays that many notes of a fixed tune, striking a bell for each one, and a little bell on
 * the lid ends it. Fewer than four turns and the tune stops partway. The answer is the keys
 * in the places of the four bells struck, in the order they were struck. A struck bell swings,
 * so it can be followed with the sound off; nothing is lit or marked.
 */

/** The bells struck in order, as positions in the 3×3 grid (0 is top-left, 8 bottom-right). */
export const SEQUENCE: readonly number[] = [4, 8, 1, 6];
/** The bell on the lid, which rings last and belongs to no key. */
export const LID = 9;
/** Four bells and the lid: more turns than this add nothing. */
export const MAX_TURNS = SEQUENCE.length + 1;
/** How long after the last turn the box starts, and the time between notes. */
export const REST_MS = 900;
export const STEP_MS = 650;

export const BELL_X = [630, 800, 970] as const;
export const BELL_Y = [300, 470, 640] as const;
export const bellSpot = (i: number): [number, number] => [BELL_X[i % 3], BELL_Y[Math.floor(i / 3)]];
const LID_SPOT: [number, number] = [800, 128];
const KEY_SPOT: [number, number] = [1260, 520];

/** The bells that sound after `turns` turns of the key, in order. */
export function melodyFor(turns: number): number[] {
  const n = clamp(Math.floor(turns), 0, MAX_TURNS);
  return Array.from({ length: n }, (_, i) => (i < SEQUENCE.length ? SEQUENCE[i] : LID));
}

/** How far a bell hangs from straight (degrees) `t` seconds after it was struck. */
export const swing = (t: number): number => (t < 0 ? 0 : 16 * Math.exp(-4 * t) * Math.sin(18 * t));

export const bellBox: PuzzleDef = {
  id: 'bell-box',
  get name() {
    return tr('Hộp chuông', 'Bell Box');
  },
  answer: SEQUENCE.map((i) => GLYPHS[i].id),
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;
    const struck: (number | null)[] = new Array(LID + 1).fill(null);
    const swings: SVGGElement[] = [];
    let turns = 0;
    let lastTurn = 0;
    let waiting = false;
    let playing: { start: number; events: number[]; next: number } | null = null;
    let keyAngle = 0;
    let keyShown = 0;
    let frame = 0;

    // Back: the attic wall.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#241a17' }, back);
    for (let x = 80; x < SCENE_W; x += 160) el('line', { x1: x, y1: -20, x2: x, y2: SCENE_H + 20, stroke: '#1a1210', 'stroke-width': 4 }, back);
    el('rect', { x: -60, y: 828, width: SCENE_W + 120, height: 120, fill: '#3a2a22' }, back);
    scene.grain('back', 0.4);

    // Mid: the box, its bells on rods, the lid bell, and the winding key.
    el('rect', { x: 450, y: 205, width: 700, height: 46, rx: 8, fill: '#5a3f2a' }, mid);
    el('rect', { x: 470, y: 250, width: 660, height: 548, rx: 8, fill: '#4a3322' }, mid);
    el('rect', { x: 500, y: 272, width: 600, height: 504, rx: 4, fill: '#1c1411' }, mid);
    for (const y of BELL_Y) el('rect', { x: 510, y: y - 6, width: 580, height: 8, rx: 3, fill: '#8a6a48' }, mid);

    const drawBell = (parent: Element, index: number, scale: number): void => {
      const hanging = el('g', { 'data-swing': index }, parent);
      el('line', { x1: 0, y1: 0, x2: 0, y2: 24, stroke: '#8a6a48', 'stroke-width': 3 }, hanging);
      const body = el('g', { transform: `scale(${scale})` }, hanging);
      el('path', { d: 'M-34 92 Q-36 46 0 36 Q36 46 34 92 Z', fill: '#d3a64f', stroke: '#8a6a2c', 'stroke-width': 4 }, body);
      el('rect', { x: -43, y: 90, width: 86, height: 12, rx: 5, fill: '#e2bd6b', stroke: '#8a6a2c', 'stroke-width': 3 }, body);
      el('circle', { cx: 0, cy: 110, r: 8, fill: '#8a6a2c' }, body);
      swings[index] = hanging;
    };
    for (let i = 0; i < 9; i += 1) {
      const [x, y] = bellSpot(i);
      drawBell(el('g', { transform: `translate(${x} ${y})` }, mid), i, 1);
    }
    // The lid bell, on a small bracket.
    el('path', { d: 'M740 206 Q740 110 800 108 Q860 110 860 206', fill: 'none', stroke: '#5a3f2a', 'stroke-width': 10 }, mid);
    drawBell(el('g', { transform: `translate(${LID_SPOT[0]} ${LID_SPOT[1] + 6})` }, mid), LID, 0.62);

    // The glass front, over the bells.
    el('rect', { x: 500, y: 272, width: 600, height: 504, rx: 4, fill: '#cfe4ff', opacity: 0.07, 'pointer-events': 'none' }, mid);
    el('path', { d: 'M520 280 L700 280 L520 560 Z', fill: '#fff', opacity: 0.05, 'pointer-events': 'none' }, mid);

    // The winding key: tap it once per turn.
    el('circle', { cx: KEY_SPOT[0], cy: KEY_SPOT[1], r: 54, fill: '#3a2a22', stroke: '#8a6a48', 'stroke-width': 5, 'pointer-events': 'none' }, mid);
    el('rect', { x: 1130, y: KEY_SPOT[1] - 8, width: 130, height: 16, fill: '#8a6a48', 'pointer-events': 'none' }, mid);
    // The outer group is what the hint moves; the inner one turns with each tap.
    const key = el('g', { class: 'bell-key interactive', 'data-hint': 'key', transform: `translate(${KEY_SPOT[0]} ${KEY_SPOT[1]})` }, mid);
    const keyTurn = el('g', {}, key);
    el('circle', { r: 76, fill: 'transparent' }, keyTurn);
    el('ellipse', { cx: -34, cy: 0, rx: 34, ry: 19, fill: '#d3a64f', stroke: '#8a6a2c', 'stroke-width': 4 }, keyTurn);
    el('ellipse', { cx: 34, cy: 0, rx: 34, ry: 19, fill: '#d3a64f', stroke: '#8a6a2c', 'stroke-width': 4 }, keyTurn);
    el('circle', { r: 16, fill: '#e2bd6b', stroke: '#8a6a2c', 'stroke-width': 4 }, keyTurn);
    drawOwl(front, 300, 790, 0.9);

    const place = () => keyTurn.setAttribute('transform', `rotate(${keyShown.toFixed(1)})`);

    asButton(key, tr('Chìa khoá lên dây', 'Winding key'), () => {
      if (playing) return;
      turns = Math.min(turns + 1, MAX_TURNS);
      keyAngle += 90;
      lastTurn = performance.now();
      waiting = true;
      sound.knock();
    });

    const strike = (bell: number, now: number) => {
      struck[bell] = now;
      if (bell === LID) sound.ding();
      else sound.note(GLYPHS[bell].id);
    };

    const tick = (now: number) => {
      keyShown += (keyAngle - keyShown) * 0.25;
      if (Math.abs(keyAngle - keyShown) < 0.2) keyShown = keyAngle;
      place();
      if (waiting && !playing && now - lastTurn > REST_MS) {
        playing = { start: now + 250, events: melodyFor(turns), next: 0 };
        waiting = false;
        turns = 0;
      }
      if (playing) {
        const p = playing;
        while (p.next < p.events.length && now >= p.start + p.next * STEP_MS) {
          strike(p.events[p.next], now);
          p.next += 1;
        }
        if (p.next >= p.events.length && now > p.start + p.events.length * STEP_MS + 800) playing = null;
      }
      struck.forEach((at, bell) => {
        if (at === null) return;
        const t = (now - at) / 1000;
        if (t > 1.8) {
          struck[bell] = null;
          swings[bell].setAttribute('transform', '');
          return;
        }
        swings[bell].setAttribute('transform', `rotate(${swing(t).toFixed(2)})`);
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    place();

    return {
      // Nothing is marked in the scene; the hint card shows the whole solution instead.
      revealHints: () => 0,
      hintSteps: (): HintStep[] => {
        const order = melodyFor(MAX_TURNS);
        return [
          {
            note: tr('Bấm chìa khoá lên dây ít nhất 4 lần rồi chờ: hộp gõ lần lượt các chuông (chuông rung dù tắt tiếng), chuông trên nắp rung cuối cùng.', 'Tap the winding key at least 4 times, then wait: the box strikes its bells one after another (they swing even with the sound off), and the bell on the lid swings last.'),
            targets: [{
              x: KEY_SPOT[0], y: KEY_SPOT[1], r: 70, verb: 'tap', turn: 360, object: '[data-hint="key"]',
              act: (picture) => {
                const nodes = [...picture.querySelectorAll<SVGGElement>('[data-swing]')];
                return (p) => {
                  nodes.forEach((n) => n.setAttribute('transform', ''));
                  order.forEach((bell, i) => {
                    const local = p * order.length - i;
                    if (local < 0 || local > 1) return;
                    nodes[bell]?.setAttribute('transform', `rotate(${swing(local * 0.9).toFixed(2)})`);
                  });
                };
              },
            }],
          },
          {
            note: tr('Nhớ vị trí 4 chuông đầu theo thứ tự được gõ (chuông trên nắp không tính). Ở vị trí nào thì bấm phím ở vị trí đó trên bàn phím.', 'Remember where the first 4 bells hang, in the order they are struck (the bell on the lid does not count). Wherever a bell hangs, press the key in the same place on the keypad.'),
            targets: SEQUENCE.map((bell) => ({ x: bellSpot(bell)[0], y: bellSpot(bell)[1] + 60, r: 80, verb: 'look' as const })),
          },
        ];
      },
      destroy: () => cancelAnimationFrame(frame),
    };
  },
};
