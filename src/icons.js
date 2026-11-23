const svg = (paths) =>
  `<svg viewBox="0 0 32 32" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
export const ICONS = {
  wood: svg(
    '<path d="m7 13 13-7 6 11-13 8z"/><ellipse cx="10" cy="19" rx="4" ry="6" transform="rotate(-29 10 19)"/><path d="m18 11 5 9M13 14l3 5"/>',
  ),
  stone: svg(
    '<path d="m4 22 3-13 12-4 9 12-6 9-13 1zM7 9l9 7 12 1M16 16l-3 11M19 5l-3 11"/>',
  ),
  fiber: svg(
    '<path d="M16 28V8M16 21C5 20 5 9 5 9c8 0 11 5 11 12Zm0-5C27 15 27 4 27 4c-8 1-11 5-11 12ZM10 28h12"/>',
  ),
  crystal: svg(
    '<path d="m16 2 11 13-11 15L5 15zM5 15h22M16 2l-5 13 5 15 5-15z"/>',
  ),
  axe: svg(
    '<path d="m8 28 14-22 3 2-14 22z" fill="#a48a60"/><path d="m12 6 8 5 6 2 3-8-9-3z" fill="#a1b5ad"/>',
  ),
  pickaxe: svg(
    '<path d="M8 28 23 6l3 2-14 22z" fill="#a48a60"/><path d="M4 16C8 4 20 0 29 9L18 8z" fill="#a1b5ad"/>',
  ),
  campfire: svg(
    '<path d="M13 23C2 17 16 9 14 2c16 13 13 20 5 22 4-5-2-10-2-10s1 7-4 9Z" fill="#e8b77a"/><path d="m5 26 22 4M5 30l22-4"/>',
  ),
  beacon: svg(
    '<path d="m16 1 6 11-6 10-6-10zM8 30l3-11m13 11-3-11M7 22h18M4 12H1m30 0h-3"/>',
  ),
};
