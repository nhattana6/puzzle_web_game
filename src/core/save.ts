export interface SaveData {
  version: 1;
  solved: string[];
  /** Fireflies in hand, spent on hints. */
  fireflies: number;
  /** Ids of fireflies already picked up, so each one is found only once. */
  foundFireflies: string[];
  /** Highest hint level revealed per puzzle (0–3). */
  hintLevels: Record<string, number>;
  muted: boolean;
}

export const SAVE_KEY = 'twelve-paper-shadows/save/v1';
export const STARTING_FIREFLIES = 1;

export const defaultSave = (): SaveData => ({
  version: 1,
  solved: [],
  fireflies: STARTING_FIREFLIES,
  foundFireflies: [],
  hintLevels: {},
  muted: false,
});

const stringList = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

export function parseSave(raw: string | null): SaveData {
  if (!raw) return defaultSave();
  try {
    const data = JSON.parse(raw) as Record<string, unknown> | null;
    if (!data || data.version !== 1) return defaultSave();
    const hintLevels: Record<string, number> = {};
    if (data.hintLevels && typeof data.hintLevels === 'object') {
      for (const [id, level] of Object.entries(data.hintLevels as Record<string, unknown>)) {
        if (typeof level === 'number' && level >= 0) hintLevels[id] = Math.min(3, Math.floor(level));
      }
    }
    return {
      version: 1,
      solved: stringList(data.solved),
      fireflies:
        typeof data.fireflies === 'number' && data.fireflies >= 0
          ? Math.floor(data.fireflies)
          : STARTING_FIREFLIES,
      foundFireflies: stringList(data.foundFireflies),
      hintLevels,
      muted: data.muted === true,
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
