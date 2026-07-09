import { z } from 'zod';

export const notificationChannelSchema = z.enum(['EMAIL', 'WHATSAPP', 'SMS']);

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
  storeLoginChannels: z.array(notificationChannelSchema).min(1).catch(['WHATSAPP']),
  whatsapp: z.string().catch(''),
  instagramUrl: z.string().catch(''),
  facebookUrl: z.string().catch(''),
  tiktokUrl: z.string().catch(''),
  youtubeUrl: z.string().catch(''),
  xUrl: z.string().catch(''),
  subdomain: z.string().optional(),
  deliverySettings: z.object({
    enableGpsTracking: z.boolean().catch(true),
    enableGeofence: z.boolean().catch(true),
    geofenceRadiusMeters: z.number().catch(150),
    requirePhotoOnDelivery: z.boolean().catch(false),
    showMapToCustomer: z.boolean().catch(true),
    carriers: z.object({
      andreani: z.object({
        enabled: z.boolean().catch(false),
        apiKey: z.string().catch(''),
        clientId: z.string().catch(''),
        contract: z.string().catch(''),
      }).catch({ enabled: false, apiKey: '', clientId: '', contract: '' }),
      mercadoEnvios: z.object({
        enabled: z.boolean().catch(false),
        accessToken: z.string().catch(''),
        userId: z.string().catch(''),
      }).catch({ enabled: false, accessToken: '', userId: '' }),
    }).catch({
      andreani: { enabled: false, apiKey: '', clientId: '', contract: '' },
      mercadoEnvios: { enabled: false, accessToken: '', userId: '' },
    }),
  }).catch({
    enableGpsTracking: true,
    enableGeofence: true,
    geofenceRadiusMeters: 150,
    requirePhotoOnDelivery: false,
    showMapToCustomer: true,
    carriers: {
      andreani: { enabled: false, apiKey: '', clientId: '', contract: '' },
      mercadoEnvios: { enabled: false, accessToken: '', userId: '' },
    },
  }),
});

export type StorefrontSettingsFormData = z.infer<typeof storefrontSettingsSchema>;
