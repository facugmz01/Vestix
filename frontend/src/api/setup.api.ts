import { get, post } from './client';

export interface SetupStatus {
  isInitialized: boolean;
}

export interface CreateAdminDto {
  email: string;
  password: string;
  fullName: string;
}

export interface CompanyInfoDto {
  companyName: string;
  cuit?: string;
  address?: string;
  phone?: string;
  email?: string;
}

export const setupApi = {
  getStatus: () => get<SetupStatus>('/setup/status'),
  createAdmin: (data: CreateAdminDto) =>
    post<{ success: boolean; message: string }>('/setup/admin', data),
  saveCompany: (data: CompanyInfoDto) =>
    post<{ success: boolean; message: string }>('/setup/company', data),
};
