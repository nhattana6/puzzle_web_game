import { DEF, url } from '../core/defs';
import { persist, save } from '../core/game';
import { drawOwl } from '../core/owl';
import { defaultSave } from '../core/save';
import { asButton, el } from '../core/svg';
import { starfield } from '../puzzles/sky';
import { mountAudioControls } from './audioControls';
import { CHAPTERS, chapterUnlocked, levelUnlocked, type Chapter } from './chapters';
import { ICONS } from './icons';
import { lang, setLang, tr } from '../core/i18n';

export const GAME_TITLE = 'The Star Keeper';
export const gameSubtitle = (): string => tr('Người giữ sao', 'Relight the night sky');

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
  [
    [200, 300], [420, 180], [660, 270], [900, 160], [1140, 250], [1400, 160],
    [1450, 360], [1220, 470], [980, 400], [740, 500], [520, 400], [330, 470],
  ],
  [
    [420, 330], [640, 220], [860, 320], [1080, 210], [1290, 310], [1470, 210],
    [1480, 420], [1260, 520], [1030, 450], [800, 540], [580, 480], [380, 540],
  ],
  [
    [150, 350], [340, 300], [530, 390], [720, 260], [910, 350], [1100, 240],
    [1300, 310], [1460, 410], [1290, 510], [1070, 550], [850, 480], [640, 550],
  ],
];

const chapterView = (c: Chapter, ci: number, start: number): string => {
  if (c.comingSoon) {
    return `<div class="chapter-view coming-soon" data-for="${ci}" hidden>
      <svg viewBox="0 0 200 140" class="soon-art" aria-hidden="true"></svg>
      <h2>${c.title}</h2>
      <p class="soon-tag">${tr('Sắp ra mắt', 'Coming soon')}</p>
      <p class="soon-text">${tr('Chú cú đang tìm thêm những chòm sao mới. Hãy thắp sáng đủ vì sao ở các chương trước và quay lại sau nhé!', 'The owl is out looking for new constellations. Light every star in the earlier chapters and come back later!')}</p>
    </div>`;
  }
  const lit = c.levels.filter((p) => save.solved.includes(p.id)).length;
  const open = chapterUnlocked(ci, save.solved);
  const previous = CHAPTERS[ci - 1]?.title ?? '';
  return `<div class="chapter-view" data-for="${ci}"${ci === start ? '' : ' hidden'}>
      <div class="sky-map-wrap"></div>
      <p class="hub-progress">${open ? tr(`Đã thắp ${lit} / ${c.levels.length} vì sao`, `${lit} / ${c.levels.length} stars lit`) : tr(`Hoàn thành ${previous} để mở chương này`, `Finish ${previous} to open this chapter`)}</p>
      <div class="hub-actions">
        <button class="play" type="button" data-chapter="${ci}"${open ? '' : ' disabled'}>${ICONS.lantern}<span>${lit ? tr('Chơi tiếp', 'Continue') : tr('Bắt đầu', 'Start')}</span></button>
      </div>
    </div>`;
};

/**
 * Home screen: the night sky as a level map. Each level is a star joined to the
 * next; solving a level lights its star.
 */
export function mountHub(app: HTMLElement, nav: { play(id: string): void }, startChapter = 0): { destroy(): void } {
  const start = CHAPTERS[startChapter] ? startChapter : 0;
  const screen = document.createElement('div');
  screen.className = 'screen hub';
  screen.innerHTML = `
    <header class="hub-title">
      <h1>${GAME_TITLE}</h1>
      <p>${gameSubtitle()}</p>
    </header>
    <nav class="chapter-tabs" aria-label="${tr('Chương', 'Chapters')}">
      ${CHAPTERS.map((c, i) => `<button class="chapter-tab${c.comingSoon ? ' soon' : ''}${chapterUnlocked(i, save.solved) ? '' : ' locked'}" type="button" data-chapter="${i}" aria-pressed="${i === start}">
        <span class="chapter-name">${c.title}${c.comingSoon || !chapterUnlocked(i, save.solved) ? ' 🔒' : ''}</span><span class="chapter-blurb">${c.blurb}</span></button>`).join('')}
    </nav>
    ${CHAPTERS.map((c, i) => chapterView(c, i, start)).join('')}
    <footer class="hub-footer">
      <span class="fireflies" title="${tr('Đom đóm', 'Fireflies')}"><span class="ff-icon">${ICONS.firefly}</span><span>${save.fireflies}</span></span>
      <span class="audio-controls"></span>
      <button class="link reset" type="button">${tr('Chơi lại từ đầu', 'Start over')}</button>
      <button class="link lang-switch" type="button" lang="${lang() === 'vi' ? 'en' : 'vi'}">${lang() === 'vi' ? 'English' : 'Tiếng Việt'}</button>
    </footer>`;
  app.appendChild(screen);
  mountAudioControls(screen.querySelector('.audio-controls') as HTMLElement);

  // Chapter tabs: show one chapter's view at a time. The chapter the player came from (or Chương 1) opens first.
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
    const svg = el('svg', { viewBox: '0 0 1600 640', class: 'sky-map', role: 'group', 'aria-label': tr(`Bản đồ các màn, ${chapter.title}`, `Level map, ${chapter.title}`) }, wrap);
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
      const label = el('text', { y: 66, class: 'level-label' }, g);
      label.textContent = `${i + 1}. ${p.name}`;
      // Keep a long name inside the sky: slide it sideways when it would run past the edge (about 15 units a letter at the biggest size).
      const half = (label.textContent.length * 15.5) / 2;
      const dx = x + half > 1590 ? 1590 - (x + half) : x - half < 10 ? 10 - (x - half) : 0;
      if (dx) label.setAttribute('dx', String(Math.round(dx)));
      if (open) {
        asButton(g, tr(`Màn ${i + 1}: ${p.name}${solved ? ' (đã giải)' : ''}`, `Level ${i + 1}: ${p.name}${solved ? ' (solved)' : ''}`), () => nav.play(p.id));
      } else {
        // Locked: no name, no button; the level before it has to be solved first.
        label.textContent = `${i + 1}`;
        label.removeAttribute('dx');
        el('text', { y: 8, class: 'level-lock' }, g).textContent = '🔒';
        g.setAttribute('aria-label', tr(`Màn ${i + 1}: chưa mở`, `Level ${i + 1}: locked`));
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

  // Language: the choice is saved and outranks the locale; the map is drawn again in the new language.
  screen.querySelector('.lang-switch')?.addEventListener('click', () => {
    save.lang = lang() === 'vi' ? 'en' : 'vi';
    setLang(save.lang);
    persist();
    nav.play('');
  });

  // Two-step reset built into the page: embedded viewers block window.confirm().
  const reset = screen.querySelector('.reset') as HTMLButtonElement;
  let disarm = 0;
  reset.addEventListener('click', () => {
    if (!disarm) {
      reset.textContent = tr('Bấm lần nữa để xoá tiến trình', 'Tap again to erase your progress');
      reset.classList.add('armed');
      disarm = window.setTimeout(() => {
        disarm = 0;
        reset.textContent = tr('Chơi lại từ đầu', 'Start over');
        reset.classList.remove('armed');
      }, 4000);
      return;
    }
    clearTimeout(disarm);
    Object.assign(save, { ...defaultSave(), muted: save.muted, music: save.music, lang: save.lang });
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
