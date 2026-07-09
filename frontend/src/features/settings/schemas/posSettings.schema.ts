import { z } from 'zod';
import { receiptStyleSchema } from './receiptStyle.schema';

export const posSettingsSchema = z.object({
  allowNegativeStock: z.boolean(),
  thermalPrint80mm: z.boolean(),
  fiscalPrint70mm: z.boolean(),
  boxMode: z.string(),
  defaultPriceType: z.string(),
  requireInternalCode: z.boolean(),
  requireBarcode: z.boolean(),
  requireBrand: z.boolean(),
  requireDescription: z.boolean(),
  requireShippingDimensions: z.boolean(),
  officialDollarQuote: z.number().min(0),
  blueDollarQuote: z.number().min(0),
  receiptStyle: receiptStyleSchema.optional(),
});

export type PosSettingsFormData = z.infer<typeof posSettingsSchema>;
