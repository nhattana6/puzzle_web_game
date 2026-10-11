/** Inline icons for the HTML chrome. Stroke icons use currentColor. */
const icon = (body: string, viewBox = '0 0 24 24') =>
  `<svg viewBox="${viewBox}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

export const ICONS = {
  lantern: icon('<path d="M12 2v2"/><path d="M8 4h8l1.5 3h-11z"/><rect x="5.5" y="7" width="13" height="11" rx="3"/><path d="M8 18h8l-1.5 2.5h-5z"/><path d="M12 20.5V23"/><path d="M12 7v11"/>'),
  firefly: icon('<circle cx="12" cy="12" r="3.2" fill="currentColor"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"/>'),
  soundOn: icon('<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>'),
  soundOff: icon('<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9.5l5 5M22 9.5l-5 5"/>'),
  next: icon('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  undo: icon('<path d="M9 7L4 12l5 5"/><path d="M4 12h10a6 6 0 0 1 0 12h-1"/>', '0 0 24 26'),
} as const;
