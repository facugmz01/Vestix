import { apiClient } from './client';
import type {
  AuthUser,
  LoginDto,
  LoginResponse,
  UpdateProfileDto,
  ChangePasswordDto,
  MfaSetupResponse,
  MfaEnableResponse,
} from '@/types';

export interface AuthorizeActionDto {
  email: string;
  password: string;
  action: string;
  subject?: string;
  reason?: string;
}

export interface AuthorizeActionResult {
  message: string;
  supervisorApprovalToken: string;
  supervisor: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
}

export const authApi = {
  /**
   * Exchange credentials. Returns session user, or mfaToken if MFA is required.
   */
  login: async (dto: LoginDto): Promise<LoginResponse> => {
    const { data } = await apiClient.post<LoginResponse>(
      '/auth/login',
      dto
    );
    return data;
  },

  /**
   * Verify second factor (TOTP / Backup Code) during login.
   */
  loginMfa: async (dto: { mfaToken: string; code: string }): Promise<{ message: string; user: AuthUser }> => {
    const { data } = await apiClient.post<{ message: string; user: AuthUser }>(
      '/auth/login-mfa',
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

  /**
   * Update personal profile (fullName, email, phone) of current logged in user.
   */
  updateProfile: async (dto: UpdateProfileDto): Promise<{ message: string; user: AuthUser }> => {
    const { data } = await apiClient.patch<{ message: string; user: AuthUser }>(
      '/auth/profile',
      dto
    );
    return data;
  },

  /**
   * Change password for the current logged in user.
   */
  changePassword: async (dto: ChangePasswordDto): Promise<{ success: boolean; message: string }> => {
    const { data } = await apiClient.post<{ success: boolean; message: string }>(
      '/auth/change-password',
      dto
    );
    return data;
  },

  /**
   * Generate MFA setup secret and QR code for the current user.
   */
  generateMfa: async (): Promise<MfaSetupResponse> => {
    const { data } = await apiClient.post<MfaSetupResponse>('/auth/mfa/generate');
    return data;
  },

  /**
   * Enable MFA by verifying the initial 6-digit TOTP code.
   */
  enableMfa: async (code: string): Promise<MfaEnableResponse> => {
    const { data } = await apiClient.post<MfaEnableResponse>('/auth/mfa/enable', { code });
    return data;
  },

  /**
   * Disable MFA by providing current password.
   */
  disableMfa: async (password: string): Promise<{ success: boolean; message: string }> => {
    const { data } = await apiClient.post<{ success: boolean; message: string }>('/auth/mfa/disable', {
      password,
    });
    return data;
  },

  /**
   * Validate supervisor credentials for a sensitive action and obtain a short-lived approval token.
   */
  authorizeAction: async (dto: AuthorizeActionDto): Promise<AuthorizeActionResult> => {
    const { data } = await apiClient.post<AuthorizeActionResult>(
      '/auth/authorize-action',
      dto
    );
    return data;
  },

  /** Client-side logout: calls the backend to clear the cookie. */
  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },
};

