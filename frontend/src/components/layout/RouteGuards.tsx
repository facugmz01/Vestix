import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { PageSpinner } from '@/components/ui/Spinner';
import { usePermissions } from '@/hooks/usePermissions';

// ─── Auth guard ───────────────────────────────────────────────────────────────
/**
 * Wraps any route tree that requires an authenticated session.
 * Persists the attempted URL so we can redirect back after login.
 */
export function RequireAuth() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoadingUser   = useAuthStore((s) => s.isLoadingUser);
  const location        = useLocation();

  // Still validating token on boot — show spinner instead of flashing /login
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
 * Prevents authenticated users from accessing auth pages.
 * Redirects to the page they originally tried to visit, or /admin.
 */
export function RequireGuest() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoadingUser   = useAuthStore((s) => s.isLoadingUser);
  const location        = useLocation();

  if (isLoadingUser) return <PageSpinner />;

  if (isAuthenticated) {
    const intended = (location.state as { from?: string })?.from ?? '/admin';
    return <Navigate to={intended} replace />;
  }

  return <Outlet />;
}

// ─── Permission guard ─────────────────────────────────────────────────────────
/**
 * Inline RBAC guard for use inside route definitions.
 * Renders <Outlet /> only if the user holds the required permission.
 *
 * Usage:
 *   <Route element={<RequirePermission action="manage" subject="Settings" />}>
 *     <Route path="settings" element={<SettingsPage />} />
 *   </Route>
 */
export function RequirePermission({
  action,
  subject,
}: {
  action: string;
  subject: string;
}) {
  const { can } = usePermissions();
  return can(action, subject) ? <Outlet /> : <Navigate to="/forbidden" replace />;
}
