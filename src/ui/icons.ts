/** Inline icons for the HTML chrome. Stroke icons use currentColor. */
const icon = (body: string, viewBox = '0 0 24 24') =>
  `<svg viewBox="${viewBox}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

export const ICONS = {
  lantern: icon('<path d="M12 2v2"/><path d="M8 4h8l1.5 3h-11z"/><rect x="5.5" y="7" width="13" height="11" rx="3"/><path d="M8 18h8l-1.5 2.5h-5z"/><path d="M12 20.5V23"/><path d="M12 7v11"/>'),
  firefly: icon('<circle cx="12" cy="12" r="3.2" fill="currentColor"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"/>'),
  soundOn: icon('<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>'),
  soundOff: icon('<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9.5l5 5M22 9.5l-5 5"/>'),
  help: icon('<circle cx="12" cy="12" r="9.5"/><path d="M9.3 9.2a2.8 2.8 0 1 1 3.9 2.6c-.8.4-1.2 1-1.2 1.9v.5"/><circle cx="12" cy="17.2" r=".9" fill="currentColor"/>'),
  next: icon('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  undo: icon('<path d="M9 7L4 12l5 5"/><path d="M4 12h10a6 6 0 0 1 0 12h-1"/>', '0 0 24 26'),
} as const;

/** Action glyphs drawn around (0, 0) in a 40×40 box: hint badges and the how-to card share them. */
export const VERB_PATHS = {
  rotate: 'M-12 4 A13 13 0 1 1 4 12 M4 12 L-2 5 M4 12 L12 9',
  drag: 'M-15 0 H15 M-9 -6 L-15 0 L-9 6 M9 -6 L15 0 L9 6',
  tap: 'M0 -3 m-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 M-12 8 A13 13 0 0 1 -12 -14 M12 8 A13 13 0 0 0 12 -14',
  marks: 'M-9 -10 L-3 0 L-9 10 L-15 0 Z M9 -10 L15 0 L9 10 L3 0 Z',
} as const;
