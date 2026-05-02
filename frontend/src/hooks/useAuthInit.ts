import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';

/**
 * Called ONCE at the very root of the app.
 * Re-validates the persisted JWT against the server on every fresh page load.
 * Returns `true` while the initial check is in-flight so the router can
 * show a full-page spinner instead of a flash to /login.
 */
export function useAuthInit(): boolean {
  const loadCurrentUser = useAuthStore((s) => s.loadCurrentUser);
  const isLoadingUser   = useAuthStore((s) => s.isLoadingUser);

  useEffect(() => {
    loadCurrentUser();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return isLoadingUser;
}
