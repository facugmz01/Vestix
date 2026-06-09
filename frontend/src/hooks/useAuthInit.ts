import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { isStorefrontDomain } from '@/utils/storefrontDomain';
import { setupApi } from '@/api/setup.api';

/**
 * Called ONCE at the very root of the app.
 * 1. Checks if the system has been set up (first-launch wizard).
 * 2. Re-validates the persisted JWT against the server on every fresh page load.
 * Returns `true` while any initial check is in-flight so the router can
 * show a full-page spinner instead of a flash to /login.
 *
 * SKIPPED on the public storefront domain — no auth required for customers.
 */
export function useAuthInit(): boolean {
  const loadCurrentUser = useAuthStore((s) => s.loadCurrentUser);
  const isLoadingUser   = useAuthStore((s) => s.isLoadingUser);
  const [checkingSetup, setCheckingSetup] = useState(true);

  useEffect(() => {
    if (isStorefrontDomain()) {
      setCheckingSetup(false);
      return;
    }

    const checkSetup = async () => {
      try {
        const { isInitialized } = await setupApi.getStatus();
        if (!isInitialized) {
          if (!window.location.pathname.startsWith('/setup')) {
            window.location.replace('/setup');
          }
          setCheckingSetup(false);
          return; // Skip loading user if system isn't initialized
        }
      } catch {
        // If setup endpoint fails, continue normally
      }
      setCheckingSetup(false);
      loadCurrentUser();
    };

    checkSetup();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // On the storefront, never block rendering waiting for auth
  if (isStorefrontDomain()) return false;

  return checkingSetup || isLoadingUser;
}
