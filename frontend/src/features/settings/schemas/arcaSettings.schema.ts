import { z } from 'zod';

export const arcaSettingsSchema = z.object({
  enabled: z.boolean(),
  pointOfSale: z.number().min(1),
  environment: z.enum(['homologation', 'production']),
  startDate: z.string().catch(''),
  iibb: z.string().catch(''),
  cuit: z.string().catch(''),
  certAlias: z.string().catch('')
});

export type ArcaSettingsFormData = z.infer<typeof arcaSettingsSchema>;
