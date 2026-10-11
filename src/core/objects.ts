import { el } from './svg';

/**
 * Everyday Vietnamese household and festival objects. Each is drawn around its own
 * centre (0, 0) so it can be moved and rotated freely. Put together in the right
 * arrangement, a handful of them make up a zodiac animal.
 */
export type ObjectKind =
  | 'teapot' | 'fan' | 'chopsticks' | 'cup' | 'pomelo' | 'betel' | 'leaf' | 'coin'
  | 'brush' | 'drum' | 'banhchung' | 'sickle' | 'kite' | 'firecrackers' | 'lantern';

export interface ObjectInfo {
  /** Vietnamese name, for accessibility labels. */
  name: string;
  /** Rough radius, for hints and keeping objects on the table. */
  radius: number;
  /** Turning by this many degrees looks the same (e.g. 90 for a square cake). */
  symmetry: number;
  draw: string;
}

const INK = '#2b2622';

export const OBJECTS: Record<ObjectKind, ObjectInfo> = {
  teapot: {
    name: 'Ấm trà', radius: 85, symmetry: 360,
    draw: `<path d="M-58 -20 Q-98 0 -60 32" fill="none" stroke="#5e3820" stroke-width="10" stroke-linecap="round"/>
      <path d="M48 2 Q84 -4 94 -36 L104 -32 Q98 12 54 24 Z" fill="#7c4a2d"/>
      <ellipse cx="0" cy="8" rx="64" ry="48" fill="#7c4a2d"/>
      <ellipse cx="-18" cy="-6" rx="22" ry="12" fill="#a0694a" opacity="0.6"/>
      <ellipse cx="0" cy="-40" rx="28" ry="9" fill="#5e3820"/>
      <circle cx="0" cy="-51" r="7" fill="#5e3820"/>`,
  },
  fan: {
    name: 'Quạt giấy', radius: 95, symmetry: 360,
    draw: `<path d="M0 45 L-99 9 A105 105 0 0 1 99 9 Z" fill="#c2402f" stroke="#7a2119" stroke-width="3"/>
      <path d="M-99 9 A105 105 0 0 1 99 9" fill="none" stroke="#e0a948" stroke-width="7"/>
      ${[-60, -36, -12, 12, 36, 60].map((deg) => {
        const a = (deg * Math.PI) / 180;
        return `<line x1="0" y1="45" x2="${(Math.sin(a) * 100).toFixed(1)}" y2="${(45 - Math.cos(a) * 100).toFixed(1)}" stroke="#7a2119" stroke-width="2"/>`;
      }).join('')}
      <circle cx="0" cy="45" r="7" fill="#e0a948"/>`,
  },
  chopsticks: {
    name: 'Đôi đũa', radius: 82, symmetry: 360,
    draw: `<rect x="-13" y="-80" width="8" height="160" rx="3" fill="#6b4f36"/>
      <rect x="5" y="-80" width="8" height="160" rx="3" fill="#6b4f36"/>
      <rect x="-13" y="-80" width="8" height="26" rx="3" fill="#b7372a"/>
      <rect x="5" y="-80" width="8" height="26" rx="3" fill="#b7372a"/>`,
  },
  cup: {
    name: 'Chén trà', radius: 45, symmetry: 360,
    draw: `<path d="M-42 -20 L42 -20 Q38 18 0 22 Q-38 18 -42 -20 Z" fill="#ece6d6" stroke="#2f4f7a" stroke-width="3"/>
      <path d="M-36 -6 Q0 2 36 -6" fill="none" stroke="#2f4f7a" stroke-width="3"/>
      <rect x="-14" y="20" width="28" height="7" rx="2" fill="#2f4f7a"/>`,
  },
  pomelo: {
    name: 'Quả bưởi', radius: 72, symmetry: 360,
    draw: `<circle cx="0" cy="4" r="66" fill="#8aa04f"/>
      <circle cx="-20" cy="-16" r="18" fill="#a4b968" opacity="0.6"/>
      <rect x="-3" y="-72" width="6" height="14" rx="2" fill="#5e3820"/>
      <path d="M2 -66 Q30 -92 52 -70 Q30 -58 2 -66 Z" fill="#4f6b3a"/>`,
  },
  betel: {
    name: 'Lá trầu', radius: 38, symmetry: 360,
    draw: `<path d="M0 34 Q-46 4 -34 -20 Q-22 -38 0 -18 Q22 -38 34 -20 Q46 4 0 34 Z" fill="#5f8a3a"/>
      <path d="M0 -18 L0 30" stroke="#3f5f27" stroke-width="2.5"/>`,
  },
  leaf: {
    name: 'Lá chuối', radius: 112, symmetry: 360,
    draw: `<path d="M-112 0 Q-30 -46 112 0 Q-30 46 -112 0 Z" fill="#6f8f45"/>
      <path d="M-112 0 L112 0" stroke="#4f6b3a" stroke-width="3"/>
      ${[-60, -20, 20, 60].map((x) => `<path d="M${x} 0 L${x + 22} -24 M${x} 0 L${x + 22} 24" stroke="#4f6b3a" stroke-width="1.5"/>`).join('')}`,
  },
  coin: {
    name: 'Đồng xu', radius: 26, symmetry: 90,
    draw: `<circle r="25" fill="#c9a441" stroke="#8a6a25" stroke-width="3"/>
      <rect x="-7" y="-7" width="14" height="14" fill="${INK}"/>`,
  },
  brush: {
    name: 'Bút lông', radius: 100, symmetry: 360,
    draw: `<rect x="-60" y="-5" width="150" height="10" rx="4" fill="#8a6a45"/>
      <rect x="78" y="-7" width="14" height="14" rx="2" fill="#b7372a"/>
      <path d="M-60 -7 Q-92 -6 -104 0 Q-92 6 -60 7 Z" fill="${INK}"/>`,
  },
  drum: {
    name: 'Trống', radius: 66, symmetry: 360,
    draw: `<rect x="-56" y="-30" width="112" height="64" fill="#a33a2a"/>
      <ellipse cx="0" cy="34" rx="56" ry="12" fill="#7a2119"/>
      <ellipse cx="0" cy="-30" rx="56" ry="12" fill="#d8c39a" stroke="#7a2119" stroke-width="3"/>
      ${[-40, -14, 14, 40].map((x) => `<circle cx="${x}" cy="0" r="3.5" fill="#e0a948"/>`).join('')}`,
  },
  banhchung: {
    name: 'Bánh chưng', radius: 72, symmetry: 90,
    draw: `<rect x="-56" y="-56" width="112" height="112" rx="5" fill="#4e6b38"/>
      <rect x="-48" y="-48" width="96" height="96" rx="3" fill="none" stroke="#6f8f45" stroke-width="3"/>
      <path d="M-56 -18 H56 M-56 18 H56 M-18 -56 V56 M18 -56 V56" stroke="#e7dcc0" stroke-width="4"/>`,
  },
  sickle: {
    name: 'Cái liềm', radius: 78, symmetry: 360,
    draw: `<path d="M-62 18 Q-12 -76 66 -36 Q2 -46 -46 22 Z" fill="#a7adb3" stroke="#6d7378" stroke-width="2"/>
      <rect x="-80" y="14" width="40" height="13" rx="5" fill="#6b4f36" transform="rotate(25 -60 20)"/>`,
  },
  kite: {
    name: 'Cánh diều', radius: 92, symmetry: 360,
    draw: `<path d="M0 -70 L52 -6 L0 70 L-52 -6 Z" fill="#e0a948" stroke="#8a6a25" stroke-width="3"/>
      <path d="M0 -70 V70 M-52 -6 H52" stroke="#8a6a25" stroke-width="2.5"/>
      <path d="M0 70 Q-14 84 0 96 Q14 108 0 118" fill="none" stroke="#b7372a" stroke-width="4"/>`,
  },
  firecrackers: {
    name: 'Dây pháo', radius: 108, symmetry: 180,
    draw: `<path d="M-108 0 H108" stroke="#5e3820" stroke-width="3"/>
      ${Array.from({ length: 9 }, (_, i) => `<rect x="${-100 + i * 24}" y="-16" width="16" height="32" rx="3" fill="#c2402f" stroke="#7a2119" stroke-width="1.5"/><rect x="${-100 + i * 24}" y="-4" width="16" height="6" fill="#e0a948"/>`).join('')}`,
  },
  lantern: {
    name: 'Đèn lồng', radius: 58, symmetry: 360,
    draw: `<rect x="-22" y="-52" width="44" height="12" rx="3" fill="${INK}"/>
      <ellipse cx="0" cy="0" rx="52" ry="42" fill="#c2402f"/>
      <path d="M-26 -38 Q-40 0 -26 38 M0 -42 V42 M26 -38 Q40 0 26 38" fill="none" stroke="#7a2119" stroke-width="2.5"/>
      <rect x="-22" y="40" width="44" height="12" rx="3" fill="${INK}"/>`,
  },
};

/** Draws an object into a fresh group; the caller positions and rotates the group. */
export function drawObject(parent: Element, kind: ObjectKind): SVGGElement {
  const group = el('g', { 'data-object': kind }, parent);
  group.innerHTML = OBJECTS[kind].draw;
  return group;
}
