import { describe, expect, it } from 'vitest';
import { defaultSave, loadSave, parseSave, SAVE_KEY, writeSave } from '../src/core/save';

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
    const data = { ...defaultSave(), solved: ['a'], fireflies: 3, foundFireflies: ['f1'], hintLevels: { a: 2 }, muted: true };
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
      version: 1, solved: ['a', 3, null], fireflies: -4, hintLevels: { a: 9, b: 'x', c: 1.7 },
    }));
    expect(parsed.solved).toEqual(['a']);
    expect(parsed.fireflies).toBe(defaultSave().fireflies);
    expect(parsed.hintLevels).toEqual({ a: 3, c: 1 });
  });

  it('survives storage that throws', () => {
    expect(loadSave(throwing)).toEqual(defaultSave());
    expect(() => writeSave(defaultSave(), throwing)).not.toThrow();
    expect(loadSave(null)).toEqual(defaultSave());
  });

  it('uses a versioned key', () => {
    expect(SAVE_KEY).toMatch(/v1$/);
  });
});
