import { NAV_GROUPS, ALL_NAV_ITEMS } from './navConfig';
import type { NavGroup, NavItem } from './navConfig';
import { usePermissions } from '@/rbac/usePermissions';

/**
 * Returns only the nav groups and items the current user is permitted to see.
 * Groups with zero visible items are omitted entirely.
 */
export function useNavGroups(): NavGroup[] {
  const { can } = usePermissions();
  return NAV_GROUPS
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => can(item.action, item.subject)),
    }))
    .filter((group) => group.items.length > 0);
}

/**
 * Returns a flat list of visible nav items (used for mobile nav or breadcrumbs).
 */
export function useNavItems(): NavItem[] {
  const { can } = usePermissions();
  return ALL_NAV_ITEMS.filter((item) => can(item.action, item.subject));
}
