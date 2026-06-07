/**
 * Storefront Customer Auth Store
 * Separate from the ERP admin auth store (auth.store.ts).
 * Manages authenticated customer state for the public-facing e-commerce storefront.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { storefrontAuthApi, StorefrontCustomer } from '@/api/storefront-auth.api';

interface StorefrontAuthState {
  customer: StorefrontCustomer | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setCustomer: (customer: StorefrontCustomer) => void;
  clearCustomer: () => void;
  loadCurrentCustomer: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useStorefrontAuthStore = create<StorefrontAuthState>()(
  persist(
    (set) => ({
      customer: null,
      isAuthenticated: false,
      isLoading: false,

      setCustomer: (customer) =>
        set({ customer, isAuthenticated: true, isLoading: false }),

      clearCustomer: () =>
        set({ customer: null, isAuthenticated: false, isLoading: false }),

      /**
       * Called on storefront layout mount to validate the `storefront_token` cookie.
       * If the cookie is stale or missing, clears local state silently.
       */
      loadCurrentCustomer: async () => {
        set({ isLoading: true });
        try {
          const customer = await storefrontAuthApi.me();
          set({ customer, isAuthenticated: true, isLoading: false });
        } catch {
          // Cookie is stale or not set — clear silently
          set({ customer: null, isAuthenticated: false, isLoading: false });
        }
      },

      logout: async () => {
        try {
          await storefrontAuthApi.logout();
        } catch { /* ignore network errors on logout */ }
        set({ customer: null, isAuthenticated: false, isLoading: false });
      },
    }),
    {
      name: 'storefront-auth-v1',
      storage: createJSONStorage(() => localStorage),
      // Persist only customer metadata — actual auth authority is the HttpOnly cookie
      partialize: (s) => ({
        customer: s.customer,
        isAuthenticated: s.isAuthenticated,
      }),
    }
  )
);
