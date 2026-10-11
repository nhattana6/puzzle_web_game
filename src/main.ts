import './style.css';
import { installGlobalDefs } from './core/defs';
import { PUZZLES, puzzleById } from './puzzles';
import { mountHub } from './ui/hub';
import { mountPuzzleScreen } from './ui/puzzleScreen';

installGlobalDefs();
const app = document.getElementById('app') as HTMLElement;
let current: { destroy(): void } | null = null;

/** Routes: `#/` is the lantern hub, `#/p/<puzzle-id>` opens a puzzle. */
const go = (hash: string) => {
  if (location.hash === hash) route();
  else location.hash = hash;
};

function route(): void {
  current?.destroy();
  const match = /^#\/p\/(.+)$/.exec(location.hash);
  const puzzle = match ? puzzleById(decodeURIComponent(match[1])) : undefined;
  if (puzzle) {
    const next = PUZZLES[PUZZLES.indexOf(puzzle) + 1];
    current = mountPuzzleScreen(app, puzzle, {
      home: () => go('#/'),
      next: () => go(next ? `#/p/${next.id}` : '#/'),
    });
  } else {
    current = mountHub(app, { play: (id) => go(id ? `#/p/${id}` : '#/') });
  }
}

window.addEventListener('hashchange', route);
route();
