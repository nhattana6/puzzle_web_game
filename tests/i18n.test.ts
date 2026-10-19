import { afterEach, describe, expect, it } from 'vitest';
import { lang, langFromLocale, setLang, tr } from '../src/core/i18n';
import { parseSave } from '../src/core/save';

describe('languages', () => {
  afterEach(() => setLang('en'));

  it('picks Vietnamese only for a Vietnamese locale, English otherwise', () => {
    expect(langFromLocale('vi')).toBe('vi');
    expect(langFromLocale('vi-VN')).toBe('vi');
    expect(langFromLocale('VI-vn')).toBe('vi');
    expect(langFromLocale('en-US')).toBe('en');
    expect(langFromLocale('fr')).toBe('en');
    expect(langFromLocale('')).toBe('en');
    expect(langFromLocale(undefined)).toBe('en');
  });

  it('returns the text of the current language', () => {
    setLang('vi');
    expect(lang()).toBe('vi');
    expect(tr('Mây đêm', 'Night clouds')).toBe('Mây đêm');
    setLang('en');
    expect(tr('Mây đêm', 'Night clouds')).toBe('Night clouds');
  });

  it('keeps the chosen language in the save, and drops anything else', () => {
    expect(parseSave(JSON.stringify({ version: 1, lang: 'vi' })).lang).toBe('vi');
    expect(parseSave(JSON.stringify({ version: 1, lang: 'en' })).lang).toBe('en');
    expect(parseSave(JSON.stringify({ version: 1, lang: 'fr' })).lang).toBeNull();
    expect(parseSave(JSON.stringify({ version: 1 })).lang).toBeNull();
  });
});

describe('every level speaks both languages', () => {
  const VI = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
  afterEach(() => setLang('en'));

  it('has English names and help, and keeps the Vietnamese ones', async () => {
    const { PUZZLES } = await import('../src/puzzles');
    const { GLYPHS } = await import('../src/core/glyphs');
    const { CHAPTERS } = await import('../src/ui/chapters');
    const texts = () => [
      ...PUZZLES.flatMap((p) => [p.name, ...(p.help ?? [])]),
      ...GLYPHS.map((g) => g.name),
      ...CHAPTERS.flatMap((c) => [c.title, c.blurb]),
    ];
    setLang('en');
    const english = texts();
    expect(english.filter((t) => VI.test(t))).toEqual([]);
    setLang('vi');
    const vietnamese = texts();
    expect(vietnamese.filter((t, i) => t === english[i])).toEqual([]);
    expect(new Set(PUZZLES.map((p) => p.name)).size).toBe(PUZZLES.length);
  });
});
