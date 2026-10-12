import { ICONS, VERB_PATHS } from './icons';

const verb = (path: string) => `<svg viewBox="-20 -20 40 40" aria-hidden="true"><path d="${path}"/></svg>`;

/** What the "?" card shows: how the controls work, never how a level is solved. */
const ITEMS: readonly { icon: string; text: string }[] = [
  { icon: verb(VERB_PATHS.drag), text: 'Bạn có thể kéo, bấm, xoay các vật thể trong cảnh.' },
  { icon: verb(VERB_PATHS.look), text: 'Hãy quan sát và thử mọi thứ: lời giải nằm ngay trong cảnh.' },
  { icon: ICONS.firefly, text: 'Bắt đom đóm (đốm sáng nhấp nháy) để đổi lấy gợi ý.' },
  { icon: ICONS.firefly, text: 'Bấm “Gợi ý” để nhận một gợi ý nhỏ, tối đa 3 lần mỗi màn.' },
  { icon: verb(VERB_PATHS.keypad), text: 'Chọn các chòm sao trên bàn phím theo đúng thứ tự để hoàn thành màn.' },
  { icon: ICONS.musicOn, text: 'Nút ♪ để tắt hoặc bật nhạc nền.' },
  { icon: ICONS.soundOn, text: 'Nút loa để tắt hoặc bật toàn bộ âm thanh.' },
];

/** The help card: the same for every level, opened only from the "?" button. */
export function guideMarkup(): string {
  const items = ITEMS.map((i) => `<li><span class="guide-icon">${i.icon}</span><span>${i.text}</span></li>`).join('');
  return `
    <section class="guide-card" role="dialog" aria-modal="true" aria-labelledby="guide-title">
      <h2 id="guide-title">Trợ giúp</h2>
      <ol class="guide-steps">${items}</ol>
      <button class="guide-start" type="button">Đã hiểu</button>
    </section>`;
}
