import { checkAnswer } from '../core/answer';
import { persist, save, sound } from '../core/game';
import { Scene } from '../core/scene';
import { Sound } from '../core/sound';
import { asButton, el } from '../core/svg';
import { drawGlyph } from '../core/glyphs';
import { PUZZLES } from '../puzzles';
import type { HintStep, MountedPuzzle, PuzzleDef } from '../puzzles/types';
import { mountAudioControls } from './audioControls';
import { Keypad } from './keypad';
import { guideMarkup } from './guide';
import { animateHintPicture, HINT_LOOP_MS, hintPicture } from './hintPicture';
import { ICONS, VERB_PATHS } from './icons';

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
        <h2 class="hint-title" id="hint-title-${def.id}">Gợi ý</h2>
        <div class="hint-stage" aria-live="polite"></div>
        <div class="hint-nav">
          <button class="hint-prev" type="button" aria-label="Bước trước">‹</button>
          <span class="hint-dots" role="tablist" aria-label="Các bước"></span>
          <button class="hint-next" type="button" aria-label="Bước sau">›</button>
        </div>
        <p class="hint-pos"></p>
        <div class="hint-actions"><button class="hint-close" type="button">Đã hiểu</button></div>
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

  // --- Hint: one firefly buys one hint for the whole level. It is a card with the solution
  // as a series of pictures (one step each, ending with the answer) you page through; the
  // scene itself is never marked up. Opening it again later is free.
  let bought = (save.hintLevels[def.id] ?? 0) > 0;
  const hintLayer = q<HTMLDivElement>('.hint-overlay');
  const hintClose = q<HTMLButtonElement>('.hint-close');
  const hintPrev = q<HTMLButtonElement>('.hint-prev');
  const hintNext = q<HTMLButtonElement>('.hint-next');
  const hintStage = q<HTMLDivElement>('.hint-stage');
  const hintDots = q<HTMLSpanElement>('.hint-dots');
  const hintPos = q<HTMLParagraphElement>('.hint-pos');
  let figures: HTMLElement[] = [];
  let at = 0;
  const updateHintButton = () => {
    hintLevel.textContent = bought ? '✓' : '';
    const text = bought ? 'Xem lại gợi ý' : 'Gợi ý: giải cả màn, tốn 1 đom đóm';
    hintBtn.title = text;
    hintBtn.setAttribute('aria-label', text);
  };
  const buyHint = (free = false): boolean => {
    if (bought || (!free && save.fireflies <= 0)) return false;
    if (!free) save.fireflies -= 1;
    bought = true;
    save.hintLevels[def.id] = 1;
    persist();
    updateCounter();
    sound.knock();
    updateHintButton();
    return true;
  };
  const showStep = (i: number) => {
    at = Math.max(0, Math.min(figures.length - 1, i));
    playStart = performance.now();
    figures.forEach((f, k) => { f.hidden = k !== at; });
    hintPrev.disabled = at === 0;
    hintNext.disabled = at === figures.length - 1;
    hintDots.querySelectorAll('button').forEach((d, k) => { d.classList.toggle('on', k === at); d.setAttribute('aria-selected', String(k === at)); });
    hintPos.textContent = `Bước ${at + 1} / ${figures.length}`;
  };
  /**
   * The solution, pictured on a fresh hidden copy of the level: whatever the player has
   * done so far, the hint walks through the whole level from the start. Each picture is
   * taken before its step is carried out on the copy.
   */
  const solutionPictures = (): HTMLElement[] => {
    const host = document.createElement('div');
    host.className = 'hint-sandbox';
    host.setAttribute('aria-hidden', 'true');
    document.body.appendChild(host);
    const quiet = new Sound();
    quiet.muted = true;
    const sandbox = new Scene(host, def.name);
    const copy = def.mount({ scene: sandbox, sound: quiet });
    copy.revealHints(99);
    const out = copy.hintSteps().map((step: HintStep) => {
      const figure = document.createElement('figure');
      figure.className = 'hint-step';
      figure.appendChild(hintPicture(sandbox.root, step));
      const verb = step.targets.find((t) => t.r > 0)?.verb ?? step.targets[0]?.verb ?? 'look';
      const caption = document.createElement('figcaption');
      caption.innerHTML = `<span class="step-no"><svg viewBox="-20 -20 40 40" aria-hidden="true"><path d="${VERB_PATHS[verb]}"/></svg></span><span>${escapeText(step.note)}</span>`;
      figure.appendChild(caption);
      step.apply?.();
      return figure;
    });
    copy.destroy();
    sandbox.destroy();
    host.remove();
    return out;
  };
  const buildHintCard = () => {
    hintStage.replaceChildren();
    hintDots.replaceChildren();
    figures = solutionPictures();
    // The last card is the answer to type in.
    const answer = document.createElement('figure');
    answer.className = 'hint-step hint-answer';
    const row = document.createElement('div');
    row.className = 'answer-row';
    const asvg = el('svg', { viewBox: `0 0 ${def.answer.length * 130} 132`, 'aria-hidden': 'true' }, row);
    def.answer.forEach((id, i) => {
      const g = el('g', { transform: `translate(${i * 130 + 10} 5)`, style: 'color: var(--star)' }, asvg);
      drawGlyph(g, id, { star: 6, line: 3 });
      const n = el('text', { x: 50, y: 126, class: 'answer-no' }, g);
      n.textContent = String(i + 1);
    });
    const names = document.createElement('figcaption');
    names.innerHTML = `<span class="step-no"><svg viewBox="-20 -20 40 40" aria-hidden="true"><path d="${VERB_PATHS.keypad}"/></svg></span><span>Đáp án: bấm lần lượt các chòm sao này trên bàn phím.</span>`;
    answer.append(row, names);
    figures.push(answer);
    figures.forEach((f, k) => {
      hintStage.appendChild(f);
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Bước ${k + 1}`);
      dot.addEventListener('click', () => showStep(k));
      hintDots.appendChild(dot);
    });
    showStep(0);
  };
  // Plays the shown step's demonstration, frame by frame, while the card is open.
  let playFrame = 0;
  let playStart = 0;
  const play = (now: number) => {
    const picture = figures[at]?.querySelector<SVGSVGElement>('svg.hint-picture');
    if (picture) animateHintPicture(picture, ((now - playStart) % HINT_LOOP_MS) / HINT_LOOP_MS);
    playFrame = requestAnimationFrame(play);
  };
  const openHintCard = () => {
    hintBtn.classList.remove('fresh');
    buildHintCard();
    hintLayer.hidden = false;
    hintNext.focus();
    cancelAnimationFrame(playFrame);
    playStart = performance.now();
    playFrame = requestAnimationFrame(play);
  };
  const closeHintCard = () => {
    if (hintLayer.hidden) return;
    cancelAnimationFrame(playFrame);
    hintLayer.hidden = true;
    hintStage.replaceChildren();
    hintBtn.focus();
  };
  hintBtn.addEventListener('click', () => {
    if (!bought && save.fireflies <= 0) {
      hintBtn.classList.remove('empty');
      void hintBtn.offsetWidth;
      hintBtn.classList.add('empty');
      sound.wrong();
      return;
    }
    buyHint();
    openHintCard();
  });
  hintPrev.addEventListener('click', () => showStep(at - 1));
  hintNext.addEventListener('click', () => showStep(at + 1));
  hintClose.addEventListener('click', closeHintCard);
  hintLayer.addEventListener('click', (event) => {
    if (event.target === hintLayer) closeHintCard();
  });
  // Safety net: no hint after a while makes it free; the button pulses instead of opening anything.
  const freeHintTimer = window.setTimeout(() => {
    if (!bought && !save.solved.includes(def.id) && buyHint(true)) hintBtn.classList.add('fresh');
  }, FREE_HINT_AFTER_MS);
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
    if (!hintLayer.hidden && event.key === 'ArrowRight') showStep(at + 1);
    else if (!hintLayer.hidden && event.key === 'ArrowLeft') showStep(at - 1);
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
      cancelAnimationFrame(playFrame);
      clearTimeout(solvedTimer);
      keypad.destroy();
      mounted.destroy();
      scene.destroy();
      screen.remove();
    },
  };
}

const escapeText = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
