import { answerOf } from '../core/assembly';
import { DEF, url } from '../core/defs';
import type { ObjectInfo } from '../core/objects';
import { SCENE_H, SCENE_W } from '../core/scene';
import { el, uid } from '../core/svg';
import { zodiac, type ZodiacId } from '../core/zodiac';
import { mountAssemblyBoard, type BoardConfig, type PlacedObject } from './assemblyBoard';
import type { PuzzleDef } from './types';

/**
 * Level 6 — the Đông Hồ print workshop ("xưởng in tranh Đông Hồ").
 * Đông Hồ folk prints are made one colour at a time, each from its own block.
 * Here every see-through film carries one colour of one print, as thin stripes:
 * alone it is just bands of ink. Stack the films of the same print exactly on top
 * of each other, all the right way up, and the striped colours fill in the animal.
 * Inspired by stacking-to-reveal puzzles, with printing layers instead of letters.
 */

const INKS = ['#2b2622', '#b7372a', '#c99a2e'] as const;
const STRIPE = 8;
const FILM = 190;
const SCALE = 1.7;

/** One colour layer of a print: stripes number `layer`, `layer + layers`, … of the animal. */
function film(id: string, animal: ZodiacId, layer: number, layers: number): ObjectInfo {
  const clipId = `film-${id}`;
  const stripes = Array.from({ length: Math.ceil(100 / STRIPE) }, (_, i) => i)
    .filter((i) => i % layers === layer)
    .map((i) => `<rect x="-5" y="${i * STRIPE}" width="110" height="${STRIPE}"/>`)
    .join('');
  const ink = INKS[layer % INKS.length];
  const blots = [0, 1, 2]
    .map((k) => {
      const x = ((id.length * 37 + k * 53) % 140) - 70;
      const y = ((id.length * 29 + k * 71) % 140) - 70;
      return `<circle cx="${x}" cy="${y}" r="${3 + k}" fill="${ink}" opacity="0.35"/>`;
    })
    .join('');
  const half = FILM / 2;
  const crosses = [[-1, -1], [1, -1], [-1, 1], [1, 1]]
    .map(([sx, sy]) => {
      const x = sx * (half - 12);
      const y = sy * (half - 12);
      return `<path d="M${x - 7} ${y} H${x + 7} M${x} ${y - 7} V${y + 7}" stroke="#8a6a45" stroke-width="2"/>`;
    })
    .join('');
  return {
    name: 'Tấm phim in',
    radius: half,
    symmetry: 360,
    depth: 1,
    flat: true,
    draw: `<defs><clipPath id="${clipId}">${stripes}</clipPath></defs>
      <rect x="${-half}" y="${-half}" width="${FILM}" height="${FILM}" rx="6" fill="#f6eedb" fill-opacity="0.16" stroke="#8a6a45" stroke-width="2" stroke-dasharray="7 5"/>
      ${crosses}${blots}
      <g transform="translate(${-50 * SCALE} ${-55 * SCALE}) scale(${SCALE})">
        <g clip-path="url(#${clipId})" style="color:${ink}" fill="currentColor" stroke-linecap="round" stroke-linejoin="round">${zodiac(animal).shape}</g>
      </g>`,
  };
}

let filmCount = 0;
/** A film lying on the table; films are numbered in the order they are listed, for screen readers. */
function placed(id: string, animal: ZodiacId, layer: number, layers: number, x: number, y: number, rot: number): PlacedObject {
  filmCount += 1;
  return { id, info: { ...film(id, animal, layer, layers), name: `Tấm phim in ${filmCount}` }, x, y, rot };
}

export const PRINT_SHOP: BoardConfig = {
  rotateStep: 90,
  bounds: { x0: 120, y0: 330, x1: 1480, y1: 800 },
  objects: [
    placed('tiger-black', 'tiger', 0, 3, 260, 420, 90),
    placed('tiger-red', 'tiger', 1, 3, 980, 700, 0),
    placed('tiger-ochre', 'tiger', 2, 3, 620, 560, 180),
    placed('rooster-black', 'rooster', 0, 2, 1400, 430, 270),
    placed('rooster-red', 'rooster', 1, 2, 420, 720, 0),
    placed('pig-black', 'pig', 0, 3, 800, 420, 0),
    placed('pig-red', 'pig', 1, 3, 1180, 560, 90),
    placed('pig-ochre', 'pig', 2, 3, 240, 650, 180),
    placed('horse-black', 'horse', 0, 2, 1380, 720, 0),
    placed('goat-red', 'goat', 1, 3, 640, 790, 90),
  ],
  compositions: [
    {
      animal: 'pig', order: 3,
      parts: ['pig-black', 'pig-red', 'pig-ochre'].map((id) => ({ id, dx: 0, dy: 0, rot: 0 })),
      marks: { dx: 0, dy: -122 },
    },
    {
      animal: 'tiger', order: 1,
      parts: ['tiger-black', 'tiger-red', 'tiger-ochre'].map((id) => ({ id, dx: 0, dy: 0, rot: 0 })),
      marks: { dx: 0, dy: -122 },
    },
    {
      animal: 'rooster', order: 2,
      parts: ['rooster-black', 'rooster-red'].map((id) => ({ id, dx: 0, dy: 0, rot: 0 })),
      marks: { dx: 0, dy: -122 },
    },
  ],
};

export const printShop: PuzzleDef = {
  id: 'c3-print-shop',
  chapter: 3,
  name: 'Xưởng in tranh Đông Hồ',
  answer: answerOf(PRINT_SHOP.compositions),
  guide: {
    goal: 'Chồng các tấm phim in thành 3 bức tranh con giáp.',
    steps: [
      { icon: 'drag', text: 'Kéo một tấm phim đặt chồng khít lên tấm khác. Mỗi tấm chỉ in một màu của bức tranh, thành từng sọc.' },
      { icon: 'rotate', text: 'Bấm (không kéo) để xoay tấm phim 90°. Sọc phải nằm ngang và hình phải đúng chiều.' },
      { icon: 'tap', text: 'Các lớp màu của cùng một bức tranh, chồng khít và đúng chiều, sẽ dính vào nhau.' },
      { icon: 'marks', text: 'Đủ các lớp thì bức tranh hiện rõ, kèm dấu ◆ chỉ thứ tự.' },
    ],
    tip: 'Tranh Đông Hồ được in từng màu một chồng lên nhau. Có 2 tấm phim thừa không thuộc bức nào.',
  },
  fireflies: [
    { id: 'c3-print-shop/beam', layer: 'back', x: 1480, y: 120 },
    { id: 'c3-print-shop/floor', layer: 'mid', x: 150, y: 860 },
  ],
  mount({ scene, sound }) {
    const { back, mid, front } = scene.layers;

    // Back: workshop wall with finished prints drying on a line.
    el('rect', { x: -60, y: -60, width: SCENE_W + 120, height: SCENE_H + 120, fill: '#e6d2a8' }, back);
    const lightId = uid('print-light');
    const light = el('radialGradient', { id: lightId }, scene.defs);
    el('stop', { offset: 0, 'stop-color': '#fff4d6', 'stop-opacity': 0.9 }, light);
    el('stop', { offset: 1, 'stop-color': '#e6d2a8', 'stop-opacity': 0 }, light);
    el('ellipse', { cx: 760, cy: 180, rx: 720, ry: 300, fill: url(lightId) }, back);
    el('path', { d: 'M40 70 Q800 130 1560 70', fill: 'none', stroke: '#5a4636', 'stroke-width': 3 }, back);
    const prints: [number, string, string][] = [[230, '#b7372a', '#c99a2e'], [520, '#4e6b38', '#b7372a'], [1080, '#c99a2e', '#2f4f7a'], [1360, '#b7372a', '#4e6b38']];
    for (const [x, a, b] of prints) {
      const y = 70 + Math.sin((x / 1600) * Math.PI) * 60;
      el('rect', { x: x - 60, y, width: 120, height: 150, fill: '#f3e7cb', stroke: '#8a6a45', 'stroke-width': 3, filter: url(DEF.rough) }, back);
      el('circle', { cx: x, cy: y + 62, r: 34, fill: a, opacity: 0.85 }, back);
      el('path', { d: `M${x - 40} ${y + 120} Q${x} ${y + 92} ${x + 40} ${y + 120}`, fill: 'none', stroke: b, 'stroke-width': 8 }, back);
    }
    scene.grain('back', 0.9);

    // Mid: the long pale printing table.
    el('path', { d: 'M30 300 L1570 300 L1600 900 L0 900 Z', fill: '#b08a5e' }, mid);
    el('path', { d: 'M30 300 L1570 300 L1574 316 L26 316 Z', fill: '#7a5638' }, mid);
    el('rect', { x: 90, y: 340, width: 1420, height: 500, rx: 10, fill: '#efe2c4', opacity: 0.35 }, mid);
    scene.grain('mid', 0.5);

    return mountAssemblyBoard(scene, sound, front, PRINT_SHOP);
  },
};
