import { PUZZLES } from '../puzzles';
import type { PuzzleDef } from '../puzzles/types';
import { VERB_PATHS } from './icons';

const escape = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const glyph = (path: string) =>
  `<svg viewBox="-20 -20 40 40" aria-hidden="true"><path d="${path}"/></svg>`;

/** The how-to card for a level: goal, the actions it uses, and how to enter the answer. */
export function guideMarkup(def: PuzzleDef): string {
  const n = def.answer.length;
  const steps = def.guide.steps
    .map((step) => `<li><span class="guide-icon">${glyph(VERB_PATHS[step.icon])}</span><span>${escape(step.text)}</span></li>`)
    .join('');
  return `
    <section class="guide-card" role="dialog" aria-modal="true" aria-labelledby="guide-title-${def.id}">
      <p class="guide-level">Màn ${PUZZLES.indexOf(def) + 1} / ${PUZZLES.length}</p>
      <h2 id="guide-title-${def.id}">${escape(def.name)}</h2>
      <p class="guide-goal">${escape(def.guide.goal)}</p>
      <ol class="guide-steps">
        ${steps}
        <li><span class="guide-icon">${glyph(VERB_PATHS.keypad)}</span><span>Bấm ${n} chòm sao trên bàn phím theo đúng thứ tự. Sai thì bàn phím khoá một lúc, sai càng nhiều khoá càng lâu.</span></li>
      </ol>
      ${def.guide.tip ? `<p class="guide-tip"><strong>Mẹo:</strong> ${escape(def.guide.tip)}</p>` : ''}
      <p class="guide-help">Bí thì bắt đom đóm (đốm sáng nhấp nháy) trong cảnh rồi bấm “Gợi ý”: một hình minh hoạ sẽ chỉ cách làm một phần. Tối đa 3 gợi ý mỗi màn.</p>
      <button class="guide-start" type="button"></button>
    </section>`;
}
