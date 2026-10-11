import { DEF, url } from '../core/defs';
import { persist, save } from '../core/game';
import { defaultSave } from '../core/save';
import { el } from '../core/svg';
import { CHAPTERS, PUZZLES } from '../puzzles';
import { ICONS } from './icons';

export const GAME_TITLE = 'Paper Shadows';
export const GAME_SUBTITLE = 'Giải đố Giấy & Bóng';

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Home screen: a garland of paper lanterns (one per level, lit when solved) and the chapters. */
export function mountHub(app: HTMLElement, nav: { play(id: string): void }): { destroy(): void } {
  const solvedCount = PUZZLES.filter((p) => save.solved.includes(p.id)).length;
  const nextUnsolved = PUZZLES.find((p) => !save.solved.includes(p.id));
  const screen = document.createElement('div');
  screen.className = 'screen hub';
  screen.innerHTML = `
    <header class="hub-title">
      <h1>${GAME_TITLE}</h1>
      <p>${GAME_SUBTITLE}</p>
    </header>
    <div class="garland-wrap"></div>
    <p class="hub-progress">Đã thắp ${solvedCount} / ${PUZZLES.length} đèn</p>
    <div class="hub-actions">
      <button class="play" type="button">${ICONS.lantern}<span>${solvedCount ? 'Chơi tiếp' : 'Bắt đầu'}</span></button>
    </div>
    <section class="chapters" aria-label="Các chương"></section>
    <footer class="hub-footer">
      <span class="fireflies" title="Đom đóm"><span class="ff-icon">${ICONS.firefly}</span><span>${save.fireflies}</span></span>
      <button class="link reset" type="button">Chơi lại từ đầu</button>
    </footer>`;
  app.appendChild(screen);

  // Garland: one lantern per level, swaying gently; solved ones glow.
  const width = Math.max(600, PUZZLES.length * 110 + 80);
  const svg = el('svg', { viewBox: `0 0 ${width} 190`, class: 'garland', role: 'img', 'aria-label': `${solvedCount} trên ${PUZZLES.length} đèn đã thắp` }, screen.querySelector('.garland-wrap'));
  el('path', { d: `M10 30 Q${width / 2} 90 ${width - 10} 30`, fill: 'none', stroke: '#5a4636', 'stroke-width': 3 }, svg);
  const lanterns = PUZZLES.map((p, i) => {
    const x = 50 + (i + 0.5) * ((width - 100) / PUZZLES.length);
    const t = (x - 10) / (width - 20);
    const y = 30 + 120 * t * (1 - t);
    const lit = save.solved.includes(p.id);
    const g = el('g', { class: `garland-lantern${lit ? ' lit' : ''}` }, svg);
    el('line', { x1: 0, y1: 0, x2: 0, y2: 22, stroke: '#5a4636', 'stroke-width': 2 }, g);
    el('rect', { x: -14, y: 20, width: 28, height: 7, rx: 2, fill: '#2b2622' }, g);
    el('ellipse', { cx: 0, cy: 58, rx: 32, ry: 32, class: 'garland-body', filter: lit ? url(DEF.glow) : undefined }, g);
    el('path', { d: 'M-16 30 Q-26 58 -16 86 M0 26 V90 M16 30 Q26 58 16 86', fill: 'none', stroke: '#7a2119', 'stroke-width': 2, opacity: 0.5 }, g);
    el('rect', { x: -14, y: 88, width: 28, height: 7, rx: 2, fill: '#2b2622' }, g);
    el('line', { x1: 0, y1: 95, x2: 0, y2: 118, stroke: '#b7372a', 'stroke-width': 3 }, g);
    return { g, x, y, i };
  });

  let frame = 0;
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const sway = (now: number) => {
    for (const { g, x, y, i } of lanterns) {
      const angle = reduceMotion ? 0 : Math.sin(now / 1100 + i * 0.9) * 3;
      g.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${angle.toFixed(2)})`);
    }
    if (!reduceMotion) frame = requestAnimationFrame(sway);
  };
  frame = requestAnimationFrame(sway);

  // Chapters with their level cards.
  const chapters = screen.querySelector('.chapters') as HTMLElement;
  for (const chapter of CHAPTERS) {
    const done = chapter.puzzles.filter((p) => save.solved.includes(p.id)).length;
    const section = document.createElement('article');
    section.className = 'chapter';
    section.innerHTML = `
      <header>
        <h2>${escape(chapter.name)}</h2>
        <span class="chapter-count">${done} / ${chapter.puzzles.length}</span>
      </header>
      <p>${escape(chapter.blurb)}</p>
      <div class="level-list"></div>`;
    const list = section.querySelector('.level-list') as HTMLElement;
    chapter.puzzles.forEach((p, i) => {
      const solved = save.solved.includes(p.id);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `level-card${solved ? ' solved' : ''}${p === nextUnsolved ? ' next' : ''}`;
      button.innerHTML = `<span class="level-num">${solved ? '✓' : i + 1}</span><span class="level-name">${escape(p.name)}</span>`;
      button.setAttribute('aria-label', `${chapter.name}, màn ${i + 1}: ${p.name}${solved ? ' (đã giải)' : ''}`);
      button.addEventListener('click', () => nav.play(p.id));
      list.appendChild(button);
    });
    chapters.appendChild(section);
  }

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
