import { z } from 'zod';

export const shippingMethodSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Obligatorio'),
  price: z.number().min(0),
  type: z.enum(['SHIPPING', 'PICKUP'])
});

export const storefrontSettingsSchema = z.object({
  enabled: z.boolean(),
  primaryColor: z.string().catch('#3b82f6'),
  fontFamily: z.string().catch('Inter'),
  showHeader: z.boolean(),
  storeName: z.string().optional(),
  showStoreName: z.boolean(),
  imagesCarousel: z.array(z.any()).catch([]),
  priceListToShow: z.string().catch(''),
  defaultSort: z.string().catch('name_asc'),
  hideOutOfStock: z.boolean(),
  hideBrandFilters: z.boolean().optional(),
  allowedPaymentMethods: z.array(z.string()).catch([]),
  transferCbu: z.string().optional(),
  acceptCash: z.boolean().catch(false),
  shippingInfo: z.string().catch(''),
  shippingMethods: z.array(shippingMethodSchema).catch([]),
  requireShippingData: z.enum(['optional', 'required', 'none']).catch('optional'),
  whatsapp: z.string().catch(''),
  instagramUrl: z.string().catch(''),
  facebookUrl: z.string().catch(''),
  tiktokUrl: z.string().catch(''),
  youtubeUrl: z.string().catch(''),
  xUrl: z.string().catch(''),
  subdomain: z.string().optional()
});

export type StorefrontSettingsFormData = z.infer<typeof storefrontSettingsSchema>;
