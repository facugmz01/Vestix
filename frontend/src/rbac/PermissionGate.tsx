import type { ReactNode } from 'react';
import { usePermissions } from './usePermissions';
import type { Action, Subject, Role } from './permissions';

// ─── Props ────────────────────────────────────────────────────────────────────
interface CanProps {
  action:   Action | string;
  subject:  Subject | string;
  children: ReactNode;
  fallback?: ReactNode;     // What to render when permission is denied
}

interface HasRoleProps {
  role:     Role | string;
  children: ReactNode;
  fallback?: ReactNode;
}

interface CanAnyProps {
  perms:    Array<[Action | string, Subject | string]>;
  children: ReactNode;
  fallback?: ReactNode;
}

// ─── Components ───────────────────────────────────────────────────────────────

/**
 * Render `children` only when the current user has the given permission.
 * Optionally render `fallback` when denied.
 *
 * @example
 * <Can action="create" subject="Sales">
 *   <Button>Nueva venta</Button>
 * </Can>
 */
export function Can({ action, subject, children, fallback = null }: CanProps) {
  const { can } = usePermissions();
  return can(action, subject) ? <>{children}</> : <>{fallback}</>;
}

/**
 * Render `children` only when the user does NOT have the given permission.
 *
 * @example
 * <Cannot action="manage" subject="Settings">
 *   <ReadOnlySettingsView />
 * </Cannot>
 */
export function Cannot({ action, subject, children, fallback = null }: CanProps) {
  const { cannot } = usePermissions();
  return cannot(action, subject) ? <>{children}</> : <>{fallback}</>;
}

/**
 * Render `children` only when the user has a specific role.
 *
 * @example
 * <HasRole role="SUPER_ADMIN">
 *   <DangerZone />
 * </HasRole>
 */
export function HasRole({ role, children, fallback = null }: HasRoleProps) {
  const { isRole } = usePermissions();
  return isRole(role) ? <>{children}</> : <>{fallback}</>;
}

/**
 * Render `children` when the user has ANY of the provided permission tuples.
 *
 * @example
 * <CanAny perms={[['read', 'Reports'], ['manage', 'Sales']]}>
 *   <FinancePanel />
 * </CanAny>
 */
export function CanAny({ perms, children, fallback = null }: CanAnyProps) {
  const { canAny } = usePermissions();
  return canAny(...perms) ? <>{children}</> : <>{fallback}</>;
}
