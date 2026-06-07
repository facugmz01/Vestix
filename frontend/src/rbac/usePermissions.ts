import { useAuthStore } from '@/store/auth.store';
import type { Action, Subject, Role } from './permissions';

/**
 * Central RBAC hook.
 * All permission checks in the UI go through here — never access the store directly.
 *
 * Usage:
 *   const { can, cannot, isRole, user } = usePermissions();
 *   can('create', 'Sales')            → boolean
 *   cannot('manage', 'Settings')      → boolean
 *   isRole('CASHIER')                 → boolean
 */
export function usePermissions() {
  const user          = useAuthStore((s) => s.user);
  const hasPermission = useAuthStore((s) => s.hasPermission);

  const can = (action: Action | string, subject: Subject | string): boolean => {
    if (!user) return false;
    return hasPermission(action, subject);
  };

  const cannot = (action: Action | string, subject: Subject | string): boolean =>
    !can(action, subject);

  const isRole = (role: Role | string): boolean =>
    user?.role === role;

  const isSuperAdmin = (): boolean =>
    user?.role === 'SUPER_ADMIN';

  /** Returns true if the user holds ANY of the provided permissions. */
  const canAny = (...perms: Array<[Action | string, Subject | string]>): boolean =>
    perms.some(([action, subject]) => can(action, subject));

  /** Returns true only if the user holds ALL of the provided permissions. */
  const canAll = (...perms: Array<[Action | string, Subject | string]>): boolean =>
    perms.every(([action, subject]) => can(action, subject));

  return { can, cannot, isRole, isSuperAdmin, canAny, canAll, user };
}
