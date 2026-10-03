/**
 * Primary navigation, shown in the navigation core (the glowing circle).
 * Order follows the home page. `page` items link to their own route;
 * section items link to an id on the home page.
 */
export const navItems = [
  { id: 'home', label: 'Home' },
  { id: 'projects', label: 'Projects' },
  { id: 'about', label: 'About' },
  { id: 'experience', label: 'Experience' },
  { id: 'mini-game', label: 'Mini Game', page: '/mini-game' },
  { id: 'contact', label: 'Contact' },
] as const;

export type NavItem = (typeof navItems)[number];
export type SectionId = NavItem['id'];

/** Resolve a nav item's href for the current page. */
export function navHref(item: NavItem, onHome: boolean): string {
  if ('page' in item) return item.page;
  if (item.id === 'home') return onHome ? '#home' : '/';
  return onHome ? `#${item.id}` : `/#${item.id}`;
}
