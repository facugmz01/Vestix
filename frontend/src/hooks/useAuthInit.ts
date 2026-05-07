import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { isStorefrontDomain } from '@/utils/storefrontDomain';

/**
 * Called ONCE at the very root of the app.
 * Re-validates the persisted JWT against the server on every fresh page load.
 * Returns `true` while the initial check is in-flight so the router can
 * show a full-page spinner instead of a flash to /login.
 *
 * SKIPPED on the public storefront domain — no auth required for customers.
 */
export function useAuthInit(): boolean {
  const loadCurrentUser = useAuthStore((s) => s.loadCurrentUser);
  const isLoadingUser   = useAuthStore((s) => s.isLoadingUser);

  useEffect(() => {
    // Public storefront visitors don't need to be authenticated.
    // Skipping this call avoids a 401 network error on tienda.* domains.
    if (!isStorefrontDomain()) {
      loadCurrentUser();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // On the storefront, never block rendering waiting for auth
  if (isStorefrontDomain()) return false;

  return isLoadingUser;
}
