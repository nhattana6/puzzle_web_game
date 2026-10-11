import './style.css';
import { installGlobalDefs } from './core/defs';
import { PUZZLES, puzzleById } from './puzzles';
import { mountHub } from './ui/hub';
import { mountPuzzleScreen } from './ui/puzzleScreen';

installGlobalDefs();
const app = document.getElementById('app') as HTMLElement;
let current: { destroy(): void } | null = null;

/** `#<puzzle-id>` opens a puzzle; no hash shows the lantern hub. Plain tokens only, so links work when embedded. */
const idFromHash = (): string => decodeURIComponent(location.hash.replace(/^#\/?(p\/)?/, ''));

function show(id: string): void {
  current?.destroy();
  const puzzle = id ? puzzleById(id) : undefined;
  if (puzzle) {
    const next = PUZZLES[PUZZLES.indexOf(puzzle) + 1];
    current = mountPuzzleScreen(app, puzzle, {
      home: () => go(''),
      next: () => go(next ? next.id : ''),
    });
  } else {
    current = mountHub(app, { play: go });
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

window.addEventListener('hashchange', () => show(idFromHash()));
show(idFromHash());
