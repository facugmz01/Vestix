import { z } from 'zod';

export const generalSettingsSchema = z.object({
  companyName: z.string().min(2, 'El nombre comercial es muy corto'),
  legalName: z.string().min(2, 'La razón social es requerida'),
  taxId: z.string().regex(/^\d{2}-\d{8}-\d$/, 'Formato de CUIT inválido (ej: 20-12345678-9)'),
  phone: z.string(),
  email: z.string().email('El formato del correo es inválido').or(z.literal('')),
  website: z.string().url('Debe ser una URL válida (ej: https://...)').or(z.literal('')).optional(),
  address: z.string(),
  city: z.string(),
  province: z.string(),
  country: z.string(),
  timezone: z.string(),
  currency: z.string(),
  locale: z.string()
});

export type GeneralSettingsFormData = z.infer<typeof generalSettingsSchema>;
