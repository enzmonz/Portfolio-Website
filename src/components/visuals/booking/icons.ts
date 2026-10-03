/**
 * Glyphs for the Mobile Booking recreation.
 *
 * `appIcons` are the Ionicons (v5, MIT) outline icons the real app uses, on a
 * 512 × 512 viewBox. `statusGlyphs` are generic phone status-bar marks.
 */
const STROKE = 'fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"';

const calendarDots = [
  [296, 232],
  [376, 232],
  [136, 312],
  [216, 312],
  [296, 312],
  [376, 312],
  [136, 392],
  [216, 392],
  [296, 392],
]
  .map(([cx, cy]) => `<circle cx="${cx}" cy="${cy}" r="24"/>`)
  .join('');

export const appIcons = {
  arrowBack: `<path ${STROKE} stroke-width="48" d="M244 400 100 256l144-144M120 256h292"/>`,
  arrowForward: `<path ${STROKE} stroke-width="48" d="m268 112 144 144-144 144M392 256H100"/>`,
  checkmark: `<path ${STROKE} stroke-width="32" d="M416 128 192 384l-96-96"/>`,
  home: `<path ${STROKE} stroke-width="32" d="M80 212v236a16 16 0 0 0 16 16h96V328a24 24 0 0 1 24-24h80a24 24 0 0 1 24 24v136h96a16 16 0 0 0 16-16V212"/><path ${STROKE} stroke-width="32" d="M480 256 266.89 52c-5-5.28-16.69-5.34-21.78 0L32 256M400 179V64h-48v69"/>`,
  compass: `<circle ${STROKE} stroke-width="32" cx="256" cy="256" r="192"/><path fill="currentColor" fill-rule="evenodd" d="m350.67 150.93-117.2 46.88a64 64 0 0 0-35.66 35.66l-46.88 117.2a8 8 0 0 0 10.4 10.4l117.2-46.88a64 64 0 0 0 35.66-35.66l46.88-117.2a8 8 0 0 0-10.4-10.4ZM256 280a24 24 0 1 1 24-24 24 24 0 0 1-24 24Z"/>`,
  calendar: `<rect ${STROKE} stroke-width="32" x="48" y="80" width="416" height="384" rx="48"/><path ${STROKE} stroke-width="32" d="M128 48v32M384 48v32M464 160H48"/><g fill="currentColor">${calendarDots}</g>`,
  person: `<path ${STROKE} stroke-width="32" d="M344 144c-3.92 52.87-44 96-88 96s-84.15-43.12-88-96c-4-55 35-96 88-96s92 42 88 96Z"/><path ${STROKE} stroke-width="32" d="M256 304c-87 0-175.3 48-191.64 138.6C62.39 453.52 68.57 464 80 464h352c11.44 0 17.62-10.48 15.65-21.4C431.3 352 343 304 256 304Z"/>`,
} as const;

export type AppIcon = keyof typeof appIcons;

export const statusGlyphs = {
  signal: {
    viewBox: '0 0 17 11',
    body: '<g fill="currentColor"><rect x="0" y="7" width="3" height="4" rx="0.8"/><rect x="4.67" y="4.67" width="3" height="6.33" rx="0.8"/><rect x="9.33" y="2.33" width="3" height="8.67" rx="0.8"/><rect x="14" y="0" width="3" height="11" rx="0.8"/></g>',
  },
  wifi: {
    viewBox: '0 0 16 11.5',
    body: '<g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M1.6 4.4a9 9 0 0 1 12.8 0"/><path d="M4.2 7a5.3 5.3 0 0 1 7.6 0"/></g><circle cx="8" cy="9.8" r="1.5" fill="currentColor"/>',
  },
  battery: {
    viewBox: '0 0 27 12.5',
    body: '<rect x="0.6" y="0.6" width="23" height="11.3" rx="3.4" fill="none" stroke="currentColor" stroke-width="1.1" opacity="0.4"/><rect x="2.2" y="2.2" width="17" height="8.1" rx="2" fill="currentColor"/><path d="M25.3 4.5v3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.45"/>',
  },
} as const;
