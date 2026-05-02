import { apiClient } from './client';
import type { AuthUser, LoginDto } from '@/types';

export const authApi = {
  /**
   * Exchange credentials. The backend handles setting the HttpOnly cookie.
   */
  login: async (dto: LoginDto): Promise<{ message: string; user: AuthUser }> => {
    const { data } = await apiClient.post<{ message: string; user: AuthUser }>(
      '/auth/login',
      dto
    );
    return data;
  },

  /**
   * Validate the cookie session and return the latest user object.
   * Called once on app boot via `loadCurrentUser`.
   */
  me: async (): Promise<AuthUser> => {
    const { data } = await apiClient.get<AuthUser>('/auth/me');
    return data;
  },

  /** Client-side logout: calls the backend to clear the cookie. */
  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },
};
