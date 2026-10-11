import { checkAnswer } from '../core/answer';
import { persist, save, sound } from '../core/game';
import { Scene } from '../core/scene';
import { asButton, el } from '../core/svg';
import { drawGlyph } from '../core/glyphs';
import { PUZZLES } from '../puzzles';
import type { HintTarget, MountedPuzzle, PuzzleDef } from '../puzzles/types';
import { mountAudioControls } from './audioControls';
import { Keypad } from './keypad';
import { guideMarkup } from './guide';
import { hintPicture } from './hintPicture';
import { ICONS, VERB_PATHS } from './icons';

export const MAX_HINT_LEVEL = 3;
/** If a player has had no hint after this long, the first one turns on for free. */
export const FREE_HINT_AFTER_MS = 3 * 60 * 1000;

interface Nav {
  home(): void;
  next(): void;
}

export function mountPuzzleScreen(app: HTMLElement, def: PuzzleDef, nav: Nav): { destroy(): void } {
  const index = PUZZLES.indexOf(def);
  const hasNext = index >= 0 && index < PUZZLES.length - 1;
  const screen = document.createElement('div');
  screen.className = 'screen puzzle-screen';
  screen.innerHTML = `
    <header class="topbar">
      <button class="icon-btn home" type="button" aria-label="Về màn hình chính" title="Về màn hình chính">${ICONS.lantern}</button>
      <ol class="progress" aria-label="Tiến trình">
        ${PUZZLES.map((p, i) => `<li class="${save.solved.includes(p.id) ? 'done' : ''} ${i === index ? 'current' : ''}"></li>`).join('')}
      </ol>
      <span class="spacer"></span>
      <button class="icon-btn help" type="button" aria-label="Hướng dẫn màn này" title="Hướng dẫn">${ICONS.help}</button>
      <span class="audio-controls"></span>
      <span class="fireflies" title="Đom đóm"><span class="ff-icon">${ICONS.firefly}</span><span class="ff-count"></span></span>
      <button class="hint-btn" type="button">${ICONS.firefly}<span>Gợi ý</span><span class="hint-level"></span></button>
    </header>
    <main class="stage">
      <div class="scene-wrap"></div>
      <aside class="answer-wrap"></aside>
    </main>
    <div class="guide-overlay" hidden>${guideMarkup()}</div>
    <div class="hint-overlay" hidden>
      <section class="hint-card" role="dialog" aria-modal="true" aria-labelledby="hint-title-${def.id}">
        <h2 class="hint-title" id="hint-title-${def.id}"></h2>
        <div class="hint-picture-wrap"></div>
        <ol class="hint-notes"></ol>
        <p class="hint-status"></p>
        <div class="hint-actions">
          <button class="hint-more" type="button"></button>
          <button class="hint-close" type="button">Đã hiểu</button>
        </div>
      </section>
    </div>
    <div class="solved-overlay" hidden>
      <div class="solved-card" role="dialog" aria-label="Đã giải">
        <div class="solved-animals"></div>
        <p class="solved-name"></p>
        <div class="solved-actions"></div>
      </div>
    </div>`;
  app.appendChild(screen);

  const q = <T extends Element>(selector: string) => screen.querySelector(selector) as T;
  const ffCount = q<HTMLSpanElement>('.ff-count');
  const hintBtn = q<HTMLButtonElement>('.hint-btn');
  const hintLevel = q<HTMLSpanElement>('.hint-level');

  const scene = new Scene(q<HTMLDivElement>('.scene-wrap'), def.name);
  let solvedTimer = 0;
  let finished = false;
  /** Records the win, marks progress and shows the solved card after `delay` ms. */
  const finish = (delay: number) => {
    if (finished) return;
    finished = true;
    if (!save.solved.includes(def.id)) save.solved.push(def.id);
    delete save.wrongAnswers[def.id];
    persist();
    screen.querySelectorAll('.progress li')[index]?.classList.add('done');
    solvedTimer = window.setTimeout(showSolved, delay);
  };
  const mounted: MountedPuzzle = def.mount({ scene, sound });
  const alreadySolved = save.solved.includes(def.id);

  // --- Fireflies: found by looking around, spent on hints.
  const updateCounter = () => {
    ffCount.textContent = String(save.fireflies);
  };
  for (const spot of def.fireflies) {
    if (save.foundFireflies.includes(spot.id)) continue;
    const g = el('g', { class: 'firefly', transform: `translate(${spot.x} ${spot.y})` }, scene.layers[spot.layer]);
    el('circle', { r: 30, fill: 'transparent' }, g);
    el('circle', { r: 7, class: 'firefly-dot' }, g);
    asButton(g, 'Đom đóm', () => {
      if (g.classList.contains('caught')) return;
      g.classList.add('caught');
      save.fireflies += 1;
      save.foundFireflies.push(spot.id);
      persist();
      updateCounter();
      sound.chime();
      setTimeout(() => g.remove(), 700);
    });
  }
  updateCounter();

  // --- Hints: bought one at a time with fireflies (at most three, each helping with
  // one unfinished part) and shown on a card: a picture of the scene marked up with
  // what to do. The scene itself is left clean.
  let level = save.hintLevels[def.id] ?? 0;
  let exhausted = false;
  const hintLayer = q<HTMLDivElement>('.hint-overlay');
  const hintClose = q<HTMLButtonElement>('.hint-close');
  const hintMore = q<HTMLButtonElement>('.hint-more');
  const updateHintButton = () => {
    hintLevel.textContent = level > 0 ? `${level}/${MAX_HINT_LEVEL}` : '';
    const text = level > 0 ? `Xem gợi ý (${level}/${MAX_HINT_LEVEL})` : 'Gợi ý, tốn 1 đom đóm';
    hintBtn.title = text;
    hintBtn.setAttribute('aria-label', text);
  };
  const canBuy = () => !exhausted && level < MAX_HINT_LEVEL;
  /** Buys the next hint. Only charges when the puzzle had something new to point out. */
  const buyHint = (free = false): boolean => {
    if (!canBuy() || (!free && save.fireflies <= 0)) return false;
    const shown = mounted.revealHints(level + 1);
    if (shown <= level) {
      exhausted = true;
      return false;
    }
    if (!free) save.fireflies -= 1;
    level = shown;
    save.hintLevels[def.id] = level;
    persist();
    updateCounter();
    sound.knock();
    updateHintButton();
    return true;
  };
  const renderHintCard = () => {
    const targets = level > 0 ? mounted.hintTargets() : [];
    q<HTMLHeadingElement>('.hint-title').textContent = `Gợi ý ${level}/${MAX_HINT_LEVEL}`;
    q<HTMLDivElement>('.hint-picture-wrap').replaceChildren(hintPicture(scene.root, targets));
    const seenNotes = new Set<string>();
    const notes = targets.filter((t) => {
      const key = t.note ?? defaultNote(t);
      if (seenNotes.has(key)) return false;
      seenNotes.add(key);
      return true;
    }).map((t) => `<li><span class="guide-icon"><svg viewBox="-20 -20 40 40" aria-hidden="true"><path d="${VERB_PATHS[t.verb]}"/></svg></span><span>${escapeText(t.note ?? defaultNote(t))}</span></li>`);
    if (!notes.length) notes.push(`<li class="plain">${canBuy() ? 'Phần đã được gợi ý xong rồi. Bấm “Gợi ý tiếp” để xem phần khác.' : 'Các phần đã được gợi ý đều xong rồi.'}</li>`);
    q<HTMLOListElement>('.hint-notes').innerHTML = notes.join('');
    const status = q<HTMLParagraphElement>('.hint-status');
    hintMore.hidden = !canBuy();
    hintMore.disabled = save.fireflies <= 0;
    hintMore.textContent = 'Gợi ý tiếp (−1 đom đóm)';
    status.textContent = !canBuy()
      ? exhausted ? 'Không còn phần nào cần gợi ý.' : `Đã dùng hết ${MAX_HINT_LEVEL} gợi ý của màn này.`
      : save.fireflies <= 0 ? 'Hết đom đóm: tìm đốm sáng nhấp nháy trong cảnh để có thêm.' : `Còn ${save.fireflies} đom đóm.`;
  };
  const openHintCard = () => {
    hintBtn.classList.remove('fresh');
    renderHintCard();
    hintLayer.hidden = false;
    hintClose.focus();
  };
  const closeHintCard = () => {
    if (hintLayer.hidden) return;
    hintLayer.hidden = true;
    q<HTMLDivElement>('.hint-picture-wrap').replaceChildren();
    hintBtn.focus();
  };
  hintBtn.addEventListener('click', () => {
    if (level === 0 && save.fireflies <= 0) {
      hintBtn.classList.remove('empty');
      void hintBtn.offsetWidth;
      hintBtn.classList.add('empty');
      sound.wrong();
      return;
    }
    if (level === 0) buyHint();
    openHintCard();
  });
  hintMore.addEventListener('click', () => {
    buyHint();
    renderHintCard();
  });
  hintClose.addEventListener('click', closeHintCard);
  hintLayer.addEventListener('click', (event) => {
    if (event.target === hintLayer) closeHintCard();
  });
  // Safety net: no hint after a while turns the first one on for free.
  const freeHintTimer = window.setTimeout(() => {
    if (level === 0 && !save.solved.includes(def.id) && buyHint(true)) hintBtn.classList.add('fresh');
  }, FREE_HINT_AFTER_MS);
  if (level > 0) mounted.revealHints(level);
  updateHintButton();

  mountAudioControls(q<HTMLSpanElement>('.audio-controls'));

  // --- Solved card, and the answer ring for code levels.
  const solvedLayer = q<HTMLDivElement>('.solved-overlay');
  function showSolved() {
    const animals = q<HTMLDivElement>('.solved-animals');
    const svg = el('svg', { viewBox: `0 0 ${def.answer.length * 120} 120`, 'aria-hidden': 'true' }, animals);
    def.answer.forEach((id, i) => drawGlyph(el('g', { transform: `translate(${i * 120 + 10} 10)` }, svg), id, { star: 7, line: 3.5 }));
    q<HTMLParagraphElement>('.solved-name').textContent = def.name;
    const actions = q<HTMLDivElement>('.solved-actions');
    actions.innerHTML = `
      <button class="icon-btn" type="button" data-act="home" aria-label="Về màn hình chính">${ICONS.lantern}</button>
      ${hasNext ? `<button class="icon-btn primary" type="button" data-act="next" aria-label="Màn tiếp theo">${ICONS.next}</button>` : ''}`;
    actions.querySelector('[data-act="home"]')?.addEventListener('click', nav.home);
    actions.querySelector('[data-act="next"]')?.addEventListener('click', nav.next);
    solvedLayer.hidden = false;
    (actions.querySelector<HTMLButtonElement>('.primary') ?? actions.querySelector<HTMLButtonElement>('button'))?.focus();
  }

  const keypad = new Keypad(q<HTMLElement>('.answer-wrap'), def.answer.length, (ids) => {
    const result = checkAnswer(def.answer, ids);
    if (result === 'correct') {
      sound.melody(def.answer);
      finish(900 + def.answer.length * 300);
    }
    return result;
  }, sound, save.wrongAnswers[def.id] ?? 0, (count) => {
    save.wrongAnswers[def.id] = count;
    persist();
  });

  if (alreadySolved) screen.classList.add('replay');

  q<HTMLButtonElement>('.home').addEventListener('click', nav.home);

  // --- Help card: only from "?"; levels are left to be figured out.
  const guideLayer = q<HTMLDivElement>('.guide-overlay');
  const guideStart = q<HTMLButtonElement>('.guide-start');
  const helpBtn = q<HTMLButtonElement>('.help');
  const closeGuide = () => {
    if (guideLayer.hidden) return;
    guideLayer.hidden = true;
    helpBtn.focus();
  };
  const openGuide = () => {
    guideLayer.hidden = false;
    guideStart.focus();
  };
  guideStart.addEventListener('click', closeGuide);
  guideLayer.addEventListener('click', (event) => {
    if (event.target === guideLayer) closeGuide();
  });
  const onKey = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return;
    if (!guideLayer.hidden) closeGuide();
    else closeHintCard();
  };
  document.addEventListener('keydown', onKey);
  helpBtn.addEventListener('click', openGuide);

  return {
    destroy() {
      document.removeEventListener('keydown', onKey);
      clearTimeout(freeHintTimer);
      clearTimeout(solvedTimer);
      keypad.destroy();
      mounted.destroy();
      scene.destroy();
      screen.remove();
    },
  };
}

const escapeText = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function defaultNote(t: HintTarget): string {
  switch (t.verb) {
    case 'drag': return t.to ? 'Kéo vật khoanh đỏ theo mũi tên.' : 'Kéo vật khoanh đỏ sang chỗ khác.';
    case 'tap': return 'Bấm vào chỗ khoanh đỏ.';
    case 'rotate': return 'Bấm để xoay vật khoanh đỏ.';
    default: return 'Nhìn kỹ chỗ khoanh đỏ.';
  }
}
