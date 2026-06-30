import { z } from 'zod';

export const pwaSettingsSchema = z.object({
  appName: z.string().min(1, 'Obligatorio').catch('Mi Tienda'),
  appShortName: z.string().min(1, 'Obligatorio').max(12).catch('Tienda'),
  themeColor: z.string().catch('#3b82f6'),
  backgroundColor: z.string().catch('#ffffff'),
  iconUrl: z.string().catch('/favicon.svg')
});

export type PwaSettingsFormData = z.infer<typeof pwaSettingsSchema>;
