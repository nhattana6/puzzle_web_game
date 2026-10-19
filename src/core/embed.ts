/**
 * Manners for running inside a portal's iframe: keys and the mouse wheel must not scroll the
 * host page, and right-click opens no browser menu. Panels that really scroll (help card, phone
 * map) keep scrolling until their end; only the leftover that would reach the host is stopped.
 */

/** Which way each scrolling key moves: [dx, dy]. Space scrolls down. */
export const SCROLL_KEYS: Readonly<Record<string, readonly [number, number]>> = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  PageUp: [0, -1],
  PageDown: [0, 1],
  Home: [0, -1],
  End: [0, 1],
  ' ': [0, 1],
};

const EDITABLE = 'input, textarea, select, [contenteditable]';

/** Can `el` itself scroll any further by (dx, dy)? */
function scrollsFurther(el: Element, dx: number, dy: number): boolean {
  const isRoot = el === document.scrollingElement;
  const style = getComputedStyle(el);
  const open = (overflow: string) => (isRoot ? overflow !== 'hidden' && overflow !== 'clip' : /auto|scroll/.test(overflow));
  if (dy && open(style.overflowY)) {
    if (dy < 0 ? el.scrollTop > 0 : el.scrollTop + el.clientHeight < el.scrollHeight - 1) return true;
  }
  if (dx && open(style.overflowX)) {
    if (dx < 0 ? el.scrollLeft > 0 : el.scrollLeft + el.clientWidth < el.scrollWidth - 1) return true;
  }
  return false;
}

/** Can anything from `start` up to the page itself still scroll by (dx, dy)? */
export function canScroll(start: Element | null, dx: number, dy: number): boolean {
  for (let el = start; el; el = el.parentElement) if (scrollsFurther(el, dx, dy)) return true;
  const root = document.scrollingElement;
  return !!root && !root.contains(start) && scrollsFurther(root, dx, dy);
}

const asElement = (target: EventTarget | null): Element | null => (target instanceof Element ? target : null);

export function installEmbedGuards(): void {
  window.addEventListener('keydown', (event) => {
    const dir = SCROLL_KEYS[event.key];
    const target = asElement(event.target);
    if (!dir || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
    if (target?.closest(EDITABLE)) return;
    // Space on a button presses it; the browser doesn't scroll then.
    if (event.key === ' ' && target?.closest('button, a[href], [role="button"]')) return;
    if (!canScroll(target ?? document.body, dir[0], dir[1])) event.preventDefault();
  });
  window.addEventListener(
    'wheel',
    (event) => {
      if (event.ctrlKey) return; // pinch / browser zoom
      const target = asElement(event.target) ?? document.body;
      if (!canScroll(target, Math.sign(event.deltaX), Math.sign(event.deltaY))) event.preventDefault();
    },
    { passive: false },
  );
  document.addEventListener('contextmenu', (event) => {
    if (!asElement(event.target)?.closest(EDITABLE)) event.preventDefault();
  });
  // Nothing in the game is meant to be selected: a drag that strays off a thing, a double tap or a long
  // press must never paint text blue. (The CSS says the same; this covers browsers that ignore it.)
  document.addEventListener('selectstart', (event) => {
    if (!asElement(event.target)?.closest(EDITABLE)) event.preventDefault();
  });
}
