/**
 * Two languages: Vietnamese and English. Every piece of text sits next to its translation as
 * `tr('tiếng Việt', 'English')`, so the pair is read and changed together. The language is chosen
 * once at start (saved choice, then the portal's or the browser's locale, English otherwise)
 * and again whenever the player switches it on the map. Text at module level must be read
 * lazily (a getter or a function), or it would keep the language of the first load.
 */

export type Lang = 'vi' | 'en';

let current: Lang = 'en';

export const lang = (): Lang => current;

export function setLang(next: Lang): void {
  current = next;
  if (typeof document !== 'undefined') document.documentElement.lang = next;
}

/** Vietnamese for a Vietnamese locale (`vi`, `vi-VN`…); English for every other one. */
export const langFromLocale = (locale: string | undefined): Lang => (/^vi\b/i.test(locale ?? '') ? 'vi' : 'en');

/** The text in the current language. */
export const tr = (vi: string, en: string): string => (current === 'vi' ? vi : en);
