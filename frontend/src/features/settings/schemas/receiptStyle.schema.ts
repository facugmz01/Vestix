import { z } from 'zod';

export const receiptStyleSchema = z.object({
  paperWidthMm: z.union([
    z.literal(58),
    z.literal(70),
    z.literal(80),
    z.literal(148),
    z.literal(210),
  ]),
  fontFamily: z.enum(['monospace', 'sans-serif', 'serif']),
  fontSizePx: z.number().min(9).max(18),
  headerFontSizePx: z.number().min(10).max(24),
  textColor: z.string().min(4),
  backgroundColor: z.string().min(4),
  accentColor: z.string().min(4),
  dividerStyle: z.enum(['dashed', 'solid', 'dotted', 'none']),
  showSku: z.boolean(),
  showLineDiscounts: z.boolean(),
  showPaymentMethod: z.boolean(),
  showCustomer: z.boolean(),
  showSubtotal: z.boolean(),
  showDate: z.boolean(),
  showTicketNumber: z.boolean(),
  logoUrl: z.string().optional(),
  titleFallback: z.string().min(1),
});

export type ReceiptStyleFormData = z.infer<typeof receiptStyleSchema>;
