import { describe, expect, it } from 'vitest';
import { chooseSave, defaultSave, loadSave, parseSave, SAVE_KEY, STARTING_FIREFLIES, writeSave } from '../src/core/save';

class MemoryStorage {
  data = new Map<string, string>();
  getItem(key: string) { return this.data.get(key) ?? null; }
  setItem(key: string, value: string) { this.data.set(key, value); }
}

const throwing = {
  getItem() { throw new Error('blocked'); },
  setItem() { throw new Error('blocked'); },
} as unknown as Storage;

describe('save data', () => {
  it('round-trips through storage', () => {
    const storage = new MemoryStorage() as unknown as Storage;
    const data = { ...defaultSave(), solved: ['a'], fireflies: 1, hintLevels: { a: 2 }, wrongAnswers: { b: 4 }, seenGuides: ['a'], muted: true };
    writeSave(data, storage);
    expect(loadSave(storage)).toEqual(data);
  });

  it('starts fresh on missing, corrupt or foreign data', () => {
    expect(parseSave(null)).toEqual(defaultSave());
    expect(parseSave('{not json')).toEqual(defaultSave());
    expect(parseSave(JSON.stringify({ version: 99 }))).toEqual(defaultSave());
  });

  it('drops malformed fields', () => {
    const parsed = parseSave(JSON.stringify({
      version: 1, solved: ['a', 3, null], fireflies: -4, hintLevels: { a: 150, b: 'x', c: 1.7 },
      wrongAnswers: { a: 2, b: -1 }, seenGuides: ['x', 5],
    }));
    expect(parsed.seenGuides).toEqual(['x']);
    expect(parsed.wrongAnswers).toEqual({ a: 2 });
    expect(parsed.solved).toEqual(['a']);
    expect(parsed.fireflies).toBe(defaultSave().fireflies);
    expect(parsed.hintLevels).toEqual({ a: 3, c: 1 });
  });

  it('survives storage that throws', () => {
    expect(loadSave(throwing)).toEqual(defaultSave());
    expect(() => writeSave(defaultSave(), throwing)).not.toThrow();
    expect(loadSave(null)).toEqual(defaultSave());
  });

  it('keeps music on for saves made before it existed, and remembers turning it off', () => {
    expect(defaultSave().music).toBe(true);
    expect(parseSave(JSON.stringify({ version: 1, muted: true })).music).toBe(true);
    expect(parseSave(JSON.stringify({ version: 1, music: false })).music).toBe(false);
  });

  it('gives every new player the same fixed two fireflies', () => {
    expect(defaultSave().fireflies).toBe(2);
    expect(STARTING_FIREFLIES).toBe(2);
  });

  it('resets saves from the collecting days to two minus hints already bought', () => {
    const old = (hintLevels: Record<string, number>) =>
      parseSave(JSON.stringify({ version: 1, fireflies: 7, foundFireflies: ['x', 'y'], hintLevels })).fireflies;
    expect(old({})).toBe(2);
    expect(old({ a: 1 })).toBe(1);
    expect(old({ a: 1, b: 1, c: 1 })).toBe(0);
  });

  it('uses a versioned key', () => {
    expect(SAVE_KEY).toMatch(/v1$/);
  });

  it('picks the save to play on when the portal and the browser both have one', () => {
    const saveWith = (n: number) => JSON.stringify({ ...defaultSave(), solved: Array.from({ length: n }, (_, i) => `level-${i}`) });
    // Only one of them: that one.
    expect(chooseSave(null, saveWith(3)).solved).toHaveLength(3);
    expect(chooseSave(saveWith(5), null).solved).toHaveLength(5);
    expect(chooseSave(null, null)).toEqual(defaultSave());
    // Both: more levels solved wins (progress from before the data module is not lost), the portal's on a tie.
    expect(chooseSave(saveWith(2), saveWith(7)).solved).toHaveLength(7);
    expect(chooseSave(saveWith(9), saveWith(4)).solved).toHaveLength(9);
    const portal = JSON.stringify({ ...defaultSave(), solved: ['a'], lang: 'vi' });
    const browser = JSON.stringify({ ...defaultSave(), solved: ['b'], lang: 'en' });
    expect(chooseSave(portal, browser).lang).toBe('vi');
    // A portal copy that is empty or damaged counts as no progress.
    expect(chooseSave('', saveWith(3)).solved).toHaveLength(3);
    expect(chooseSave('{oops', saveWith(1)).solved).toHaveLength(1);
  });
});
