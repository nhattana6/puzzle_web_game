import { cooldownMs, type AnswerResult } from '../core/answer';
import type { Sound } from '../core/sound';
import { asButton, el } from '../core/svg';
import { tween } from '../core/tween';
import { drawZodiac, ZODIAC, type ZodiacId } from '../core/zodiac';

const SIZE = 400;
const C = SIZE / 2;
const RADIUS = 146;

/**
 * The answer input: the twelve signs around the lantern ring, Tý at the top,
 * clockwise — the same order as the hours of the day and the compass.
 */
export class AnswerRing {
  private readonly root: SVGSVGElement;
  private readonly slots: SVGGElement;
  private chosen: ZodiacId[] = [];
  private locked = false;
  private resting = false;
  private cancelRest: (() => void) | null = null;
  private readonly timer: SVGCircleElement;

  constructor(
    parent: HTMLElement,
    private readonly length: number,
    private readonly submit: (ids: ZodiacId[]) => AnswerResult,
    private readonly sound: Sound,
    /** Wrong answers so far (kept across visits) and where to report a new one. */
    private wrongCount: number,
    private readonly onWrong: (count: number) => void,
  ) {
    this.root = el('svg', { viewBox: `0 0 ${SIZE} ${SIZE}`, class: 'answer-ring', role: 'group', 'aria-label': 'Vòng đèn kéo quân' }, parent);
    el('circle', { cx: C, cy: C, r: 192, class: 'ring-face' }, this.root);
    el('circle', { cx: C, cy: C, r: 104, class: 'ring-inner' }, this.root);
    // After a wrong answer the ring rests while this incense line burns down.
    this.timer = el('circle', {
      cx: C, cy: C, r: 192, class: 'ring-timer', pathLength: 100,
      'stroke-dasharray': 100, 'stroke-dashoffset': 100, transform: `rotate(-90 ${C} ${C})`,
    }, this.root);

    ZODIAC.forEach((z, i) => {
      const angle = (-90 + i * 30) * (Math.PI / 180);
      const x = C + RADIUS * Math.cos(angle);
      const y = C + RADIUS * Math.sin(angle);
      const button = el('g', { class: 'ring-sign', transform: `translate(${x.toFixed(1)} ${y.toFixed(1)})` }, this.root);
      el('title', {}, button).textContent = `${z.branch} · ${z.animal}`;
      el('circle', { r: 31, class: 'ring-sign-bg' }, button);
      drawZodiac(el('g', { transform: 'translate(-22 -25) scale(0.44)' }, button), z.id);
      asButton(button, `${z.branch} (${z.animal})`, () => this.pick(z.id));
    });

    this.slots = el('g', { class: 'ring-slots', 'aria-live': 'polite' }, this.root);
    const undo = el('g', { class: 'ring-undo', transform: `translate(${C} ${C + 62})` }, this.root);
    el('circle', { r: 20, class: 'ring-undo-bg' }, undo);
    el('path', { d: 'M-2 -8 L-9 -1 L-2 6 M-9 -1 H4 a6 6 0 0 1 0 12 H1', class: 'ring-undo-icon' }, undo);
    asButton(undo, 'Xoá lựa chọn cuối', () => this.undo());
    this.renderSlots();
  }

  lock(): void {
    this.locked = true;
    this.root.classList.add('locked');
  }

  destroy(): void {
    this.cancelRest?.();
    this.root.remove();
  }

  private pick(id: ZodiacId): void {
    if (this.locked || this.resting || this.chosen.length >= this.length) return;
    this.chosen.push(id);
    this.sound.note(id);
    this.renderSlots();
    if (this.chosen.length < this.length) return;

    const result = this.submit([...this.chosen]);
    if (result === 'correct') {
      this.lock();
      this.root.classList.add('solved');
    } else if (result === 'wrong') {
      this.sound.wrong();
      this.root.classList.remove('shake');
      void this.root.getBoundingClientRect();
      this.root.classList.add('shake');
      this.wrongCount += 1;
      this.onWrong(this.wrongCount);
      this.rest(cooldownMs(this.wrongCount));
    }
  }

  /** Blocks input for a while after a wrong answer, then clears the slots. */
  private rest(ms: number): void {
    this.resting = true;
    this.root.classList.add('resting');
    this.root.setAttribute('aria-busy', 'true');
    this.cancelRest?.();
    this.cancelRest = tween(ms, (t) => {
      this.timer.setAttribute('stroke-dashoffset', (100 * t).toFixed(2));
      if (t < 1) return;
      this.resting = false;
      this.root.classList.remove('resting');
      this.root.removeAttribute('aria-busy');
      this.chosen = [];
      this.renderSlots();
    }, (t) => t);
  }

  private undo(): void {
    if (this.locked || this.resting || this.chosen.length === 0) return;
    this.chosen.pop();
    this.sound.paper();
    this.renderSlots();
  }

  private renderSlots(): void {
    this.slots.replaceChildren();
    const gap = this.length > 3 ? 46 : 58;
    const r = this.length > 3 ? 20 : 25;
    for (let i = 0; i < this.length; i += 1) {
      const x = C + (i - (this.length - 1) / 2) * gap;
      const slot = el('g', { transform: `translate(${x} ${C - 8})` }, this.slots);
      el('circle', { r, class: this.chosen[i] ? 'slot filled' : 'slot' }, slot);
      const id = this.chosen[i];
      if (id) {
        const s = (r * 1.5) / 100;
        drawZodiac(el('g', { transform: `translate(${-50 * s} ${-56 * s}) scale(${s})` }, slot), id);
      }
    }
  }
}
