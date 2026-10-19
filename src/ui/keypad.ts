import { cooldownMs, type AnswerResult } from '../core/answer';
import { drawGlyph, GLYPHS, type GlyphId } from '../core/glyphs';
import type { Sound } from '../core/sound';
import { asButton, el } from '../core/svg';
import { tween } from '../core/tween';
import { tr } from '../core/i18n';

const W = 360;
const KEY = 104;
const GAP = 14;
const TOP = 110;
const H = TOP + 3 * KEY + 2 * GAP + 70;

/**
 * The star keypad: nine constellations in a 3×3 grid. Pick the constellations a
 * scene reveals, in reading order; the code is checked once every slot is filled.
 */
export class Keypad {
  private readonly root: SVGSVGElement;
  private readonly slots: SVGGElement;
  private readonly timer: SVGRectElement;
  private chosen: GlyphId[] = [];
  private locked = false;
  private resting = false;
  private cancelRest: (() => void) | null = null;

  constructor(
    parent: HTMLElement,
    private readonly length: number,
    private readonly submit: (ids: GlyphId[]) => AnswerResult,
    private readonly sound: Sound,
    /** Wrong answers so far (kept across visits) and where to report a new one. */
    private wrongCount: number,
    private readonly onWrong: (count: number) => void,
  ) {
    this.root = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'keypad', role: 'group', 'aria-label': tr('Bàn phím chòm sao', 'Constellation keypad') }, parent);
    el('rect', { x: 2, y: 2, width: W - 4, height: H - 4, rx: 22, class: 'keypad-face' }, this.root);
    el('rect', { x: 24, y: 22, width: W - 48, height: 70, rx: 14, class: 'keypad-screen' }, this.root);
    this.timer = el('rect', { x: 24, y: 96, width: 0, height: 4, rx: 2, class: 'keypad-timer' }, this.root);
    this.slots = el('g', { 'aria-live': 'polite' }, this.root);

    const x0 = (W - (3 * KEY + 2 * GAP)) / 2;
    GLYPHS.forEach((g, i) => {
      const x = x0 + (i % 3) * (KEY + GAP);
      const y = TOP + Math.floor(i / 3) * (KEY + GAP);
      const key = el('g', { class: 'key', transform: `translate(${x} ${y})` }, this.root);
      el('title', {}, key).textContent = g.name;
      el('rect', { width: KEY, height: KEY, rx: 16, class: 'key-bg' }, key);
      drawGlyph(el('g', { transform: `translate(${KEY * 0.16} ${KEY * 0.16}) scale(${(KEY * 0.68) / 100})`, class: 'key-glyph' }, key), g.id, { star: 7, line: 4 });
      asButton(key, g.name, () => this.pick(g.id));
    });

    const undo = el('g', { class: 'key-undo', transform: `translate(${W / 2} ${H - 34})` }, this.root);
    el('rect', { x: -60, y: -20, width: 120, height: 40, rx: 20, class: 'key-undo-bg' }, undo);
    el('path', { d: 'M-8 -8 L-16 0 L-8 8 M-16 0 H10', class: 'key-undo-icon' }, undo);
    asButton(undo, tr('Xoá chòm sao cuối', 'Remove the last constellation'), () => this.undo());
    this.renderSlots();
  }

  destroy(): void {
    this.cancelRest?.();
    this.root.remove();
  }

  private pick(id: GlyphId): void {
    if (this.locked || this.resting || this.chosen.length >= this.length) return;
    this.chosen.push(id);
    this.sound.note(id);
    this.renderSlots();
    if (this.chosen.length < this.length) return;

    const result = this.submit([...this.chosen]);
    if (result === 'correct') {
      this.locked = true;
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

  /** Blocks input for a while after a wrong answer, then clears the code. */
  private rest(ms: number): void {
    this.resting = true;
    this.root.classList.add('resting');
    this.cancelRest?.();
    this.cancelRest = tween(ms, (t) => {
      this.timer.setAttribute('width', ((W - 48) * (1 - t)).toFixed(1));
      if (t < 1) return;
      this.resting = false;
      this.root.classList.remove('resting');
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
    const size = Math.min(54, (W - 80) / this.length - 8);
    const gap = size + 10;
    for (let i = 0; i < this.length; i += 1) {
      const x = W / 2 + (i - (this.length - 1) / 2) * gap;
      const slot = el('g', { transform: `translate(${x} 57)` }, this.slots);
      el('rect', { x: -size / 2, y: -size / 2, width: size, height: size, rx: 10, class: this.chosen[i] ? 'slot filled' : 'slot' }, slot);
      const id = this.chosen[i];
      if (id) drawGlyph(el('g', { transform: `translate(${-size * 0.38} ${-size * 0.38}) scale(${(size * 0.76) / 100})` }, slot), id, { star: 8, line: 5 });
    }
  }
}
