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

  const match = ALL_NAV_ITEMS.find(
    (item) => item.to !== '/admin' && pathname.startsWith(item.to)
  );

  if (match) crumbs.push({ label: match.label, to: match.to });

  return crumbs;
}
