import { el } from './svg';

export type ZodiacId =
  | 'rat' | 'ox' | 'tiger' | 'cat' | 'dragon' | 'snake'
  | 'horse' | 'goat' | 'monkey' | 'rooster' | 'dog' | 'pig';

export interface Zodiac {
  id: ZodiacId;
  /** Earthly branch name used on the ring (Tý, Sửu, ...). */
  branch: string;
  /** Vietnamese animal name. The Vietnamese zodiac has the cat (Mèo) instead of the rabbit. */
  animal: string;
  /** Ring note, rising clockwise on a pentatonic scale. */
  frequency: number;
  /** Silhouette markup in a 100×100 box, animal facing right, ground at y≈88. */
  shape: string;
}

const line = (d: string, width: number) =>
  `<path d="${d}" fill="none" stroke="currentColor" stroke-width="${width}"/>`;

/** Order matters: it is the clockwise order on the ring, Tý at the top (also the hour/compass order). */
export const ZODIAC: readonly Zodiac[] = [
  {
    id: 'rat', branch: 'Tý', animal: 'Chuột', frequency: 261.63,
    shape: `<ellipse cx="46" cy="64" rx="25" ry="15"/>
      <path d="M60 52 Q74 44 92 61 Q80 67 64 72 Z"/>
      <circle cx="66" cy="48" r="7.5"/>
      <ellipse cx="34" cy="79" rx="6" ry="3.5"/><ellipse cx="58" cy="79" rx="6" ry="3.5"/>
      ${line('M23 66 Q6 70 8 82 Q11 92 30 90', 3.5)}`,
  },
  {
    id: 'ox', branch: 'Sửu', animal: 'Trâu', frequency: 293.66,
    shape: `<rect x="16" y="44" width="54" height="28" rx="12"/>
      <rect x="20" y="64" width="8" height="22" rx="2"/><rect x="32" y="64" width="8" height="22" rx="2"/>
      <rect x="54" y="64" width="8" height="22" rx="2"/><rect x="64" y="64" width="7" height="22" rx="2"/>
      <path d="M62 46 L80 42 Q91 47 89 62 Q85 71 76 67 L64 60 Z"/>
      <path d="M74 45 Q64 24 40 27 Q58 32 68 47 Z"/>
      <path d="M81 44 Q95 30 88 14 Q88 32 77 45 Z"/>
      ${line('M17 50 Q8 58 11 74', 3)}<circle cx="11" cy="76" r="3.5"/>`,
  },
  {
    id: 'tiger', branch: 'Dần', animal: 'Hổ', frequency: 329.63,
    shape: `<path d="M16 50 Q40 41 68 47 Q74 60 67 69 Q40 73 19 67 Q10 59 16 50 Z"/>
      <circle cx="76" cy="50" r="13"/><ellipse cx="87" cy="56" rx="7" ry="6"/>
      <circle cx="69" cy="38" r="4.5"/><circle cx="81" cy="37" r="4.5"/>
      <rect x="20" y="60" width="9" height="26" rx="3"/><rect x="33" y="62" width="9" height="24" rx="3"/>
      <rect x="51" y="62" width="9" height="24" rx="3"/><rect x="62" y="60" width="9" height="26" rx="3"/>
      ${line('M17 55 Q2 53 4 38 Q6 27 15 29', 4.5)}`,
  },
  {
    id: 'cat', branch: 'Mão', animal: 'Mèo', frequency: 392.0,
    shape: `<path d="M34 87 Q27 60 42 47 Q57 41 63 57 Q69 75 65 87 Z"/>
      <circle cx="52" cy="36" r="13"/>
      <path d="M41 31 L41 13 L52 25 Z"/><path d="M56 25 L65 12 L65 31 Z"/>
      <ellipse cx="55" cy="87" rx="8" ry="3"/>
      ${line('M63 85 Q86 87 84 70 Q82 59 73 62', 4.5)}`,
  },
  {
    id: 'dragon', branch: 'Thìn', animal: 'Rồng', frequency: 440.0,
    shape: `${line('M6 74 Q20 44 37 62 T66 60 T86 40', 10)}
      <path d="M80 30 L98 37 L92 47 L79 46 Z"/>
      <path d="M83 33 L76 18 L89 30 Z"/>
      <path d="M18 55 L23 44 L27 56 Z M44 65 L50 54 L54 66 Z M63 56 L71 47 L73 59 Z"/>
      <path d="M29 63 L24 78 L33 77 Z M58 64 L56 79 L65 78 Z"/>
      ${line('M95 44 Q101 51 96 58', 2)}`,
  },
  {
    id: 'snake', branch: 'Tỵ', animal: 'Rắn', frequency: 523.25,
    shape: `<path d="M18 85 Q6 79 18 72 Q48 63 74 71 Q88 78 72 85 Q46 92 18 85 Z"/>
      ${line('M30 72 Q26 63 41 61 Q58 59 64 66', 8)}
      ${line('M61 69 Q71 50 58 35', 8)}
      <ellipse cx="64" cy="31" rx="11" ry="6.5"/>
      ${line('M74 32 L83 31 L87 27 M83 31 L87 35', 1.6)}`,
  },
  {
    id: 'horse', branch: 'Ngọ', animal: 'Ngựa', frequency: 587.33,
    shape: `<ellipse cx="43" cy="54" rx="25" ry="12.5"/>
      <path d="M57 50 L69 23 L80 27 L70 57 Z"/>
      <path d="M69 21 Q78 17 95 34 Q93 41 86 38 L75 32 Z"/>
      <path d="M71 22 L73 11 L78 22 Z"/>
      <rect x="25" y="60" width="5.5" height="28" rx="2"/><rect x="33" y="61" width="5.5" height="27" rx="2"/>
      <rect x="53" y="61" width="5.5" height="27" rx="2"/><rect x="61" y="60" width="5.5" height="28" rx="2"/>
      ${line('M20 50 Q6 56 9 77', 5.5)}`,
  },
  {
    id: 'goat', branch: 'Mùi', animal: 'Dê', frequency: 659.25,
    shape: `<rect x="20" y="46" width="46" height="22" rx="10"/>
      <rect x="24" y="62" width="5.5" height="24" rx="2"/><rect x="33" y="62" width="5.5" height="24" rx="2"/>
      <rect x="52" y="62" width="5.5" height="24" rx="2"/><rect x="60" y="62" width="5.5" height="24" rx="2"/>
      <path d="M59 50 L71 33 Q80 31 85 42 L79 50 L66 58 Z"/>
      <path d="M72 35 Q66 16 52 23 Q63 24 67 37 Z"/>
      <path d="M78 47 L80 62 L73 50 Z"/>
      <path d="M21 49 L12 42 L19 54 Z"/>`,
  },
  {
    id: 'monkey', branch: 'Thân', animal: 'Khỉ', frequency: 783.99,
    shape: `<ellipse cx="46" cy="64" rx="15" ry="18"/>
      <circle cx="50" cy="36" r="12"/>
      <circle cx="37" cy="36" r="5.5"/><circle cx="63" cy="36" r="5.5"/>
      ${line('M56 58 Q73 50 77 31', 5.5)}
      <ellipse cx="38" cy="83" rx="8.5" ry="4"/><ellipse cx="56" cy="83" rx="8.5" ry="4"/>
      ${line('M32 73 Q12 77 15 60 Q18 49 27 54', 4.5)}`,
  },
  {
    id: 'rooster', branch: 'Dậu', animal: 'Gà', frequency: 880.0,
    shape: `<path d="M29 50 Q50 39 67 46 Q71 62 56 71 Q37 73 29 60 Z"/>
      <path d="M57 49 Q59 29 70 27 Q79 29 77 40 L68 51 Z"/>
      <circle cx="65" cy="23" r="4.5"/><circle cx="71.5" cy="21.5" r="4.5"/><circle cx="77" cy="25" r="3.5"/>
      <path d="M76 32 L85 35 L76 38 Z"/>
      <ellipse cx="74" cy="43" rx="3" ry="4.5"/>
      <path d="M32 52 Q15 30 26 16 Q24 36 37 48 Z"/>
      <path d="M30 57 Q6 47 11 29 Q15 46 33 54 Z"/>
      ${line('M44 69 L42 87 M54 69 L56 87', 3)}`,
  },
  {
    id: 'dog', branch: 'Tuất', animal: 'Chó', frequency: 1046.5,
    shape: `<rect x="20" y="46" width="46" height="20" rx="9"/>
      <rect x="23" y="60" width="6.5" height="26" rx="2"/><rect x="33" y="60" width="6.5" height="26" rx="2"/>
      <rect x="53" y="60" width="6.5" height="26" rx="2"/><rect x="61" y="60" width="6.5" height="26" rx="2"/>
      <path d="M61 49 L65 32 Q73 27 80 33 L92 40 Q92 47 83 49 L72 55 Z"/>
      <path d="M65 34 L67 16 L75 30 Z"/>
      ${line('M22 50 Q9 40 14 24', 5.5)}`,
  },
  {
    id: 'pig', branch: 'Hợi', animal: 'Lợn', frequency: 1174.66,
    shape: `<ellipse cx="45" cy="58" rx="29" ry="20"/>
      <rect x="70" y="50" width="12" height="13" rx="4"/>
      <path d="M60 41 L69 29 L72 45 Z"/>
      <rect x="26" y="70" width="8" height="16" rx="2"/><rect x="38" y="72" width="8" height="14" rx="2"/>
      <rect x="52" y="72" width="8" height="14" rx="2"/><rect x="62" y="70" width="8" height="16" rx="2"/>
      ${line('M17 54 Q8 50 12 43 Q19 40 18 48', 2.8)}`,
  },
];

const BY_ID = new Map(ZODIAC.map((z) => [z.id, z]));

export function zodiac(id: ZodiacId): Zodiac {
  const found = BY_ID.get(id);
  if (!found) throw new Error(`Unknown zodiac id: ${id}`);
  return found;
}

export const isZodiacId = (value: unknown): value is ZodiacId =>
  typeof value === 'string' && BY_ID.has(value as ZodiacId);

/** Appends the silhouette (100×100 box) to parent. Colour comes from CSS `color`. */
export function drawZodiac(parent: Element, id: ZodiacId): SVGGElement {
  const group = el('g', {
    fill: 'currentColor',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'data-zodiac': id,
  }, parent);
  group.innerHTML = zodiac(id).shape;
  return group;
}
