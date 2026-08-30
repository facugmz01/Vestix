import { useLocation } from 'react-router-dom';
import { ALL_NAV_ITEMS } from './navConfig';

export interface Crumb {
  label: string;
  to:    string;
}

/**
 * Derives breadcrumbs from the current URL by matching against the nav registry.
 * Always starts with "Dashboard".
 */
export function useBreadcrumbs(): Crumb[] {
  const { pathname } = useLocation();

  const crumbs: Crumb[] = [{ label: 'Dashboard', to: '/admin' }];

  if (pathname === '/admin') {
    return crumbs;
  }

  // Find exact or longest prefix match
  const matches = ALL_NAV_ITEMS.filter(
    (item) => item.to !== '/admin' && (pathname === item.to || pathname.startsWith(item.to + '/'))
  );

  if (matches.length > 0) {
    // Sort by path length descending (most specific first)
    matches.sort((a, b) => b.to.length - a.to.length);
    const bestMatch = matches[0];

    // If it's a child route, we can show parent + child
    const parentMatch = ALL_NAV_ITEMS.find(
      (item) => item.to !== '/admin' && item.to !== bestMatch.to && bestMatch.to.startsWith(item.to)
    );

    if (parentMatch) {
      crumbs.push({ label: parentMatch.label, to: parentMatch.to });
    }

    crumbs.push({ label: bestMatch.label, to: bestMatch.to });
  }

  return crumbs;
}
