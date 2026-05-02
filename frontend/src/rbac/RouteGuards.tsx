import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore }  from '@/store/auth.store';
import { usePermissions } from '@/rbac/usePermissions';
import { PageSpinner }   from '@/components/ui/Spinner';
import type { Action, Subject } from './permissions';

// ─── Auth guard ───────────────────────────────────────────────────────────────
/**
 * Protects any route tree that requires an authenticated session.
 * Stores the attempted URL so RequireGuest can redirect back after login.
 */
export function RequireAuth() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoadingUser   = useAuthStore((s) => s.isLoadingUser);
  const location        = useLocation();

  if (isLoadingUser) return <PageSpinner />;

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  return <Outlet />;
}

// ─── Guest guard ──────────────────────────────────────────────────────────────
/**
 * Blocks authenticated users from visiting auth pages.
 * Redirects them to their originally intended URL (or /admin).
 */
export function RequireGuest() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoadingUser   = useAuthStore((s) => s.isLoadingUser);
  const location        = useLocation();

  if (isLoadingUser) return <PageSpinner />;

  if (isAuthenticated) {
    const from = (location.state as { from?: string })?.from ?? '/admin';
    return <Navigate to={from} replace />;
  }

  return <Outlet />;
}

// ─── Permission guard (route-level) ──────────────────────────────────────────
/**
 * Inline RBAC guard for nested routes. Redirects to /forbidden on denial.
 *
 * @example
 * <Route element={<RequirePermission action="manage" subject="Settings" />}>
 *   <Route path="settings" element={<SettingsPage />} />
 * </Route>
 */
export function RequirePermission({
  action,
  subject,
}: {
  action:  Action | string;
  subject: Subject | string;
}) {
  const { can } = usePermissions();
  return can(action, subject)
    ? <Outlet />
    : <Navigate to="/forbidden" replace />;
}

// ─── Role guard ───────────────────────────────────────────────────────────────
/**
 * Restricts a route subtree to a specific role.
 *
 * @example
 * <Route element={<RequireRole role="SUPER_ADMIN" />}>
 *   <Route path="danger-zone" element={<DangerZone />} />
 * </Route>
 */
export function RequireRole({ role }: { role: string }) {
  const { isRole } = usePermissions();
  return isRole(role)
    ? <Outlet />
    : <Navigate to="/forbidden" replace />;
}
