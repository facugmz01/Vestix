import { z } from 'zod';

export const qrSettingsSchema = z.object({
  qrGenerated: z.boolean(),
  mpStoreName: z.string().catch('')
});

export type QrSettingsFormData = z.infer<typeof qrSettingsSchema>;
