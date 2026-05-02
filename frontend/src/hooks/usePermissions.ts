import { useAuthStore } from '@/store/auth.store';

/**
 * Declarative RBAC hook — mirrors the backend `{ action, subject }` pattern.
 *
 * Usage:
 *   const { can, isSuperAdmin } = usePermissions();
 *   if (!can('create', 'Sales')) return <Forbidden />;
 */
export function usePermissions() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const isSuperAdmin  = useAuthStore((s) => s.isSuperAdmin);
  const user          = useAuthStore((s) => s.user);

  return {
    can:         (action: string, subject: string) => hasPermission(action, subject),
    isSuperAdmin: isSuperAdmin,
    user,
  };
}
