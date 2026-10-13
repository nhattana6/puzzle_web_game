import { DEF, url } from '../core/defs';
import { persist, save } from '../core/game';
import { drawOwl } from '../core/owl';
import { defaultSave } from '../core/save';
import { asButton, el } from '../core/svg';
import { starfield } from '../puzzles/sky';
import { mountAudioControls } from './audioControls';
import { CHAPTERS, chapterUnlocked, levelUnlocked, type Chapter } from './chapters';
import { ICONS } from './icons';

export const GAME_TITLE = 'The Star Keeper';
export const GAME_SUBTITLE = 'Người giữ sao';

/** Where each level's star sits on its chapter's sky, one list per chapter (viewBox 1600×640). */
const LEVEL_STARS: readonly (readonly [number, number][])[] = [
  [
    [150, 250], [360, 140], [580, 230], [800, 130], [1020, 220], [1240, 130], [1450, 250],
    [1270, 420], [1050, 510], [830, 420], [610, 510], [390, 420],
  ],
  [
    [420, 200], [680, 130], [940, 220], [1200, 130], [1440, 220],
    [1300, 430], [1060, 520], [820, 430], [600, 520], [400, 430],
    [250, 300], [150, 160],
  ],
];

const chapterView = (c: Chapter, ci: number): string => {
  if (c.comingSoon) {
    return `<div class="chapter-view coming-soon" data-for="${ci}" hidden>
      <svg viewBox="0 0 200 140" class="soon-art" aria-hidden="true"></svg>
      <h2>${c.title}</h2>
      <p class="soon-tag">Sắp ra mắt</p>
      <p class="soon-text">Chú cú đang tìm thêm những chòm sao mới. Hãy thắp sáng đủ vì sao ở các chương trước và quay lại sau nhé!</p>
    </div>`;
  }
  const lit = c.levels.filter((p) => save.solved.includes(p.id)).length;
  const open = chapterUnlocked(ci, save.solved);
  const previous = CHAPTERS[ci - 1]?.title ?? '';
  return `<div class="chapter-view" data-for="${ci}"${ci === 0 ? '' : ' hidden'}>
      <div class="sky-map-wrap"></div>
      <p class="hub-progress">${open ? `Đã thắp ${lit} / ${c.levels.length} vì sao` : `Hoàn thành ${previous} để mở chương này`}</p>
      <div class="hub-actions">
        <button class="play" type="button" data-chapter="${ci}"${open ? '' : ' disabled'}>${ICONS.lantern}<span>${lit ? 'Chơi tiếp' : 'Bắt đầu'}</span></button>
      </div>
    </div>`;
};

/**
 * Home screen: the night sky as a level map. Each level is a star joined to the
 * next; solving a level lights its star.
 */
export function mountHub(app: HTMLElement, nav: { play(id: string): void }): { destroy(): void } {
  const screen = document.createElement('div');
  screen.className = 'screen hub';
  screen.innerHTML = `
    <header class="hub-title">
      <h1>${GAME_TITLE}</h1>
      <p>${GAME_SUBTITLE}</p>
    </header>
    <nav class="chapter-tabs" aria-label="Chương">
      ${CHAPTERS.map((c, i) => `<button class="chapter-tab${c.comingSoon ? ' soon' : ''}${chapterUnlocked(i, save.solved) ? '' : ' locked'}" type="button" data-chapter="${i}" aria-pressed="${i === 0}">
        <span class="chapter-name">${c.title}${c.comingSoon || !chapterUnlocked(i, save.solved) ? ' 🔒' : ''}</span><span class="chapter-blurb">${c.blurb}</span></button>`).join('')}
    </nav>
    ${CHAPTERS.map(chapterView).join('')}
    <footer class="hub-footer">
      <span class="fireflies" title="Đom đóm"><span class="ff-icon">${ICONS.firefly}</span><span>${save.fireflies}</span></span>
      <span class="audio-controls"></span>
      <button class="link reset" type="button">Chơi lại từ đầu</button>
    </footer>`;
  app.appendChild(screen);
  mountAudioControls(screen.querySelector('.audio-controls') as HTMLElement);

  // Chapter tabs: show one chapter's view at a time. The tab remembers nothing; Chương 1 opens first.
  const tabs = [...screen.querySelectorAll<HTMLButtonElement>('.chapter-tab')];
  const views = [...screen.querySelectorAll<HTMLElement>('.chapter-view')];
  tabs.forEach((tab, i) => tab.addEventListener('click', () => {
    tabs.forEach((t, j) => t.setAttribute('aria-pressed', String(i === j)));
    views.forEach((v) => { v.hidden = Number(v.dataset.for) !== i; });
  }));
  const soonArt = screen.querySelector('.soon-art') as SVGSVGElement | null;
  if (soonArt) {
    starfield(soonArt, { x: 0, y: 0, w: 200, h: 140 }, 40, 11);
    drawOwl(soonArt, 100, 80, 0.8);
  }

  CHAPTERS.forEach((chapter, ci) => {
    const wrap = screen.querySelector(`.chapter-view[data-for="${ci}"] .sky-map-wrap`);
    if (!wrap) return;
    const stars = LEVEL_STARS[ci] ?? [];
    const next = chapter.levels.find((p) => !save.solved.includes(p.id) && levelUnlocked(p.id, save.solved));
    const svg = el('svg', { viewBox: '0 0 1600 640', class: 'sky-map', role: 'group', 'aria-label': `Bản đồ các màn, ${chapter.title}` }, wrap);
    starfield(svg, { x: 0, y: 0, w: 1600, h: 640 }, 220, 3 + ci);
    // The path between levels: bright where both ends are lit.
    for (let i = 0; i < chapter.levels.length - 1; i += 1) {
      const [ax, ay] = stars[i];
      const [bx, by] = stars[i + 1];
      const lit = save.solved.includes(chapter.levels[i].id) && save.solved.includes(chapter.levels[i + 1].id);
      el('line', { x1: ax, y1: ay, x2: bx, y2: by, class: lit ? 'map-path lit' : 'map-path' }, svg);
    }
    chapter.levels.forEach((p, i) => {
      const [x, y] = stars[i] ?? [100 + i * 200, 320];
      const solved = save.solved.includes(p.id);
      const open = levelUnlocked(p.id, save.solved);
      const g = el('g', { class: `level-star${solved ? ' solved' : ''}${p === next ? ' next' : ''}${open ? '' : ' locked'}`, transform: `translate(${x} ${y})` }, svg);
      el('circle', { r: 46, fill: 'transparent' }, g);
      el('circle', { r: 30, class: 'level-halo' }, g);
      el('path', {
        d: 'M0 -26 L7 -8 L26 -8 L11 4 L17 24 L0 12 L-17 24 L-11 4 L-26 -8 L-7 -8 Z',
        class: 'level-shape',
        filter: solved ? url(DEF.glow) : undefined,
      }, g);
      el('text', { y: 66, class: 'level-label' }, g).textContent = `${i + 1}. ${p.name}`;
      if (open) {
        asButton(g, `Màn ${i + 1}: ${p.name}${solved ? ' (đã giải)' : ''}`, () => nav.play(p.id));
      } else {
        // Locked: no name, no button; the level before it has to be solved first.
        g.querySelector('.level-label')!.textContent = `${i + 1}`;
        el('text', { y: 8, class: 'level-lock' }, g).textContent = '🔒';
        g.setAttribute('aria-label', `Màn ${i + 1}: chưa mở`);
        g.setAttribute('role', 'img');
      }
    });
    el('path', { d: 'M40 640 Q40 540 150 540 Q260 540 260 640 Z', fill: '#2a2440' }, svg);
    el('rect', { x: 140, y: 470, width: 24, height: 90, rx: 6, fill: '#3a3354', transform: 'rotate(-30 150 540)' }, svg);
    drawOwl(svg, 150, 520, 0.7);

    screen.querySelector(`.play[data-chapter="${ci}"]`)?.addEventListener('click', () => {
      if (chapterUnlocked(ci, save.solved)) nav.play((next ?? chapter.levels[0]).id);
    });
  });

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
    Object.assign(save, { ...defaultSave(), muted: save.muted, music: save.music });
    persist();
    nav.play('');
  });

  return {
    destroy() {
      clearTimeout(disarm);
      screen.remove();
    },
  };
}
