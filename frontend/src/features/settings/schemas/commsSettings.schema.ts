import { z } from 'zod';

export const notificationSettingsSchema = z.object({
  emailEnabled: z.boolean(),
  smsEnabled: z.boolean(),
  whatsappEnabled: z.boolean(),
  pushEnabled: z.boolean(),
  lowStockThreshold: z.number().min(0),
  notifyOnSale: z.boolean(),
  notifyOnPurchase: z.boolean(),
  notifyOnLowStock: z.boolean(),
  notifyOnTransfer: z.boolean(),
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
  mercadopagoEnabled: z.boolean(),
  mercadolibreEnabled: z.boolean(),
  woocommerceEnabled: z.boolean(),
  shopifyEnabled: z.boolean(),
  mlAppId: z.string().catch(''),
  mlSecretKey: z.string().catch(''),
  shopifyStoreUrl: z.string().catch(''),
  shopifyAccessToken: z.string().catch(''),
  wooStoreUrl: z.string().catch(''),
  wooConsumerKey: z.string().catch(''),
  wooConsumerSecret: z.string().catch('')
});

export type IntegrationSettingsFormData = z.infer<typeof integrationSettingsSchema>;
