import { loadSave, writeSave } from './save';
import { Sound } from './sound';

export const save = loadSave();
export const sound = new Sound();
sound.muted = save.muted;

export function persist(): void {
  writeSave(save);
}
