import { NAV_SEGMENTS, ALL_NAV_ITEMS } from './navConfig';
import type { NavSegment, NavItem } from './navConfig';
import { usePermissions } from '@/rbac/usePermissions';

/**
 * Returns only the nav segments, items, and sub-items the current user is permitted to see.
 * Items with no permitted children and no direct access are pruned.
 * Empty segments are omitted entirely.
 */
export function useNavGroups(): NavSegment[] {
  const { can } = usePermissions();

  return NAV_SEGMENTS
    .map((segment) => {
      const filteredItems = segment.items
        .map((item) => {
          // If the user doesn't have parent permission, check if they can access any child
          const hasParentAccess = can(item.action, item.subject);

          // Filter children
          const filteredChildren = (item.children || []).filter((child) => {
            const action = child.action || item.action;
            const subject = child.subject || item.subject;
            return can(action, subject);
          });

          // If item has children, it's visible if parent has access OR at least 1 child is accessible
          if (item.children && item.children.length > 0) {
            if (!hasParentAccess && filteredChildren.length === 0) {
              return null;
            }
            return {
              ...item,
              children: filteredChildren,
            };
          }

          // Single item without children
          return hasParentAccess ? item : null;
        })
        .filter((item): item is NavItem => item !== null);

      return {
        ...segment,
        items: filteredItems,
      };
    })
    .filter((segment) => segment.items.length > 0);
}

/**
 * Returns a flat list of all visible nav items (used for mobile nav or search lookup).
 */
export function useNavItems(): NavItem[] {
  const { can } = usePermissions();
  return ALL_NAV_ITEMS.filter((item) => can(item.action, item.subject));
}
