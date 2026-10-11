import { el } from './svg';

/**
 * Everyday Vietnamese household and festival objects. Each is drawn around its own
 * centre (0, 0) so it can be moved and rotated freely. Each object's outline is
 * chosen to match one telling part of an animal (a sweet potato's tapering tip is
 * a rat's snout, a two-holed button is a pig's nose), so the finished group reads
 * as that animal.
 */
export type ObjectKind =
  | 'potato' | 'coin' | 'string'
  | 'gourd' | 'chili' | 'fan' | 'chopsticks'
  | 'bun' | 'button' | 'hat'
  | 'bench' | 'coconut' | 'sickle' | 'brush'
  | 'ribbon' | 'comb' | 'scissors'
  | 'vase' | 'mooncake' | 'slingshot' | 'rope'
  | 'teapot' | 'drum';

export interface ObjectInfo {
  /** Vietnamese name, for accessibility labels. */
  name: string;
  /** Rough radius, for hints and keeping objects on the table. */
  radius: number;
  /** Turning by this many degrees looks the same. */
  symmetry: number;
  /**
   * Stacking order once put down: 0 for parts that tuck behind (legs, tails, ears,
   * horns), 1 for bodies, 2 for parts in front (heads, snouts).
   */
  depth: 0 | 1 | 2;
  draw: string;
}

const INK = '#2b2622';
const WOOD = '#6b4f36';

const fanRibs = [-60, -36, -12, 12, 36, 60]
  .map((deg) => {
    const a = (deg * Math.PI) / 180;
    return `<line x1="0" y1="36" x2="${(Math.sin(a) * 82).toFixed(1)}" y2="${(36 - Math.cos(a) * 82).toFixed(1)}" stroke="#7a2119" stroke-width="2"/>`;
  })
  .join('');

const chiliPod = (angle: number) =>
  `<path d="M-8 2 Q-11 -26 0 -46 Q11 -26 8 2 Z" fill="#d23a24" stroke="#8e2015" stroke-width="2" transform="rotate(${angle})"/>`;

const combTeeth = Array.from({ length: 9 }, (_, i) => `<path d="M${-46 + i * 11.5} 2 L${-42 + i * 11.5} -26 L${-38 + i * 11.5} 2 Z" fill="#c9a66b"/>`).join('');

export const OBJECTS: Record<ObjectKind, ObjectInfo> = {
  // --- Rat: sweet potato body, coin ear, string tail.
  potato: {
    name: 'Củ khoai lang', radius: 105, symmetry: 360, depth: 1,
    draw: `<path d="M-104 12 Q-108 -46 -24 -50 Q52 -50 104 0 Q56 44 -24 50 Q-100 54 -104 12 Z" fill="#9c4a5c" stroke="#6e2f3e" stroke-width="3"/>
      <path d="M-70 -24 Q-30 -40 20 -34" fill="none" stroke="#c07084" stroke-width="6" stroke-linecap="round" opacity="0.6"/>
      <circle cx="54" cy="-12" r="5" fill="${INK}"/>
      <path d="M104 0 L118 -2 M-40 50 L-44 60 M10 44 L12 54" stroke="#6e2f3e" stroke-width="2" stroke-linecap="round"/>`,
  },
  coin: {
    name: 'Đồng xu', radius: 26, symmetry: 90, depth: 0,
    draw: `<circle r="25" fill="#c9a441" stroke="#8a6a25" stroke-width="3"/>
      <rect x="-7" y="-7" width="14" height="14" fill="${INK}"/>`,
  },
  string: {
    name: 'Sợi lạt', radius: 70, symmetry: 360, depth: 0,
    draw: `<path d="M62 -22 Q10 -42 -32 -10 Q-72 22 -52 52 Q-36 72 -10 56" fill="none" stroke="#a88552" stroke-width="8" stroke-linecap="round"/>
      <path d="M62 -22 Q10 -42 -32 -10 Q-72 22 -52 52 Q-36 72 -10 56" fill="none" stroke="#d9bd88" stroke-width="3" stroke-linecap="round"/>`,
  },

  // --- Rooster: tilted gourd body and head, chili comb, fan tail, chopstick legs.
  gourd: {
    name: 'Bầu hồ lô', radius: 92, symmetry: 360, depth: 1,
    draw: `<path d="M62 -48 L84 -42 L62 -34 Z" fill="#7a4a1e"/>
      <path d="M12 -22 Q22 -38 18 -52" stroke="#d9a84e" stroke-width="30" stroke-linecap="round" fill="none"/>
      <circle cx="-18" cy="28" r="56" fill="#d9a84e"/>
      <circle cx="34" cy="-44" r="30" fill="#d9a84e"/>
      <path d="M12 -22 Q22 -38 18 -52" stroke="#d9a84e" stroke-width="30" stroke-linecap="round" fill="none"/>
      <path d="M-48 10 Q-40 -14 -14 -20" fill="none" stroke="#f0ca7a" stroke-width="8" stroke-linecap="round" opacity="0.7"/>
      <path d="M2 -14 Q14 -8 26 -16" fill="none" stroke="#c2402f" stroke-width="6" stroke-linecap="round"/>
      <path d="M14 -12 L10 4 M18 -12 L22 4" stroke="#c2402f" stroke-width="3" stroke-linecap="round"/>
      <circle cx="44" cy="-50" r="4" fill="${INK}"/>`,
  },
  chili: {
    name: 'Chùm ớt', radius: 36, symmetry: 360, depth: 0,
    draw: `${chiliPod(-32)}${chiliPod(0)}${chiliPod(32)}<circle cx="0" cy="4" r="9" fill="#4f6b3a"/>`,
  },
  fan: {
    name: 'Quạt giấy', radius: 80, symmetry: 360, depth: 0,
    draw: `<path d="M0 36 L-79 8 A84 84 0 0 1 79 8 Z" fill="#c2402f" stroke="#7a2119" stroke-width="3"/>
      <path d="M-79 8 A84 84 0 0 1 79 8" fill="none" stroke="#e0a948" stroke-width="7"/>
      ${fanRibs}
      <circle cx="0" cy="36" r="6" fill="#e0a948"/>`,
  },
  chopsticks: {
    name: 'Đôi đũa', radius: 66, symmetry: 360, depth: 0,
    draw: `<rect x="-16" y="-65" width="8" height="130" rx="3" fill="${WOOD}"/>
      <rect x="8" y="-65" width="8" height="130" rx="3" fill="${WOOD}"/>
      <rect x="-16" y="41" width="8" height="24" rx="3" fill="#b7372a"/>
      <rect x="8" y="41" width="8" height="24" rx="3" fill="#b7372a"/>`,
  },

  // --- Pig: pink bun body, two-holed button snout, small conical hat ear.
  bun: {
    name: 'Bánh bao', radius: 88, symmetry: 360, depth: 1,
    draw: `<ellipse cx="0" cy="0" rx="86" ry="60" fill="#f2d2c2" stroke="#c99a88" stroke-width="3"/>
      ${[-50, -28, -8, 12, 32, 52].map((x) => `<path d="M0 -56 Q${x * 0.5} -40 ${x} -26" fill="none" stroke="#d9ab97" stroke-width="3" stroke-linecap="round"/>`).join('')}
      <circle cx="0" cy="-57" r="6" fill="#d9ab97"/>
      <circle cx="46" cy="-12" r="5" fill="${INK}"/>`,
  },
  button: {
    name: 'Cúc áo', radius: 28, symmetry: 180, depth: 2,
    draw: `<circle r="26" fill="#e79a95" stroke="#b8615f" stroke-width="3"/>
      <ellipse cx="-9" cy="0" rx="5" ry="8" fill="#7a3433"/>
      <ellipse cx="9" cy="0" rx="5" ry="8" fill="#7a3433"/>`,
  },
  hat: {
    name: 'Nón lá', radius: 36, symmetry: 360, depth: 0,
    draw: `<path d="M-34 22 L0 -30 L34 22 Q0 30 -34 22 Z" fill="#d8bf86" stroke="#a88552" stroke-width="2.5"/>
      <path d="M-22 4 Q0 10 22 4 M-12 -12 Q0 -8 12 -12" fill="none" stroke="#a88552" stroke-width="2"/>`,
  },

  // --- Buffalo: bench body with legs, coconut-shell head, sickle horns, brush tail.
  bench: {
    name: 'Ghế băng gỗ', radius: 110, symmetry: 360, depth: 1,
    draw: `<path d="M-84 8 L-92 78 L-78 78 L-68 8 Z M-60 8 L-62 74 L-50 74 L-46 8 Z M46 8 L50 74 L62 74 L60 8 Z M68 8 L78 78 L92 78 L84 8 Z" fill="#3f2f24"/>
      <rect x="-104" y="-44" width="208" height="56" rx="14" fill="#5a4434"/>
      <path d="M-90 -26 H84 M-80 -6 H90" stroke="#4a372a" stroke-width="3" stroke-linecap="round"/>`,
  },
  coconut: {
    name: 'Gáo dừa', radius: 50, symmetry: 360, depth: 2,
    draw: `<path d="M-48 12 A48 48 0 0 1 48 12 Z" fill="#6b4a2e" stroke="#4a3220" stroke-width="3"/>
      <path d="M-44 12 H44" stroke="#efe6d2" stroke-width="5"/>
      <path d="M-30 -12 L-24 -4 M-10 -24 L-6 -14 M12 -26 L14 -16 M30 -14 L26 -6" stroke="#8a6440" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="-14" cy="-6" r="5" fill="${INK}"/>`,
  },
  sickle: {
    name: 'Lưỡi liềm', radius: 72, symmetry: 360, depth: 0,
    draw: `<rect x="-7" y="18" width="14" height="40" rx="4" fill="${WOOD}"/>
      <path d="M-70 -40 Q-60 26 0 26 Q60 26 70 -40 Q50 10 0 12 Q-50 10 -70 -40 Z" fill="#a7adb3" stroke="#6d7378" stroke-width="2.5"/>`,
  },
  brush: {
    name: 'Bút lông', radius: 75, symmetry: 360, depth: 0,
    draw: `<rect x="-36" y="-5" width="106" height="10" rx="4" fill="#8a6a45"/>
      <rect x="62" y="-7" width="12" height="14" rx="2" fill="#b7372a"/>
      <path d="M-36 -8 Q-62 -10 -78 0 Q-62 10 -36 8 Z" fill="${INK}"/>`,
  },

  // --- Dragon: silk ribbon body, comb spines, open scissors jaws, fan tail fin.
  ribbon: {
    name: 'Dải lụa', radius: 160, symmetry: 360, depth: 1,
    draw: `<path d="M-150 14 C-110 -60 -40 -60 0 0 S110 56 150 -10" fill="none" stroke="#d4a03a" stroke-width="40" stroke-linecap="round"/>
      <path d="M-150 14 C-110 -60 -40 -60 0 0 S110 56 150 -10" fill="none" stroke="#c2402f" stroke-width="30" stroke-linecap="round"/>
      <path d="M-120 -12 C-90 -46 -50 -46 -20 -12 M20 18 C50 44 90 40 120 4" fill="none" stroke="#e86a50" stroke-width="5" stroke-linecap="round" opacity="0.7"/>`,
  },
  comb: {
    name: 'Lược gỗ', radius: 56, symmetry: 360, depth: 0,
    draw: `${combTeeth}<rect x="-52" y="0" width="104" height="16" rx="6" fill="#a07a50"/>`,
  },
  scissors: {
    name: 'Cây kéo', radius: 80, symmetry: 360, depth: 2,
    draw: `<path d="M-8 -6 L74 -34 L76 -24 L0 4 Z" fill="#a7adb3" stroke="#6d7378" stroke-width="2"/>
      <path d="M-8 6 L74 34 L76 24 L0 -4 Z" fill="#a7adb3" stroke="#6d7378" stroke-width="2"/>
      <circle cx="-30" cy="-16" r="15" fill="#efe6d2" stroke="#2f4f7a" stroke-width="7"/>
      <circle cx="-30" cy="16" r="15" fill="#efe6d2" stroke="#2f4f7a" stroke-width="7"/>
      <circle cx="-30" cy="-16" r="5" fill="${INK}"/>
      <circle cx="-30" cy="16" r="5" fill="${INK}"/>
      <circle cx="0" cy="0" r="5" fill="#6d7378"/>`,
  },

  // --- Cat: vase body, mooncake head, slingshot ears, rope tail.
  vase: {
    name: 'Lọ gốm', radius: 90, symmetry: 360, depth: 1,
    draw: `<path d="M-18 -82 L18 -82 L16 -60 Q70 -20 62 40 Q54 84 0 86 Q-54 84 -62 40 Q-70 -20 -16 -60 Z" fill="#ebe5d6" stroke="#2f4f7a" stroke-width="3"/>
      <path d="M-56 20 Q-40 8 -24 20 T8 20 T40 20 T60 18" fill="none" stroke="#2f4f7a" stroke-width="4"/>
      <circle cx="0" cy="48" r="14" fill="none" stroke="#2f4f7a" stroke-width="3"/>
      <path d="M-30 -36 Q0 -46 30 -36" fill="none" stroke="#2f4f7a" stroke-width="3"/>`,
  },
  mooncake: {
    name: 'Bánh nướng', radius: 46, symmetry: 360, depth: 2,
    draw: `<circle r="44" fill="#c98b3a" stroke="#8a5a22" stroke-width="3"/>
      <circle r="32" fill="none" stroke="#e6b36a" stroke-width="3"/>
      ${[0, 60, 120, 180, 240, 300].map((a) => `<circle cx="${(Math.cos((a * Math.PI) / 180) * 32).toFixed(1)}" cy="${(Math.sin((a * Math.PI) / 180) * 32).toFixed(1)}" r="4" fill="#e6b36a"/>`).join('')}
      <circle cx="-14" cy="-6" r="5" fill="${INK}"/><circle cx="14" cy="-6" r="5" fill="${INK}"/>`,
  },
  slingshot: {
    name: 'Ná cao su', radius: 60, symmetry: 360, depth: 0,
    draw: `<rect x="-7" y="6" width="14" height="56" rx="5" fill="${WOOD}"/>
      <path d="M-6 14 L-32 -8 L-46 -52 L-14 -28 L2 2 Z M6 14 L32 -8 L46 -52 L14 -28 L-2 2 Z" fill="${WOOD}" stroke="#4a3220" stroke-width="3" stroke-linejoin="round"/>
      <path d="M-36 -36 L-28 -20 M36 -36 L28 -20" stroke="#c2402f" stroke-width="4" stroke-linecap="round"/>`,
  },
  rope: {
    name: 'Dây thừng', radius: 60, symmetry: 360, depth: 0,
    draw: `<path d="M-46 40 Q30 52 40 0 Q46 -42 8 -52" fill="none" stroke="#a88552" stroke-width="12" stroke-linecap="round"/>
      <path d="M-46 40 Q30 52 40 0 Q46 -42 8 -52" fill="none" stroke="#d9bd88" stroke-width="12" stroke-dasharray="4 7" stroke-linecap="butt"/>`,
  },

  // --- Odd ones out.
  teapot: {
    name: 'Ấm trà', radius: 85, symmetry: 360, depth: 1,
    draw: `<path d="M-58 -20 Q-98 0 -60 32" fill="none" stroke="#5e3820" stroke-width="10" stroke-linecap="round"/>
      <path d="M48 2 Q84 -4 94 -36 L104 -32 Q98 12 54 24 Z" fill="#7c4a2d"/>
      <ellipse cx="0" cy="8" rx="64" ry="48" fill="#7c4a2d"/>
      <ellipse cx="-18" cy="-6" rx="22" ry="12" fill="#a0694a" opacity="0.6"/>
      <ellipse cx="0" cy="-40" rx="28" ry="9" fill="#5e3820"/>
      <circle cx="0" cy="-51" r="7" fill="#5e3820"/>`,
  },
  drum: {
    name: 'Trống', radius: 66, symmetry: 360, depth: 1,
    draw: `<rect x="-56" y="-30" width="112" height="64" fill="#a33a2a"/>
      <ellipse cx="0" cy="34" rx="56" ry="12" fill="#7a2119"/>
      <ellipse cx="0" cy="-30" rx="56" ry="12" fill="#d8c39a" stroke="#7a2119" stroke-width="3"/>
      ${[-40, -14, 14, 40].map((x) => `<circle cx="${x}" cy="0" r="3.5" fill="#e0a948"/>`).join('')}`,
  },
};

/** Draws an object into a fresh group; the caller positions and rotates the group. */
export function drawObject(parent: Element, kind: ObjectKind): SVGGElement {
  const group = el('g', { 'data-object': kind }, parent);
  group.innerHTML = OBJECTS[kind].draw;
  return group;
}
