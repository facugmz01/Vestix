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

export interface SendOtpPayload {
  phone?: string;
  email?: string;
}

export interface VerifyOtpPayload extends SendOtpPayload {
  code: string;
}

export const storefrontAuthApi = {
  sendOtp: (payload: SendOtpPayload) =>
    post<SendOtpResponse>('/storefront/auth/send-otp', payload),

  verifyOtp: (payload: VerifyOtpPayload) =>
    post<VerifyOtpResponse>('/storefront/auth/verify-otp', payload),

  me: () =>
    get<StorefrontCustomer>('/storefront/auth/me'),

  logout: () =>
    post<{ success: boolean }>('/storefront/auth/logout'),
};
