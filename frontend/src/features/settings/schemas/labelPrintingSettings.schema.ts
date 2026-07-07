import { z } from 'zod';

export const labelPrintingSettingsSchema = z.object({
  defaultTemplateId: z.string().catch(''),
  autoGenerateBarcodeOnPrint: z.boolean(),
  defaultOutput: z.enum(['PDF', 'ZPL', 'BROWSER']),
  zplDpi: z.union([z.literal(203), z.literal(300)]),
  zplPrinterHost: z.string().catch(''),
  zplPrinterPort: z.number().min(1).catch(9100),
});

export type LabelPrintingSettingsFormData = z.infer<typeof labelPrintingSettingsSchema>;
