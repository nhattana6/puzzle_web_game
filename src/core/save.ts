export interface SaveData {
  version: 1;
  solved: string[];
  /** Fireflies in hand, spent on hints. Every player starts with the same fixed number; they cannot be found. */
  fireflies: number;
  /** 1 once a puzzle's hint (which solves the whole puzzle) has been bought; 0 or missing otherwise. */
  hintLevels: Record<string, number>;
  /** Wrong answers per unsolved puzzle; drives the answer-ring cooldown, so reloading doesn't reset it. */
  wrongAnswers: Record<string, number>;
  /** Levels whose how-to card has been read, so it no longer opens by itself. */
  seenGuides: string[];
  /** All sound off (effects and music). */
  muted: boolean;
  /** Background music on; only plays while not muted. */
  music: boolean;
}

export const SAVE_KEY = 'star-keeper/save/v1';
export const STARTING_FIREFLIES = 2;

export const defaultSave = (): SaveData => ({
  version: 1,
  solved: [],
  fireflies: STARTING_FIREFLIES,
  hintLevels: {},
  wrongAnswers: {},
  seenGuides: [],
  muted: false,
  music: true,
});

function countMap(value: unknown, max: number): Record<string, number> {
  const out: Record<string, number> = {};
  if (value && typeof value === 'object') {
    for (const [id, n] of Object.entries(value as Record<string, unknown>)) {
      if (typeof n === 'number' && n >= 0) out[id] = Math.min(max, Math.floor(n));
    }
  }
  return out;
}

const stringList = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

/**
 * Saves from when fireflies were collected carry a `foundFireflies` list; they are
 * reset to the fixed allowance minus the hints already bought.
 */
function remainingFireflies(data: Record<string, unknown>): number {
  if ('foundFireflies' in data) {
    const bought = Object.values(countMap(data.hintLevels, 3)).filter((n) => n > 0).length;
    return Math.max(0, STARTING_FIREFLIES - bought);
  }
  return typeof data.fireflies === 'number' && data.fireflies >= 0
    ? Math.floor(data.fireflies)
    : STARTING_FIREFLIES;
}

export function parseSave(raw: string | null): SaveData {
  if (!raw) return defaultSave();
  try {
    const data = JSON.parse(raw) as Record<string, unknown> | null;
    if (!data || data.version !== 1) return defaultSave();
    return {
      version: 1,
      solved: stringList(data.solved),
      fireflies: remainingFireflies(data),
      hintLevels: countMap(data.hintLevels, 3),
      wrongAnswers: countMap(data.wrongAnswers, 99),
      seenGuides: stringList(data.seenGuides),
      muted: data.muted === true,
      // Saves from before the music existed have no flag: music on.
      music: data.music !== false,
    };
  } catch {
    return defaultSave();
  }
}

function browserStorage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/** Progress lives in localStorage only; a private window or blocked storage just starts fresh. */
export function loadSave(storage: Storage | null = browserStorage()): SaveData {
  try {
    return parseSave(storage?.getItem(SAVE_KEY) ?? null);
  } catch {
    return defaultSave();
  }
}

export function writeSave(data: SaveData, storage: Storage | null = browserStorage()): void {
  try {
    storage?.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // Storage full or blocked: the game keeps working for this visit.
  }
}
