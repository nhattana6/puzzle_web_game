export const SVG_NS = 'http://www.w3.org/2000/svg';

type Attrs = Record<string, string | number | undefined>;

export function el<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  parent?: Element | null,
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG_NS, tag);
  setAttrs(node, attrs);
  parent?.appendChild(node);
  return node;
}

export function setAttrs(node: Element, attrs: Attrs): void {
  for (const [key, value] of Object.entries(attrs)) {
    if (value !== undefined) node.setAttribute(key, String(value));
  }
}

let counter = 0;
/** Document-unique id for clip paths, gradients and filters created at runtime. */
export function uid(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}`;
}

/** Path for a ring (annulus) centred on (cx, cy); a disc when inner is 0. Fill with evenodd. */
export function annulusPath(cx: number, cy: number, inner: number, outer: number): string {
  const circle = (r: number) =>
    `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0 Z`;
  return inner > 0 ? `${circle(outer)} ${circle(inner)}` : circle(outer);
}

/** Five-pointed star path centred on (cx, cy), first point straight up. */
export function starPath(cx: number, cy: number, outer: number, inner: number): string {
  const points: string[] = [];
  for (let i = 0; i < 10; i += 1) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    points.push(`${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return `M${points.join(' L')} Z`;
}

/** Makes an SVG element behave like a button for mouse, touch and keyboard. */
export function asButton(node: SVGElement, label: string, onActivate: () => void): void {
  setAttrs(node, { tabindex: 0, role: 'button', 'aria-label': label });
  node.addEventListener('click', onActivate);
  node.addEventListener('keydown', (event) => {
    const key = (event as KeyboardEvent).key;
    if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      onActivate();
    }
  });
}

/**
 * A row of n diamond marks centred on (x, y). They are the game's wordless numbering:
 * they appear next to a finished shape and give its place in the answer.
 * Diamonds, so they are never mistaken for the round fireflies.
 */
export function pips(parent: Element, n: number, x: number, y: number, r = 7, gap = 22, attrs: Attrs = {}): SVGGElement {
  const group = el('g', { class: 'pips', ...attrs }, parent);
  const d = r * 1.35;
  for (let i = 0; i < n; i += 1) {
    const cx = x + (i - (n - 1) / 2) * gap;
    el('path', { d: `M${cx} ${y - d} L${cx + d * 0.75} ${y} L${cx} ${y + d} L${cx - d * 0.75} ${y} Z` }, group);
  }
  return group;
}
