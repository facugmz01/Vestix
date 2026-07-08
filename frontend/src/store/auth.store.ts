import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthUser } from '@/types';
import { authApi } from '@/api/auth.api';
import { hasAnyPermission } from '@/rbac/permission-match';

interface AuthState {
  user:            AuthUser | null;
  isAuthenticated: boolean;
  isLoadingUser:   boolean;  // True while /auth/me is in flight on boot

  // Mutators
  setAuth:         (user: AuthUser) => void;
  clearAuth:       () => void;
  loadCurrentUser: () => Promise<void>;

  // RBAC helper — mirrors backend { action, subject } semantics
  hasPermission: (action: string, subject: string) => boolean;
  isSuperAdmin:  () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:            null,
      isAuthenticated: false,
      isLoadingUser:   false,

      setAuth: (user) => {
        set({ user, isAuthenticated: true, isLoadingUser: false });
      },

      clearAuth: () => {
        set({ user: null, isAuthenticated: false, isLoadingUser: false });
      },

      /**
       * Called once on app mount. Re-validates the cookie session against
       * the server and refreshes the user object (roles may have changed).
       */
      loadCurrentUser: async () => {
        set({ isLoadingUser: true });
        try {
          const user = await authApi.me();
          set({ user, isAuthenticated: true, isLoadingUser: false });
        } catch {
          // Cookie is stale / revoked — clear session silently
          set({ user: null, isAuthenticated: false, isLoadingUser: false });
        }
      },

      hasPermission: (action, subject) => {
        const { user } = get();
        if (!user) return false;
        if (user.role === 'SUPER_ADMIN') return true;
        return hasAnyPermission(user.permissions, action, subject);
      },

      isSuperAdmin: () => get().user?.role === 'SUPER_ADMIN',
    }),
    {
      name:    'erp-auth-v1',
      storage: createJSONStorage(() => localStorage),
      // Only persist the user metadata for fast rendering before /auth/me finishes.
      // The actual auth authority is the HttpOnly cookie.
      partialize: (s) => ({
        user:            s.user,
        isAuthenticated: s.isAuthenticated,
      }),
    }
  )
);
