import { z } from 'zod';

export const notificationChannelSchema = z.enum(['EMAIL', 'WHATSAPP', 'SMS']);

export const notificationSettingsSchema = z.object({
  emailEnabled: z.boolean().catch(false),
  smsEnabled: z.boolean().catch(false),
  whatsappEnabled: z.boolean().catch(false),
  pushEnabled: z.boolean().catch(false),
  lowStockThreshold: z.number().min(0).catch(5),
  notifyOnSale: z.boolean().catch(false),
  notifyOnPurchase: z.boolean().catch(false),
  notifyOnLowStock: z.boolean().catch(true),
  notifyOnTransfer: z.boolean().catch(false),
  notifyOnDelivery: z.boolean().catch(true),
  saleChannels: z.array(notificationChannelSchema).min(1).catch(['EMAIL', 'WHATSAPP']),
  purchaseChannels: z.array(notificationChannelSchema).min(1).catch(['EMAIL']),
  deliveryChannels: z.array(notificationChannelSchema).min(1).catch(['WHATSAPP']),
  lowStockChannels: z.array(notificationChannelSchema).min(1).catch(['EMAIL']),
  transferChannels: z.array(notificationChannelSchema).min(1).catch(['EMAIL']),
  smtpHost: z.string().catch(''),
  smtpPort: z.number().catch(587),
  smtpUser: z.string().catch(''),
  smtpPass: z.string().catch(''),
  smsGatewayUrl: z.string().catch(''),
  evolutionApiUrl: z.string().catch(''),
  evolutionApiKey: z.string().catch(''),
  evolutionInstance: z.string().catch(''),
  fcmServerKey: z.string().catch('')
});

export type NotificationSettingsFormData = z.infer<typeof notificationSettingsSchema>;

export const integrationSettingsSchema = z.object({
  mercadopagoEnabled: z.boolean().catch(false),
  mercadolibreEnabled: z.boolean().catch(false),
  woocommerceEnabled: z.boolean().catch(false),
  shopifyEnabled: z.boolean().catch(false),
  mlAppId: z.string().catch(''),
  mlSecretKey: z.string().catch(''),
  shopifyStoreUrl: z.string().catch(''),
  shopifyAccessToken: z.string().catch(''),
  wooStoreUrl: z.string().catch(''),
  wooConsumerKey: z.string().catch(''),
  wooConsumerSecret: z.string().catch('')
});

export type IntegrationSettingsFormData = z.infer<typeof integrationSettingsSchema>;
