import { z } from 'zod';

export const notificationChannelSchema = z.enum(['EMAIL', 'WHATSAPP', 'SMS']);

export const shippingMethodSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Obligatorio'),
  price: z.number().min(0),
  type: z.enum(['SHIPPING', 'PICKUP']),
});

const bool = (fallback: boolean) =>
  z.preprocess((value) => (typeof value === 'boolean' ? value : fallback), z.boolean());

const num = (fallback: number) =>
  z.preprocess((value) => (typeof value === 'number' && !Number.isNaN(value) ? value : fallback), z.number());

const str = (fallback = '') =>
  z.preprocess((value) => (typeof value === 'string' ? value : fallback), z.string());

const DEFAULT_CARRIERS = {
  andreani: { enabled: false, apiKey: '', clientId: '', contract: '' },
  mercadoEnvios: { enabled: false, accessToken: '', userId: '' },
};

const DEFAULT_DELIVERY_SETTINGS = {
  enableGpsTracking: true,
  enableGeofence: true,
  geofenceRadiusMeters: 150,
  requirePhotoOnDelivery: false,
  showMapToCustomer: true,
  carriers: DEFAULT_CARRIERS,
};

export const DEFAULT_STOREFRONT_SETTINGS = {
  enabled: false,
  primaryColor: '#3b82f6',
  fontFamily: 'Inter',
  showHeader: true,
  storeName: undefined as string | undefined,
  showStoreName: true,
  imagesCarousel: [] as unknown[],
  priceListToShow: '',
  defaultSort: 'name_asc',
  hideOutOfStock: false,
  hideBrandFilters: undefined as boolean | undefined,
  allowedPaymentMethods: [] as string[],
  transferCbu: undefined as string | undefined,
  transferAlias: undefined as string | undefined,
  transferHolderName: undefined as string | undefined,
  transferBankName: undefined as string | undefined,
  transferCuit: undefined as string | undefined,
  transferAccountType: '' as string,
  acceptCash: false,
  shippingInfo: '',
  shippingMethods: [] as Array<z.infer<typeof shippingMethodSchema>>,
  requireShippingData: 'optional' as 'optional' | 'required' | 'none',
  storeLoginChannels: ['WHATSAPP'] as Array<'EMAIL' | 'WHATSAPP' | 'SMS'>,
  whatsapp: '',
  instagramUrl: '',
  facebookUrl: '',
  tiktokUrl: '',
  youtubeUrl: '',
  xUrl: '',
  subdomain: undefined as string | undefined,
  deliverySettings: DEFAULT_DELIVERY_SETTINGS,
};

export const storefrontSettingsSchema = z.object({
  enabled: bool(DEFAULT_STOREFRONT_SETTINGS.enabled),
  primaryColor: str(DEFAULT_STOREFRONT_SETTINGS.primaryColor),
  fontFamily: str(DEFAULT_STOREFRONT_SETTINGS.fontFamily),
  showHeader: bool(DEFAULT_STOREFRONT_SETTINGS.showHeader),
  storeName: z.string().optional(),
  showStoreName: bool(DEFAULT_STOREFRONT_SETTINGS.showStoreName),
  imagesCarousel: z.array(z.any()).catch([]),
  priceListToShow: str(),
  defaultSort: str(DEFAULT_STOREFRONT_SETTINGS.defaultSort),
  hideOutOfStock: bool(DEFAULT_STOREFRONT_SETTINGS.hideOutOfStock),
  hideBrandFilters: z.boolean().optional(),
  allowedPaymentMethods: z.array(z.string()).catch([]),
  transferCbu: z.string().optional(),
  transferAlias: z.string().optional(),
  transferHolderName: z.string().optional(),
  transferBankName: z.string().optional(),
  transferCuit: z.string().optional(),
  transferAccountType: str(),
  acceptCash: bool(DEFAULT_STOREFRONT_SETTINGS.acceptCash),
  shippingInfo: str(),
  shippingMethods: z.array(shippingMethodSchema).catch([]),
  requireShippingData: z.enum(['optional', 'required', 'none']).catch('optional'),
  storeLoginChannels: z.preprocess(
    (value) => (Array.isArray(value) && value.length > 0 ? value : DEFAULT_STOREFRONT_SETTINGS.storeLoginChannels),
    z.array(notificationChannelSchema).min(1),
  ),
  whatsapp: str(),
  instagramUrl: str(),
  facebookUrl: str(),
  tiktokUrl: str(),
  youtubeUrl: str(),
  xUrl: str(),
  subdomain: z.string().optional(),
  deliverySettings: z.object({
    enableGpsTracking: bool(DEFAULT_DELIVERY_SETTINGS.enableGpsTracking),
    enableGeofence: bool(DEFAULT_DELIVERY_SETTINGS.enableGeofence),
    geofenceRadiusMeters: num(DEFAULT_DELIVERY_SETTINGS.geofenceRadiusMeters),
    requirePhotoOnDelivery: bool(DEFAULT_DELIVERY_SETTINGS.requirePhotoOnDelivery),
    showMapToCustomer: bool(DEFAULT_DELIVERY_SETTINGS.showMapToCustomer),
    carriers: z.object({
      andreani: z.object({
        enabled: bool(DEFAULT_CARRIERS.andreani.enabled),
        apiKey: str(),
        clientId: str(),
        contract: str(),
      }).catch(DEFAULT_CARRIERS.andreani),
      mercadoEnvios: z.object({
        enabled: bool(DEFAULT_CARRIERS.mercadoEnvios.enabled),
        accessToken: str(),
        userId: str(),
      }).catch(DEFAULT_CARRIERS.mercadoEnvios),
    }).catch(DEFAULT_CARRIERS),
  }).catch(DEFAULT_DELIVERY_SETTINGS),
});

export type StorefrontSettingsFormData = z.infer<typeof storefrontSettingsSchema>;

export function parseStorefrontSettings(input: unknown): StorefrontSettingsFormData {
  const partial = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  const result = storefrontSettingsSchema.safeParse({
    ...DEFAULT_STOREFRONT_SETTINGS,
    ...partial,
  });
  return result.success ? result.data : { ...DEFAULT_STOREFRONT_SETTINGS };
}
