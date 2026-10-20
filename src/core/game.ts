import { Music } from './music';
import { platform } from './platform';
import { chooseSave, loadSave, SAVE_KEY, writeSave } from './save';
import { Sound } from './sound';

export const save = loadSave();
export const sound = new Sound();
sound.muted = save.muted;
export const music = new Music(sound);
music.enabled = save.music;

/** Sound follows the player's buttons, but stays off while the portal asks for silence. */
function refreshAudio(): void {
  sound.muted = save.muted || platform.muted;
  music.enabled = save.music;
  music.update();
}
platform.onMuteChange(refreshAudio);

/** Applies the saved sound settings: call after changing `save.muted` or `save.music`. */
export function applyAudio(): void {
  refreshAudio();
  persist();
}

/** Set once the account's progress has been read; before that (or if the SDK came too late) the data module is left alone. */
let portalAdopted = false;

/** Saves in the browser and, on CrazyGames, in the SDK's data module too. */
export function persist(): void {
  writeSave(save);
  const portal = portalAdopted ? platform.storage() : null;
  if (portal) writeSave(save, portal);
}

/**
 * Once the SDK is up: plays on the account's progress from the data module (or the browser's, if that has more), and
 * writes it back to both. Does nothing without a data module.
 */
export function adoptPortalSave(): void {
  const portal = platform.storage();
  if (!portal) return;
  let browserRaw: string | null = null;
  try {
    browserRaw = globalThis.localStorage?.getItem(SAVE_KEY) ?? null;
  } catch {
    // Blocked storage: the portal's copy is all there is.
  }
  Object.assign(save, chooseSave(portal.getItem(SAVE_KEY), browserRaw));
  portalAdopted = true;
  refreshAudio();
  persist();
}
