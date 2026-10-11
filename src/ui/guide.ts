import type { PuzzleDef } from '../puzzles/types';
import { VERB_PATHS } from './icons';

const escape = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const glyph = (path: string) =>
  `<svg viewBox="-20 -20 40 40" aria-hidden="true"><path d="${path}"/></svg>`;

/** The answer ring in miniature: twelve dots around a circle. */
const ringGlyph = () => {
  const dots = Array.from({ length: 12 }, (_, i) => {
    const a = (i * Math.PI) / 6;
    return `<circle cx="${(Math.sin(a) * 13).toFixed(1)}" cy="${(-Math.cos(a) * 13).toFixed(1)}" r="2.6"/>`;
  }).join('');
  return `<svg viewBox="-20 -20 40 40" aria-hidden="true" class="ring-glyph">${dots}</svg>`;
};

/** The how-to card for a level: goal, actions, how to read the order, how to answer. */
export function guideMarkup(def: PuzzleDef, index: number, total: number): string {
  const n = def.answer.length;
  const steps = def.guide.steps
    .map((step) => `<li><span class="guide-icon">${glyph(VERB_PATHS[step.icon])}</span><span>${escape(step.text)}</span></li>`)
    .join('');
  return `
    <section class="guide-card" role="dialog" aria-modal="true" aria-labelledby="guide-title-${def.id}">
      <p class="guide-level">Màn ${index + 1} / ${total}</p>
      <h2 id="guide-title-${def.id}">${escape(def.name)}</h2>
      <p class="guide-goal">${escape(def.guide.goal)}</p>
      <ol class="guide-steps">
        ${steps}
        <li><span class="guide-icon">${ringGlyph()}</span><span>Chọn ${n} con giáp trên vòng bên cạnh theo thứ tự số dấu ◆, từ 1 đến ${n}. Trả lời sai thì vòng khoá một lúc; càng sai nhiều càng khoá lâu.</span></li>
      </ol>
      ${def.guide.tip ? `<p class="guide-tip"><strong>Mẹo:</strong> ${escape(def.guide.tip)}</p>` : ''}
      <p class="guide-help">Bí thì tìm đom đóm (đốm sáng tròn nhấp nháy) giấu trong cảnh, rồi bấm “Gợi ý”.</p>
      <button class="guide-start" type="button"></button>
    </section>`;
}
