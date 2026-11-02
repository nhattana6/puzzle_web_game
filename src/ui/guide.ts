import { el, moonPhase } from '../core/svg';
import { ICONS, VERB_PATHS } from './icons';
import { tr } from '../core/i18n';

const verb = (path: string) => `<svg viewBox="-20 -20 40 40" aria-hidden="true"><path d="${path}"/></svg>`;

/** What the "?" card shows: how the controls work, never how a level is solved. */
const items = (): readonly { icon: string; text: string; wide?: boolean }[] => [
  { icon: verb(VERB_PATHS.drag), text: tr('Bạn có thể kéo, bấm, xoay các vật thể trong cảnh.', 'You can drag, tap and turn the things in the scene.') },
  { icon: verb(VERB_PATHS.look), text: tr('Hãy quan sát và thử mọi thứ: lời giải nằm ngay trong cảnh.', 'Look closely and try everything: the solution is right there in the scene.') },
  { icon: ICONS.zoomIn, text: tr('Chụm hoặc mở hai ngón (hay nút kính lúp, con lăn chuột) để phóng to cảnh; khi đã phóng to, kéo chỗ trống hoặc kéo hai ngón để di chuyển.', 'Pinch with two fingers (or use the magnifier buttons or the mouse wheel) to zoom into the scene; once zoomed in, drag an empty spot or use two fingers to move around.') },
  { icon: ICONS.firefly, text: tr('Bấm “Gợi ý” (tốn 1 đom đóm, bạn có số đom đóm cố định) để xem cách giải cả màn, từng bước.', 'Press “Hint” (it costs 1 firefly, and you only have a few) to see how to solve the whole level, step by step.') },
  { icon: verb(VERB_PATHS.keypad), text: tr('Chọn các chòm sao trên bàn phím theo đúng thứ tự để hoàn thành màn.', 'Pick the constellations on the keypad in the right order to finish the level.') },
  { icon: ICONS.musicOn, text: tr('Nút ♪ để tắt hoặc bật nhạc nền.', 'The ♪ button turns the background music off or on.') },
  { icon: ICONS.soundOn, text: tr('Nút loa để tắt hoặc bật toàn bộ âm thanh.', 'The speaker button turns all sound off or on.') },
];

/** The four phases of the moon in a row, thinnest first, as a small picture. */
export function moonStrip(): string {
  const svg = el('svg', { viewBox: '0 0 168 36', 'aria-hidden': 'true', class: 'moon-strip' });
  [1, 2, 3, 4].forEach((phase, i) => moonPhase(svg, phase, 18 + i * 44, 18, 14, { class: 'moon-phase painted' }));
  return svg.outerHTML;
}

/** For a level whose order is read from the moons: how the moons give it. */
const moonItem = (): { icon: string; text: string; wide: boolean } => ({
  icon: moonStrip(),
  wide: true,
  text: tr(
    'Vầng trăng cạnh mỗi chòm sao cho biết thứ tự nhập: trăng khuyết nhập trước, càng tròn thì càng sau, trăng tròn nhập cuối cùng.',
    'The moon beside each constellation gives the order to enter them: the thinnest moon first, the rounder ones later, the full moon last.',
  ),
});

/** The help card: the same controls for every level, with the level's own few sentences on top when it has any (and the moons' order when the level reads one). */
export function guideMarkup(levelHelp: readonly string[] = [], moonOrder = false): string {
  const note = levelHelp.length ? `<div class="guide-tip">${levelHelp.map((line) => `<p>${line}</p>`).join('')}</div>` : '';
  const list = (moonOrder ? [moonItem(), ...items()] : items())
    .map((i) => (i.wide ? `<li class="guide-moon"><span class="guide-moons">${i.icon}</span><span>${i.text}</span></li>` : `<li><span class="guide-icon">${i.icon}</span><span>${i.text}</span></li>`))
    .join('');
  return `
    <section class="guide-card" role="dialog" aria-modal="true" aria-labelledby="guide-title">
      <div class="guide-body">
        <h2 id="guide-title">${tr('Trợ giúp', 'Help')}</h2>
        ${note}
        <ol class="guide-steps">${list}</ol>
      </div>
      <button class="guide-start" type="button">${tr('Đã hiểu', 'Got it')}</button>
    </section>`;
}
