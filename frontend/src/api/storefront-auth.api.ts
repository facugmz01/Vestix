import { get, post } from './client';

export interface StorefrontCustomer {
  id: string;
  fullName: string;
  phone: string | null;
  email?: string | null;
}

export interface SendOtpResponse {
  success: boolean;
  message: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  customer: StorefrontCustomer;
}

export const storefrontAuthApi = {
  /** Step 1 — Request an OTP code via WhatsApp */
  sendOtp: (phone: string) =>
    post<SendOtpResponse>('/storefront/auth/send-otp', { phone }),

  /** Step 2 — Verify OTP and receive session cookie */
  verifyOtp: (phone: string, code: string) =>
    post<VerifyOtpResponse>('/storefront/auth/verify-otp', { phone, code }),

  /** Returns the currently authenticated customer (validates cookie) */
  me: () =>
    get<StorefrontCustomer>('/storefront/auth/me'),

  /** Clears the storefront_token cookie */
  logout: () =>
    post<{ success: boolean }>('/storefront/auth/logout'),
};
