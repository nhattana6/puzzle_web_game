// Fonts ship with the game (no Google Fonts request): only the Latin and Vietnamese letters of the weights in use.
import '@fontsource/fraunces/latin-600.css';
import '@fontsource/fraunces/vietnamese-600.css';
import '@fontsource/noto-serif/latin-400.css';
import '@fontsource/noto-serif/vietnamese-400.css';
import '@fontsource/noto-serif/latin-400-italic.css';
import '@fontsource/noto-serif/vietnamese-400-italic.css';
import '@fontsource/noto-serif/latin-600.css';
import '@fontsource/noto-serif/vietnamese-600.css';
import './style.css';
import { installGlobalDefs } from './core/defs';
import { installEmbedGuards } from './core/embed';
import { adoptPortalSave, music, save, sound } from './core/game';
import { langFromLocale, setLang } from './core/i18n';
import { PORTAL, platform } from './core/platform';
import { PUZZLES, puzzleById } from './puzzles';
import { chapterOfLevel, levelUnlocked } from './ui/chapters';
import { mountHub } from './ui/hub';
import { mountPuzzleScreen } from './ui/puzzleScreen';

const app = document.getElementById('app') as HTMLElement;
let current: { destroy(): void } | null = null;

/** `#<puzzle-id>` opens a puzzle; no hash shows the lantern hub. Plain tokens only, so links work when embedded. */
const idFromHash = (): string => decodeURIComponent(location.hash.replace(/^#\/?(p\/)?/, ''));

/** The chapter the hub opens on: the one of the level the player has just left. */
let hubChapter = 0;

function show(id: string): void {
  current?.destroy();
  const puzzle = id ? puzzleById(id) : undefined;
  // A level opens only after the one before it (and the previous chapter) is solved.
  if (puzzle && !levelUnlocked(puzzle.id, save.solved)) {
    go('');
    return;
  }
  if (puzzle) {
    hubChapter = chapterOfLevel(puzzle.id);
    const next = PUZZLES[PUZZLES.indexOf(puzzle) + 1];
    current = mountPuzzleScreen(app, puzzle, {
      home: () => go(''),
      next: () => go(next ? next.id : ''),
    });
  } else {
    current = mountHub(app, { play: go }, hubChapter);
  }
  window.scrollTo(0, 0);
}

function go(id: string): void {
  show(id);
  try {
    history.replaceState(null, '', id ? `#${id}` : location.pathname + location.search);
  } catch {
    // Some embedded frames refuse history updates; navigation still works in memory.
  }
}

// Browsers only allow audio after a tap or key press: the first one starts the music.
const startAudio = () => music.update();
window.addEventListener('pointerdown', startAudio);
window.addEventListener('keydown', startAudio);
document.addEventListener('visibilitychange', () => sound.setHidden(document.hidden));

window.addEventListener('hashchange', () => show(idFromHash()));

/** Starts the portal SDK first (it is a no-op elsewhere), then draws the game. */
async function boot(): Promise<void> {
  await platform.init();
  platform.loadingStart();
  adoptPortalSave();
  setLang(save.lang ?? langFromLocale(platform.locale()));
  installGlobalDefs();
  installEmbedGuards();
  platform.loadingStop();
  // On Poki a new player goes straight into the first level: the map would be one more tap before play starts, and Poki
  // judges a game by how many who see it begin to play.
  if (PORTAL === 'poki' && !idFromHash() && save.solved.length === 0) go(PUZZLES[0].id);
  else show(idFromHash());
}
void boot();
