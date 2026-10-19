import { DEF, url } from '../core/defs';
import { persist, save } from '../core/game';
import { platform } from '../core/platform';
import { drawOwl } from '../core/owl';
import { defaultSave } from '../core/save';
import { asButton, el } from '../core/svg';
import { starfield } from '../puzzles/sky';
import { mountAudioControls } from './audioControls';
import { CHAPTERS, chapterUnlocked, levelUnlocked, playTarget, type Chapter } from './chapters';
import { ICONS } from './icons';
import { MAP_W, verticalHeight, verticalMapWanted, verticalStars } from './mapLayout';
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

/** What a chapter's play button says: Start, Continue, or Play again once there is nothing left to play. */
const playLabel = (ci: number): string => {
  const label = playTarget(ci, save.solved)?.label ?? 'start';
  return label === 'replay' ? tr('Chơi lại', 'Play again') : label === 'continue' ? tr('Chơi tiếp', 'Continue') : tr('Bắt đầu', 'Start');
};

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
        <button class="play" type="button" data-chapter="${ci}"${open ? '' : ' disabled'}>${ICONS.lantern}<span>${playLabel(ci)}</span></button>
      </div>
    </div>`;
};

/** What the game keeps about the player (nothing personal), and whose terms apply on a portal. */
const privacyMarkup = (): string => `
  <section class="guide-card" role="dialog" aria-modal="true" aria-labelledby="privacy-title">
    <div class="guide-body">
      <h2 id="privacy-title">${tr('Quyền riêng tư', 'Privacy')}</h2>
      <p>${tr(
        'The Star Keeper không thu thập dữ liệu cá nhân và không cần tài khoản. Game chỉ lưu tiến trình (màn đã giải, đom đóm, cài đặt âm thanh và ngôn ngữ) để bạn chơi tiếp.',
        'The Star Keeper collects no personal data and needs no account. It only saves your progress (solved levels, fireflies, sound and language settings) so you can carry on playing.',
      )}</p>
      <p>${platform.active
        ? tr(
          'Khi chơi trên CrazyGames, Điều khoản sử dụng và Chính sách bảo mật của CrazyGames được áp dụng.',
          'When you play on CrazyGames, the CrazyGames Terms of Use and Privacy Policy apply.',
        )
        : tr('Tiến trình nằm trong trình duyệt của bạn; "Chơi lại từ đầu" xoá nó.', 'Your progress stays in your browser; "Start over" erases it.')}</p>
    </div>
    <button class="guide-start" type="button">${tr('Đã hiểu', 'Got it')}</button>
  </section>`;

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
      <button class="link privacy" type="button">${tr('Quyền riêng tư', 'Privacy')}</button>
    </footer>
    <div class="guide-overlay privacy-overlay" hidden>${privacyMarkup()}</div>`;
  app.appendChild(screen);
  mountAudioControls(screen.querySelector('.audio-controls') as HTMLElement);

  // A phone turned upright or sideways swaps the map's layout: draw the home screen again.
  const vertical = verticalMapWanted();
  const orientation = typeof matchMedia === 'function' ? matchMedia('(max-width: 700px) and (orientation: portrait)') : null;
  const onLayout = () => nav.play('');
  orientation?.addEventListener('change', onLayout);

  // Chapter tabs: show one chapter's view at a time. The chapter the player came from (or Chương 1) opens first.
  const tabs = [...screen.querySelectorAll<HTMLButtonElement>('.chapter-tab')];
  const views = [...screen.querySelectorAll<HTMLElement>('.chapter-view')];
  // The downward map is long: bring the next level into view (not when it already is).
  const showNext = (view: Element | undefined) => {
    if (!vertical) return;
    requestAnimationFrame(() => {
      const star = view?.querySelector<SVGGElement>('.level-star.next');
      if (!star) return;
      const r = star.getBoundingClientRect();
      if (r.top < 90 || r.bottom > innerHeight - 20) star.scrollIntoView({ block: 'center' });
    });
  };
  tabs.forEach((tab, i) => tab.addEventListener('click', () => {
    tabs.forEach((t, j) => t.setAttribute('aria-pressed', String(i === j)));
    views.forEach((v) => { v.hidden = Number(v.dataset.for) !== i; });
    showNext(views.find((v) => Number(v.dataset.for) === i));
  }));
  const soonArt = screen.querySelector('.soon-art') as SVGSVGElement | null;
  if (soonArt) {
    starfield(soonArt, { x: 0, y: 0, w: 200, h: 140 }, 40, 11);
    drawOwl(soonArt, 100, 80, 0.8);
  }

  CHAPTERS.forEach((chapter, ci) => {
    const wrap = screen.querySelector(`.chapter-view[data-for="${ci}"] .sky-map-wrap`);
    if (!wrap) return;
    // Upright phone: the map runs down the screen (a taller map, bigger stars and names); otherwise across a wide sky.
    const stars = vertical ? verticalStars(chapter.levels.length) : LEVEL_STARS[ci] ?? [];
    const W = vertical ? MAP_W : 1600;
    const H = vertical ? verticalHeight(chapter.levels.length) : 640;
    const S = vertical ? 1.5 : 1;
    const next = chapter.levels.find((p) => !save.solved.includes(p.id) && levelUnlocked(p.id, save.solved));
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: vertical ? 'sky-map vertical' : 'sky-map', role: 'group', 'aria-label': tr(`Bản đồ các màn, ${chapter.title}`, `Level map, ${chapter.title}`) }, wrap);
    starfield(svg, { x: 0, y: 0, w: W, h: H }, vertical ? 150 : 220, 3 + ci);
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
      const g = el('g', { class: `level-star${solved ? ' solved' : ''}${p === next ? ' next' : ''}${open ? '' : ' locked'}`, transform: `translate(${x} ${y})${S === 1 ? '' : ` scale(${S})`}` }, svg);
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
      const half = vertical ? (label.textContent.length * 0.55 * 21 * S) / 2 : (label.textContent.length * 15.5) / 2;
      const dx = x + half > W - 10 ? W - 10 - (x + half) : x - half < 10 ? 10 - (x - half) : 0;
      if (dx) label.setAttribute('dx', String(Math.round(dx / S)));
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
    // The owl's hill: bottom left of the sky, or at the foot of the downward map.
    const hillY = vertical ? H - 40 : 640;
    el('path', { d: `M40 ${hillY} Q40 ${hillY - 100} 150 ${hillY - 100} Q260 ${hillY - 100} 260 ${hillY} Z`, fill: '#2a2440' }, svg);
    el('rect', { x: 140, y: hillY - 170, width: 24, height: 90, rx: 6, fill: '#3a3354', transform: `rotate(-30 150 ${hillY - 100})` }, svg);
    drawOwl(svg, 150, hillY - 120, vertical ? 1 : 0.7);

    // The play button: the next level here, or on to the next chapter once this one is done, or play again.
    screen.querySelector(`.play[data-chapter="${ci}"]`)?.addEventListener('click', () => {
      const target = playTarget(ci, save.solved);
      if (target) nav.play(target.id);
    });
  });

  showNext(views.find((v) => !v.hidden));

  // Language: the choice is saved and outranks the locale; the map is drawn again in the new language.
  screen.querySelector('.lang-switch')?.addEventListener('click', () => {
    save.lang = lang() === 'vi' ? 'en' : 'vi';
    setLang(save.lang);
    persist();
    nav.play('');
  });

  // Privacy card: opened from the footer, closed by its button, a click outside or Escape.
  const privacyBtn = screen.querySelector('.privacy') as HTMLButtonElement;
  const privacyLayer = screen.querySelector('.privacy-overlay') as HTMLDivElement;
  const closePrivacy = () => {
    if (privacyLayer.hidden) return;
    privacyLayer.hidden = true;
    privacyBtn.focus();
  };
  privacyBtn.addEventListener('click', () => {
    privacyLayer.hidden = false;
    privacyLayer.querySelector<HTMLButtonElement>('.guide-start')?.focus();
  });
  privacyLayer.querySelector('.guide-start')?.addEventListener('click', closePrivacy);
  privacyLayer.addEventListener('click', (event) => {
    if (event.target === privacyLayer) closePrivacy();
  });
  const onKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape') closePrivacy();
  };
  document.addEventListener('keydown', onKey);

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
    Object.assign(save, { ...defaultSave(), muted: save.muted, music: save.music, lang: save.lang, seenTips: save.seenTips });
    persist();
    nav.play('');
  });

  return {
    destroy() {
      orientation?.removeEventListener('change', onLayout);
      document.removeEventListener('keydown', onKey);
      clearTimeout(disarm);
      screen.remove();
    },
  };
}
