import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { getDefaultHomePath } from '@/rbac/homeRoute';

/** Redirects authenticated users to their role-appropriate home. */
export function HomeRedirect() {
  const user = useAuthStore((s) => s.user);
  return <Navigate to={getDefaultHomePath(user)} replace />;
}
