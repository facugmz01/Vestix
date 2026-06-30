import { z } from 'zod';

export const pricingSettingsSchema = z.object({
  defaultPriceListId: z.string().catch(''),
  vatDefaultPct: z.number().min(0).max(100),
  allowManualDiscount: z.boolean(),
  maxDiscountPct: z.number().min(0).max(100),
  roundingRule: z.enum(['NONE', 'NEAREST_10', 'UP', 'DOWN']),
  showPricesWithTax: z.boolean()
});

export type PricingSettingsFormData = z.infer<typeof pricingSettingsSchema>;

export const skuBarcodeSettingsSchema = z.object({
  skuPrefix: z.string().catch(''),
  skuAutoGenerate: z.boolean(),
  barcodeFormat: z.enum(['EAN13', 'CODE128', 'QR', 'NONE']),
  barcodeAutoGenerate: z.boolean(),
  nextSkuSequence: z.number().min(1)
});

export type SkuBarcodeSettingsFormData = z.infer<typeof skuBarcodeSettingsSchema>;

export const offlineSettingsSchema = z.object({
  offlineModeEnabled: z.boolean(),
  posOfflineTtlHours: z.number().min(1),
  maxQueueSize: z.number().min(1),
  autoSyncOnReconnect: z.boolean(),
  conflictStrategy: z.enum(['ASK_USER', 'SERVER_WINS', 'CLIENT_WINS'])
});

export type OfflineSettingsFormData = z.infer<typeof offlineSettingsSchema>;
