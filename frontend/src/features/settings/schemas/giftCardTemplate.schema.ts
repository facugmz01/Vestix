import { z } from 'zod';

export const giftCardTemplateSchema = z.object({
  brandLabel: z.string().min(1, 'La etiqueta de marca es obligatoria'),
  title: z.string().min(1, 'El título es obligatorio'),
  subtitle: z.string().optional(),
  backgroundColor: z.string().min(1),
  backgroundGradientEnd: z.string().min(1),
  useGradient: z.boolean(),
  textColor: z.string().min(1),
  accentColor: z.string().min(1),
  cardWidthMm: z.number().min(50).max(120),
  cardHeightMm: z.number().min(40).max(90),
  borderRadiusPx: z.number().min(0).max(32),
  fontFamily: z.enum(['sans-serif', 'serif', 'monospace']),
  amountFontSizePx: z.number().min(16).max(48),
  showLogo: z.boolean(),
  logoUrl: z.string().optional(),
  showQr: z.boolean(),
  qrSizePx: z.number().min(60).max(220),
  showRecipient: z.boolean(),
  showExpiry: z.boolean(),
  showCode: z.boolean(),
  footerText: z.string().min(1),
  paperMarginMm: z.number().min(0).max(30),
});

export type GiftCardTemplateFormData = z.infer<typeof giftCardTemplateSchema>;
