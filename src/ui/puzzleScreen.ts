import { checkAnswer } from '../core/answer';
import { persist, save, sound } from '../core/game';
import { Scene } from '../core/scene';
import { asButton, el } from '../core/svg';
import { drawGlyph } from '../core/glyphs';
import { PUZZLES } from '../puzzles';
import type { MountedPuzzle, PuzzleDef } from '../puzzles/types';
import { Keypad } from './keypad';
import { guideMarkup } from './guide';
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
      <button class="icon-btn mute" type="button"></button>
      <span class="fireflies" title="Đom đóm"><span class="ff-icon">${ICONS.firefly}</span><span class="ff-count"></span></span>
      <button class="hint-btn" type="button">${ICONS.firefly}<span>Gợi ý</span><span class="hint-level"></span></button>
    </header>
    <main class="stage">
      <div class="scene-wrap"></div>
      <aside class="answer-wrap"></aside>
    </main>
    <div class="guide-overlay" hidden>${guideMarkup(def)}</div>
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
  const muteBtn = q<HTMLButtonElement>('.mute');

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

  // --- Hints: up to three per level, each helping with one more unfinished part.
  let level = save.hintLevels[def.id] ?? 0;
  let exhausted = false;
  const drawHints = () => {
    scene.overlay.replaceChildren();
    hintLevel.textContent = level > 0 ? `${level}/${MAX_HINT_LEVEL}` : '';
    hintBtn.disabled = exhausted || level >= MAX_HINT_LEVEL;
    hintBtn.title = exhausted ? 'Không còn phần nào cần gợi ý' : 'Gợi ý một phần, tốn 1 đom đóm';
    hintBtn.setAttribute('aria-label', `Gợi ý (${level}/${MAX_HINT_LEVEL}), tốn 1 đom đóm`);
    if (level < 1) return;
    mounted.revealHints(level);
    for (const target of mounted.hintTargets()) {
      el('circle', { cx: target.x, cy: target.y, r: target.r, class: 'hint-ring' }, scene.overlay);
      const g = el('g', { class: 'hint-verb', transform: `translate(${target.x + target.r * 0.75} ${target.y - target.r * 0.85})` }, scene.overlay);
      el('circle', { r: 26 }, g);
      el('path', { d: VERB_PATHS[target.verb] }, g);
    }
  };
  const raiseHint = (free = false) => {
    if (exhausted || level >= MAX_HINT_LEVEL) return;
    if (!free && save.fireflies <= 0) {
      hintBtn.classList.remove('empty');
      void hintBtn.offsetWidth;
      hintBtn.classList.add('empty');
      sound.wrong();
      return;
    }
    // Only charge when the puzzle actually had something new to point out.
    const shown = mounted.revealHints(level + 1);
    if (shown <= level) {
      exhausted = true;
      drawHints();
      return;
    }
    if (!free) save.fireflies -= 1;
    level = shown;
    save.hintLevels[def.id] = level;
    persist();
    updateCounter();
    sound.knock();
    drawHints();
  };
  hintBtn.addEventListener('click', () => raiseHint());
  // Moving parts (the candle, the puppets) carry their highlight with them.
  // Pieces move and snap after a drop or key press: redraw now and once they have settled.
  let redrawTimer = 0;
  const refreshHints = () => {
    if (level < 1) return;
    drawHints();
    clearTimeout(redrawTimer);
    redrawTimer = window.setTimeout(drawHints, 450);
  };
  scene.root.addEventListener('pointerup', refreshHints);
  scene.root.addEventListener('keyup', refreshHints);
  const freeHintTimer = window.setTimeout(() => {
    if (level === 0 && !save.solved.includes(def.id)) raiseHint(true);
  }, FREE_HINT_AFTER_MS);
  drawHints();

  // --- Sound toggle.
  const drawMute = () => {
    muteBtn.innerHTML = sound.muted ? ICONS.soundOff : ICONS.soundOn;
    muteBtn.setAttribute('aria-label', sound.muted ? 'Bật âm thanh' : 'Tắt âm thanh');
  };
  muteBtn.addEventListener('click', () => {
    sound.muted = !sound.muted;
    save.muted = sound.muted;
    persist();
    drawMute();
  });
  drawMute();

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

  // --- How-to card: opens by itself the first time a level is played, and from "?".
  const guideLayer = q<HTMLDivElement>('.guide-overlay');
  const guideStart = q<HTMLButtonElement>('.guide-start');
  const helpBtn = q<HTMLButtonElement>('.help');
  const closeGuide = () => {
    if (guideLayer.hidden) return;
    guideLayer.hidden = true;
    if (!save.seenGuides.includes(def.id)) {
      save.seenGuides.push(def.id);
      persist();
    }
    helpBtn.focus();
  };
  const openGuide = () => {
    guideStart.textContent = save.seenGuides.includes(def.id) ? 'Tiếp tục' : 'Bắt đầu';
    guideLayer.hidden = false;
    guideStart.focus();
  };
  guideStart.addEventListener('click', closeGuide);
  guideLayer.addEventListener('click', (event) => {
    if (event.target === guideLayer) closeGuide();
  });
  const onKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && !guideLayer.hidden) closeGuide();
  };
  document.addEventListener('keydown', onKey);
  helpBtn.addEventListener('click', openGuide);
  if (!save.seenGuides.includes(def.id)) openGuide();

  return {
    destroy() {
      clearTimeout(redrawTimer);
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
