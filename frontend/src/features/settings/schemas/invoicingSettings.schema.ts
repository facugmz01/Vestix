import { z } from 'zod';

export const invoicingSettingsSchema = z.object({
  defaultInvoiceType: z.enum(['FACTURA_B', 'FACTURA_A', 'FACTURA_C', 'EXENTO']),
  autoIssueOnSale: z.boolean()
});

export type InvoicingSettingsFormData = z.infer<typeof invoicingSettingsSchema>;
