import { DEF, url } from '../core/defs';
import { persist, save } from '../core/game';
import { defaultSave } from '../core/save';
import { el, uid } from '../core/svg';
import { mod } from '../core/tween';
import { drawZodiac, ZODIAC, type ZodiacId } from '../core/zodiac';
import { PUZZLES } from '../puzzles';
import { ICONS } from './icons';

export const GAME_TITLE = 'Twelve Paper Shadows';
export const GAME_SUBTITLE = 'Mười Hai Bóng Giấy';

/** Signs already returned to the lantern = answers of solved puzzles. */
export function collectedSigns(solved: readonly string[]): Set<ZodiacId> {
  return new Set(PUZZLES.filter((p) => solved.includes(p.id)).flatMap((p) => p.answer));
}

const SPACING = 120;
const LOOP = ZODIAC.length * SPACING;

/** Home screen: the grandfather's revolving lantern ("đèn kéo quân") and the puzzle list. */
export function mountHub(app: HTMLElement, nav: { play(id: string): void }): { destroy(): void } {
  const screen = document.createElement('div');
  screen.className = 'screen hub';
  screen.innerHTML = `
    <header class="hub-title">
      <h1>${GAME_TITLE}</h1>
      <p>${GAME_SUBTITLE}</p>
    </header>
    <div class="lantern-wrap"></div>
    <nav class="puzzle-list" aria-label="Câu đố"></nav>
    <div class="hub-actions">
      <button class="play" type="button">${ICONS.lantern}<span>Thắp đèn</span></button>
    </div>
    <footer class="hub-footer">
      <span class="fireflies" title="Đom đóm"><span class="ff-icon">${ICONS.firefly}</span><span>${save.fireflies}</span></span>
      <button class="link reset" type="button">Chơi lại từ đầu</button>
    </footer>`;
  app.appendChild(screen);

  const collected = collectedSigns(save.solved);

  // The lantern: shadows of the returned signs parade around inside the paper.
  const svg = el('svg', { viewBox: '0 0 600 560', class: 'lantern', role: 'img', 'aria-label': `Đèn kéo quân: ${collected.size}/12 con giáp` }, screen.querySelector('.lantern-wrap'));
  const glowId = uid('hub-glow');
  const glow = el('radialGradient', { id: glowId }, svg);
  el('stop', { offset: 0, 'stop-color': '#ffe7a8' }, glow);
  el('stop', { offset: 1, 'stop-color': '#efd9a8' }, glow);
  const clipId = uid('hub-clip');
  el('rect', { x: 150, y: 110, width: 300, height: 300 }, el('clipPath', { id: clipId }, svg));

  el('line', { x1: 300, y1: 0, x2: 300, y2: 72, stroke: '#2b2622', 'stroke-width': 3 }, svg);
  el('rect', { x: 150, y: 110, width: 300, height: 300, fill: url(glowId), class: 'lantern-paper' }, svg);
  el('rect', { x: 150, y: 110, width: 300, height: 300, fill: url(DEF.grain) }, svg);
  const parade = el('g', { 'clip-path': url(clipId) }, svg);
  parade.style.color = '#2b2622';
  const walkers = ZODIAC.map((z, i) => {
    const g = el('g', { opacity: collected.has(z.id) ? 0.82 : 0 }, parade);
    drawZodiac(el('g', { transform: 'scale(1.05)' }, g), z.id);
    return { g, i };
  });
  for (const x of [225, 300, 375]) el('line', { x1: x, y1: 110, x2: x, y2: 410, stroke: '#b7372a', 'stroke-width': 3, opacity: 0.45 }, svg);
  el('rect', { x: 150, y: 110, width: 300, height: 300, fill: 'none', stroke: '#7a2119', 'stroke-width': 6 }, svg);
  el('path', { d: 'M190 72 L410 72 L445 112 L155 112 Z', fill: '#b7372a', filter: url(DEF.rough) }, svg);
  el('path', { d: 'M155 408 L445 408 L410 448 L190 448 Z', fill: '#b7372a', filter: url(DEF.rough) }, svg);
  el('line', { x1: 300, y1: 448, x2: 300, y2: 468, stroke: '#b7372a', 'stroke-width': 4 }, svg);
  el('path', { d: 'M290 468 L310 468 L314 506 L286 506 Z', fill: '#b7372a' }, svg);

  // Twelve marks under the lantern: filled for each sign found.
  ZODIAC.forEach((z, i) => {
    const angle = Math.PI * (0.15 + (0.7 * i) / (ZODIAC.length - 1));
    el('circle', {
      cx: 300 - Math.cos(angle) * 250,
      cy: 488 + Math.sin(angle) * 52,
      r: 7,
      class: collected.has(z.id) ? 'mark found' : 'mark',
    }, svg);
  });

  let frame = 0;
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const animate = (now: number) => {
    const offset = reduceMotion ? 0 : now * 0.035;
    for (const { g, i } of walkers) {
      const x = 150 + mod(i * SPACING + offset, LOOP) - SPACING;
      g.setAttribute('transform', `translate(${x.toFixed(1)} 200)`);
    }
    if (!reduceMotion) frame = requestAnimationFrame(animate);
  };
  frame = requestAnimationFrame(animate);

  // Puzzle tokens: dots for the number while unsolved, the animals once solved.
  const list = screen.querySelector('.puzzle-list') as HTMLElement;
  const nextUnsolved = PUZZLES.find((p) => !save.solved.includes(p.id));
  PUZZLES.forEach((p, i) => {
    const solved = save.solved.includes(p.id);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `token${solved ? ' solved' : ''}${p === nextUnsolved ? ' next' : ''}`;
    button.setAttribute('aria-label', `${i + 1}. ${p.name}${solved ? ' (đã giải)' : ''}`);
    const icon = el('svg', { viewBox: '0 0 100 100', 'aria-hidden': 'true' }, button);
    if (solved) {
      const s = 0.9 / p.answer.length;
      p.answer.forEach((id, k) => drawZodiac(el('g', { transform: `translate(${5 + k * 90 / p.answer.length} ${50 - 50 * s}) scale(${s})` }, icon), id));
    } else {
      for (let d = 0; d <= i; d += 1) el('circle', { cx: 50 + (d - i / 2) * 18, cy: 50, r: 6 }, icon);
    }
    button.addEventListener('click', () => nav.play(p.id));
    list.appendChild(button);
  });

  screen.querySelector('.play')?.addEventListener('click', () => nav.play((nextUnsolved ?? PUZZLES[0]).id));
  // Two-step reset built into the page: embedded viewers block window.confirm().
  const reset = screen.querySelector('.reset') as HTMLButtonElement;
  let disarm = 0;
  reset.addEventListener('click', () => {
    if (!disarm) {
      reset.textContent = 'Bấm lần nữa để xoá tiến trình';
      reset.classList.add('armed');
      disarm = window.setTimeout(() => {
        disarm = 0;
        reset.textContent = 'Chơi lại từ đầu';
        reset.classList.remove('armed');
      }, 4000);
      return;
    }
    clearTimeout(disarm);
    Object.assign(save, { ...defaultSave(), muted: save.muted });
    persist();
    nav.play('');
  });

  return {
    destroy() {
      clearTimeout(disarm);
      cancelAnimationFrame(frame);
      screen.remove();
    },
  };
}
