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
 * A moon in phase 1–4 (thin crescent, half, gibbous, full), centred on (x, y).
 * Moon phases are the game's wordless numbering: they mark the reading order.
 */
export function moonPhase(parent: Element, phase: number, x: number, y: number, r = 14, attrs: Attrs = {}): SVGGElement {
  const g = el('g', { class: 'moon-phase', transform: `translate(${x} ${y})`, ...attrs }, parent);
  el('circle', { r, class: 'moon-dark' }, g);
  const lit = {
    1: `M0 ${-r} A${r} ${r} 0 0 1 0 ${r} A${r * 0.55} ${r} 0 0 0 0 ${-r} Z`,
    2: `M0 ${-r} A${r} ${r} 0 0 1 0 ${r} Z`,
    3: `M0 ${-r} A${r} ${r} 0 0 1 0 ${r} A${r * 0.55} ${r} 0 0 1 0 ${-r} Z`,
  }[phase];
  if (lit) el('path', { d: lit, class: 'moon-lit' }, g);
  else el('circle', { r, class: 'moon-lit' }, g);
  return g;
}

/** The "undo" icon: a hooked arrow pointing back, about 40 units across and centred on (0, 0). Stroke it with the caller's group style. */
export function undoIcon(parent: Element): SVGPathElement {
  return el('path', { d: 'M-8 -20 L-20 -8 L-8 4 M-20 -8 H4 A14 14 0 0 1 4 20 H-14', fill: 'none' }, parent);
}

/** The "start again" icon: a circular arrow, about 40 units across and centred on (0, 0). */
export function resetIcon(parent: Element): SVGPathElement {
  return el('path', {
    d: 'M17.3 10 A20 20 0 1 1 10 -17.3 M4.9 -28.2 L10 -17.3 L-2 -16.3',
    fill: 'none',
    transform: 'translate(0 4)',
  }, parent);
}
