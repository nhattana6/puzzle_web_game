import { DEF, url } from '../core/defs';
import { persist, save } from '../core/game';
import { drawOwl } from '../core/owl';
import { defaultSave } from '../core/save';
import { asButton, el } from '../core/svg';
import { PUZZLES } from '../puzzles';
import { starfield } from '../puzzles/sky';
import { ICONS } from './icons';

export const GAME_TITLE = 'The Star Keeper';
export const GAME_SUBTITLE = 'Người giữ sao';

/** Where each level's star sits on the home-screen sky (viewBox 1600×640). */
const LEVEL_STARS: readonly [number, number][] = [
  [170, 420], [380, 290], [590, 410], [800, 250], [1010, 370], [1220, 240], [1430, 350],
];

/**
 * Home screen: the night sky as a level map. Each level is a star joined to the
 * next; solving a level lights its star.
 */
export function mountHub(app: HTMLElement, nav: { play(id: string): void }): { destroy(): void } {
  const solvedCount = PUZZLES.filter((p) => save.solved.includes(p.id)).length;
  const next = PUZZLES.find((p) => !save.solved.includes(p.id));
  const screen = document.createElement('div');
  screen.className = 'screen hub';
  screen.innerHTML = `
    <header class="hub-title">
      <h1>${GAME_TITLE}</h1>
      <p>${GAME_SUBTITLE}</p>
    </header>
    <div class="sky-map-wrap"></div>
    <p class="hub-progress">Đã thắp ${solvedCount} / ${PUZZLES.length} vì sao</p>
    <div class="hub-actions">
      <button class="play" type="button">${ICONS.lantern}<span>${solvedCount ? 'Chơi tiếp' : 'Bắt đầu'}</span></button>
    </div>
    <footer class="hub-footer">
      <span class="fireflies" title="Đom đóm"><span class="ff-icon">${ICONS.firefly}</span><span>${save.fireflies}</span></span>
      <button class="link reset" type="button">Chơi lại từ đầu</button>
    </footer>`;
  app.appendChild(screen);

  const svg = el('svg', { viewBox: '0 0 1600 640', class: 'sky-map', role: 'group', 'aria-label': 'Bản đồ các màn' }, screen.querySelector('.sky-map-wrap'));
  starfield(svg, { x: 0, y: 0, w: 1600, h: 640 }, 220, 3);
  // The path between levels: bright where both ends are lit.
  for (let i = 0; i < LEVEL_STARS.length - 1; i += 1) {
    const [ax, ay] = LEVEL_STARS[i];
    const [bx, by] = LEVEL_STARS[i + 1];
    const lit = save.solved.includes(PUZZLES[i].id) && save.solved.includes(PUZZLES[i + 1]?.id ?? '');
    el('line', { x1: ax, y1: ay, x2: bx, y2: by, class: lit ? 'map-path lit' : 'map-path' }, svg);
  }
  PUZZLES.forEach((p, i) => {
    const [x, y] = LEVEL_STARS[i] ?? [100 + i * 200, 320];
    const solved = save.solved.includes(p.id);
    const g = el('g', { class: `level-star${solved ? ' solved' : ''}${p === next ? ' next' : ''}`, transform: `translate(${x} ${y})` }, svg);
    el('circle', { r: 46, fill: 'transparent' }, g);
    el('circle', { r: 30, class: 'level-halo' }, g);
    el('path', {
      d: 'M0 -26 L7 -8 L26 -8 L11 4 L17 24 L0 12 L-17 24 L-11 4 L-26 -8 L-7 -8 Z',
      class: 'level-shape',
      filter: solved ? url(DEF.glow) : undefined,
    }, g);
    el('text', { y: 66, class: 'level-label' }, g).textContent = `${i + 1}. ${p.name}`;
    asButton(g, `Màn ${i + 1}: ${p.name}${solved ? ' (đã giải)' : ''}`, () => nav.play(p.id));
  });
  el('path', { d: 'M40 640 Q40 540 150 540 Q260 540 260 640 Z', fill: '#2a2440' }, svg);
  el('rect', { x: 140, y: 470, width: 24, height: 90, rx: 6, fill: '#3a3354', transform: 'rotate(-30 150 540)' }, svg);
  drawOwl(svg, 150, 520, 0.7);

  screen.querySelector('.play')?.addEventListener('click', () => nav.play((next ?? PUZZLES[0]).id));

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
      screen.remove();
    },
  };
}
