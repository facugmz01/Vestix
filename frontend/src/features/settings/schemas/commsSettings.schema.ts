import { z } from 'zod';

export const notificationChannelSchema = z.enum(['EMAIL', 'WHATSAPP', 'SMS']);

export const DEFAULT_NOTIFICATION_SETTINGS = {
  emailEnabled: false,
  smsEnabled: false,
  whatsappEnabled: false,
  pushEnabled: false,
  lowStockThreshold: 5,
  notifyOnSale: false,
  notifyOnPurchase: false,
  notifyOnLowStock: true,
  notifyOnTransfer: false,
  notifyOnDelivery: true,
  saleChannels: ['EMAIL', 'WHATSAPP'] as Array<'EMAIL' | 'WHATSAPP' | 'SMS'>,
  purchaseChannels: ['EMAIL'] as Array<'EMAIL' | 'WHATSAPP' | 'SMS'>,
  deliveryChannels: ['WHATSAPP'] as Array<'EMAIL' | 'WHATSAPP' | 'SMS'>,
  lowStockChannels: ['EMAIL'] as Array<'EMAIL' | 'WHATSAPP' | 'SMS'>,
  transferChannels: ['EMAIL'] as Array<'EMAIL' | 'WHATSAPP' | 'SMS'>,
  smtpHost: '',
  smtpPort: 587,
  smtpUser: '',
  smtpPass: '',
  smsGatewayUrl: '',
  evolutionApiUrl: '',
  evolutionApiKey: '',
  evolutionInstance: '',
  fcmServerKey: '',
};

const bool = (fallback: boolean) =>
  z.preprocess((value) => (typeof value === 'boolean' ? value : fallback), z.boolean());

const num = (fallback: number) =>
  z.preprocess((value) => (typeof value === 'number' && !Number.isNaN(value) ? value : fallback), z.number());

const str = (fallback = '') =>
  z.preprocess((value) => (typeof value === 'string' ? value : fallback), z.string());

const channels = (fallback: Array<'EMAIL' | 'WHATSAPP' | 'SMS'>) =>
  z.preprocess((value) => (Array.isArray(value) && value.length > 0 ? value : fallback), z.array(notificationChannelSchema).min(1));

export const notificationSettingsSchema = z.object({
  emailEnabled: bool(DEFAULT_NOTIFICATION_SETTINGS.emailEnabled),
  smsEnabled: bool(DEFAULT_NOTIFICATION_SETTINGS.smsEnabled),
  whatsappEnabled: bool(DEFAULT_NOTIFICATION_SETTINGS.whatsappEnabled),
  pushEnabled: bool(DEFAULT_NOTIFICATION_SETTINGS.pushEnabled),
  lowStockThreshold: num(DEFAULT_NOTIFICATION_SETTINGS.lowStockThreshold).pipe(z.number().min(0)),
  notifyOnSale: bool(DEFAULT_NOTIFICATION_SETTINGS.notifyOnSale),
  notifyOnPurchase: bool(DEFAULT_NOTIFICATION_SETTINGS.notifyOnPurchase),
  notifyOnLowStock: bool(DEFAULT_NOTIFICATION_SETTINGS.notifyOnLowStock),
  notifyOnTransfer: bool(DEFAULT_NOTIFICATION_SETTINGS.notifyOnTransfer),
  notifyOnDelivery: bool(DEFAULT_NOTIFICATION_SETTINGS.notifyOnDelivery),
  saleChannels: channels(DEFAULT_NOTIFICATION_SETTINGS.saleChannels),
  purchaseChannels: channels(DEFAULT_NOTIFICATION_SETTINGS.purchaseChannels),
  deliveryChannels: channels(DEFAULT_NOTIFICATION_SETTINGS.deliveryChannels),
  lowStockChannels: channels(DEFAULT_NOTIFICATION_SETTINGS.lowStockChannels),
  transferChannels: channels(DEFAULT_NOTIFICATION_SETTINGS.transferChannels),
  smtpHost: str(),
  smtpPort: num(DEFAULT_NOTIFICATION_SETTINGS.smtpPort),
  smtpUser: str(),
  smtpPass: str(),
  smsGatewayUrl: str(),
  evolutionApiUrl: str(),
  evolutionApiKey: str(),
  evolutionInstance: str(),
  fcmServerKey: str(),
});

export type NotificationSettingsFormData = z.infer<typeof notificationSettingsSchema>;

export function parseNotificationSettings(input: unknown): NotificationSettingsFormData {
  const partial = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  const result = notificationSettingsSchema.safeParse({
    ...DEFAULT_NOTIFICATION_SETTINGS,
    ...partial,
  });
  return result.success ? result.data : { ...DEFAULT_NOTIFICATION_SETTINGS };
}

export const DEFAULT_INTEGRATION_SETTINGS = {
  mercadopagoEnabled: false,
  mercadolibreEnabled: false,
  woocommerceEnabled: false,
  shopifyEnabled: false,
  mpPublicKey: '',
  mpAccessToken: '',
  mpWebhookSecret: '',
  mpEnvironment: '' as '' | 'test' | 'production',
  mpExternalPosId: '',
  mlAppId: '',
  mlSecretKey: '',
  shopifyStoreUrl: '',
  shopifyAccessToken: '',
  wooStoreUrl: '',
  wooConsumerKey: '',
  wooConsumerSecret: '',
};

export const integrationSettingsSchema = z.object({
  mercadopagoEnabled: bool(DEFAULT_INTEGRATION_SETTINGS.mercadopagoEnabled),
  mercadolibreEnabled: bool(DEFAULT_INTEGRATION_SETTINGS.mercadolibreEnabled),
  woocommerceEnabled: bool(DEFAULT_INTEGRATION_SETTINGS.woocommerceEnabled),
  shopifyEnabled: bool(DEFAULT_INTEGRATION_SETTINGS.shopifyEnabled),
  mpPublicKey: str(),
  mpAccessToken: str(),
  mpWebhookSecret: str(),
  mpEnvironment: z.enum(['test', 'production', '']).default(''),
  mpExternalPosId: str(),
  mlAppId: str(),
  mlSecretKey: str(),
  shopifyStoreUrl: str(),
  shopifyAccessToken: str(),
  wooStoreUrl: str(),
  wooConsumerKey: str(),
  wooConsumerSecret: str(),
});

export type IntegrationSettingsFormData = z.infer<typeof integrationSettingsSchema>;

export function parseIntegrationSettings(input: unknown): IntegrationSettingsFormData {
  const partial = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  const result = integrationSettingsSchema.safeParse({
    ...DEFAULT_INTEGRATION_SETTINGS,
    ...partial,
  });
  return result.success ? result.data : { ...DEFAULT_INTEGRATION_SETTINGS };
}
