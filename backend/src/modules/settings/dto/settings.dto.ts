import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsNumber, IsOptional, IsString, Max, Min, ValidateNested, IsArray, IsNotEmpty, IsUrl, ArrayMinSize } from 'class-validator';

const NOTIFICATION_CHANNEL_VALUES = ['EMAIL', 'WHATSAPP', 'SMS'] as const;

export class GeneralSettingsDto {
  @IsNotEmpty({ message: 'El nombre de la empresa es obligatorio' })
  @IsString()
  companyName?: string;

  @IsNotEmpty({ message: 'El CUIT es obligatorio' })
  @IsString()
  taxId?: string;

  @IsOptional()
  @IsString()
  legalName?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  // NOTE: @IsEmail() removed — it rejects empty strings and is handled client-side
  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  @IsString()
  currency?: string;
}

export class PricingSettingsDto {
  @IsOptional()
  @IsString()
  defaultPriceListId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  vatDefaultPct?: number;

  @IsOptional()
  @IsBoolean()
  allowManualDiscount?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  maxDiscountPct?: number;

  @IsOptional()
  @IsIn(['NONE', 'NEAREST_10', 'UP', 'DOWN'])
  roundingRule?: 'NONE' | 'NEAREST_10' | 'UP' | 'DOWN';

  @IsOptional()
  @IsBoolean()
  showPricesWithTax?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  usdOfficialRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  usdBlueRate?: number;
}

export class SkuBarcodeSettingsDto {
  @IsOptional()
  @IsString()
  skuPrefix?: string;

  @IsOptional()
  @IsBoolean()
  skuAutoGenerate?: boolean;

  @IsOptional()
  @IsIn(['EAN13', 'CODE128', 'QR', 'NONE'])
  barcodeFormat?: 'EAN13' | 'CODE128' | 'QR' | 'NONE';

  @IsOptional()
  @IsBoolean()
  barcodeAutoGenerate?: boolean;

  @IsOptional()
  @IsNumber()
  nextSkuSequence?: number;
}

export class InvoicingSettingsDto {
  // NOTE: EXENTO added to allowed values to match the frontend select option
  @IsOptional()
  @IsIn(['FACTURA_B', 'FACTURA_A', 'FACTURA_C', 'EXENTO'])
  defaultInvoiceType?: string;

  @IsOptional()
  @IsBoolean()
  autoIssueOnSale?: boolean;
}

export class NotificationSettingsDto {
  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  smsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  whatsappEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  pushEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  lowStockThreshold?: number;

  @IsOptional()
  @IsBoolean()
  notifyOnSale?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyOnPurchase?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyOnLowStock?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyOnTransfer?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyOnDelivery?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsIn(NOTIFICATION_CHANNEL_VALUES, { each: true })
  saleChannels?: Array<'EMAIL' | 'WHATSAPP' | 'SMS'>;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsIn(NOTIFICATION_CHANNEL_VALUES, { each: true })
  purchaseChannels?: Array<'EMAIL' | 'WHATSAPP' | 'SMS'>;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsIn(NOTIFICATION_CHANNEL_VALUES, { each: true })
  deliveryChannels?: Array<'EMAIL' | 'WHATSAPP' | 'SMS'>;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsIn(NOTIFICATION_CHANNEL_VALUES, { each: true })
  lowStockChannels?: Array<'EMAIL' | 'WHATSAPP' | 'SMS'>;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsIn(NOTIFICATION_CHANNEL_VALUES, { each: true })
  transferChannels?: Array<'EMAIL' | 'WHATSAPP' | 'SMS'>;

  @IsOptional()
  @IsString()
  smtpHost?: string;

  @IsOptional()
  @IsNumber()
  smtpPort?: number;

  @IsOptional()
  @IsString()
  smtpUser?: string;

  @IsOptional()
  @IsString()
  smtpPass?: string;

  @IsOptional()
  @IsString()
  smsGatewayUrl?: string;

  @IsOptional()
  @IsString()
  evolutionApiUrl?: string;

  @IsOptional()
  @IsString()
  evolutionApiKey?: string;

  @IsOptional()
  @IsString()
  evolutionInstance?: string;

  @IsOptional()
  @IsString()
  fcmServerKey?: string;
}

export class IntegrationSettingsDto {
  @IsOptional() @IsBoolean() mercadopagoEnabled?: boolean;
  @IsOptional() @IsString() mpPublicKey?: string;
  @IsOptional() @IsString() mpAccessToken?: string;
  @IsOptional() @IsString() mpWebhookSecret?: string;

  @IsOptional()
  @IsBoolean()
  mercadolibreEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  woocommerceEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  shopifyEnabled?: boolean;

  @IsOptional()
  @IsString()
  mlAppId?: string;

  @IsOptional()
  @IsString()
  mlSecretKey?: string;

  @IsOptional()
  @IsString()
  shopifyStoreUrl?: string;

  @IsOptional()
  @IsString()
  shopifyAccessToken?: string;

  @IsOptional()
  @IsString()
  wooStoreUrl?: string;

  @IsOptional()
  @IsString()
  wooConsumerKey?: string;

  @IsOptional()
  @IsString()
  wooConsumerSecret?: string;
}

export class OfflineSettingsDto {
  @IsOptional()
  @IsBoolean()
  offlineModeEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  posOfflineTtlHours?: number;

  @IsOptional()
  @IsNumber()
  maxQueueSize?: number;

  @IsOptional()
  @IsBoolean()
  autoSyncOnReconnect?: boolean;

  @IsOptional()
  @IsIn(['ASK_USER', 'SERVER_WINS', 'CLIENT_WINS'])
  conflictStrategy?: 'ASK_USER' | 'SERVER_WINS' | 'CLIENT_WINS';
}

export class PosSettingsDto {
  @IsOptional() @IsBoolean() allowNegativeStock?: boolean;
  @IsOptional() @IsBoolean() thermalPrint80mm?: boolean;
  @IsOptional() @IsBoolean() fiscalPrint70mm?: boolean;
  @IsOptional() @IsString() boxMode?: string;
  @IsOptional() @IsString() defaultPriceType?: string;
  @IsOptional() @IsBoolean() requireInternalCode?: boolean;
  @IsOptional() @IsBoolean() requireBarcode?: boolean;
  @IsOptional() @IsBoolean() requireBrand?: boolean;
  @IsOptional() @IsBoolean() requireDescription?: boolean;
  @IsOptional() @IsBoolean() requireShippingDimensions?: boolean;
  @IsOptional() @IsNumber() officialDollarQuote?: number;
  @IsOptional() @IsNumber() blueDollarQuote?: number;
}

export class ArcaSettingsDto {
  @IsOptional() @IsBoolean() enabled?: boolean;
  @IsOptional() @IsNumber() pointOfSale?: number;
  @IsOptional() @IsString() environment?: string;
  @IsOptional() @IsString() startDate?: string;
  @IsOptional() @IsString() iibb?: string;
  @IsOptional() @IsString() cuit?: string;
  @IsOptional() @IsString() certAlias?: string;
}

export class StorefrontSettingsDto {
  @IsOptional() @IsBoolean() enabled?: boolean;
  @IsOptional() @IsString() primaryColor?: string;
  @IsOptional() @IsString() fontFamily?: string;
  @IsOptional() @IsBoolean() showHeader?: boolean;
  @IsOptional() @IsBoolean() showStoreName?: boolean;
  @IsOptional() imagesCarousel?: any[];
  @IsOptional() @IsString() priceListToShow?: string;
  @IsOptional() @IsString() defaultSort?: string;
  @IsOptional() @IsBoolean() hideOutOfStock?: boolean;
  @IsOptional() @IsBoolean() hideBrandFilters?: boolean;
  @IsOptional() @IsString() transferCbu?: string;
  @IsOptional() @IsBoolean() acceptCash?: boolean;
  @IsOptional() @IsString() shippingInfo?: string;
  @IsOptional() @IsString() requireShippingData?: string;
  @IsOptional() @IsString() whatsapp?: string;
  @IsOptional() @IsString() instagramUrl?: string;
  @IsOptional() @IsString() facebookUrl?: string;
  @IsOptional() @IsString() tiktokUrl?: string;
  @IsOptional() @IsString() youtubeUrl?: string;
  @IsOptional() @IsString() xUrl?: string;
  @IsOptional() @IsString() subdomain?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) allowedPaymentMethods?: string[];
  @IsOptional() @IsArray() shippingMethods?: any[];
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsIn(NOTIFICATION_CHANNEL_VALUES, { each: true })
  storeLoginChannels?: Array<'EMAIL' | 'WHATSAPP' | 'SMS'>;
  @IsOptional() deliverySettings?: {
    enableGpsTracking?: boolean;
    enableGeofence?: boolean;
    geofenceRadiusMeters?: number;
    requirePhotoOnDelivery?: boolean;
    showMapToCustomer?: boolean;
    carriers?: {
      andreani?: { enabled?: boolean; apiKey?: string; clientId?: string; contract?: string };
      mercadoEnvios?: { enabled?: boolean; accessToken?: string; userId?: string };
    };
  };
}

export class PwaSettingsDto {
  @IsOptional() @IsString() appName?: string;
  @IsOptional() @IsString() appShortName?: string;
  @IsOptional() @IsString() themeColor?: string;
  @IsOptional() @IsString() backgroundColor?: string;
  @IsOptional() @IsString() iconUrl?: string;
}

export class QrSettingsDto {
  @IsOptional() @IsString() mpStoreName?: string;
  @IsOptional() @IsBoolean() qrGenerated?: boolean;
}

export class LabelPrintingSettingsDto {
  @IsOptional() @IsString() defaultTemplateId?: string;
  @IsOptional() @IsBoolean() autoGenerateBarcodeOnPrint?: boolean;
  @IsOptional() @IsIn(['PDF', 'ZPL', 'BROWSER']) defaultOutput?: 'PDF' | 'ZPL' | 'BROWSER';
  @IsOptional() @IsIn([203, 300]) zplDpi?: 203 | 300;
  @IsOptional() @IsString() zplPrinterHost?: string;
  @IsOptional() @IsNumber() zplPrinterPort?: number;
}

export class UpdateSettingsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => GeneralSettingsDto)
  general?: GeneralSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PricingSettingsDto)
  pricing?: PricingSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => SkuBarcodeSettingsDto)
  skuBarcode?: SkuBarcodeSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => InvoicingSettingsDto)
  invoicing?: InvoicingSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationSettingsDto)
  notifications?: NotificationSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => IntegrationSettingsDto)
  integrations?: IntegrationSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => OfflineSettingsDto)
  offline?: OfflineSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PosSettingsDto)
  pos?: PosSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ArcaSettingsDto)
  arca?: ArcaSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => StorefrontSettingsDto)
  storefront?: StorefrontSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PwaSettingsDto)
  pwa?: PwaSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => QrSettingsDto)
  qr?: QrSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LabelPrintingSettingsDto)
  labelPrinting?: LabelPrintingSettingsDto;
}

/**
 * These DTOs are intentionally permissive: the frontend sends the entire
 * `notifications` settings object. Validation is done in the service, not here.
 * `forbidNonWhitelisted: true` in the global pipe would cause a 400 for any
 * extra field, so we declare the full shape as optional.
 */

/**
 * Shared optional fields that may be sent when the UI posts the full
 * notifications object. Declared here so forbidNonWhitelisted does not 400.
 */
class TestNotificationContextDto {
  @IsOptional() @IsBoolean() notifyOnDelivery?: boolean;
  @IsOptional() @IsArray() @IsIn(NOTIFICATION_CHANNEL_VALUES, { each: true }) saleChannels?: Array<'EMAIL' | 'WHATSAPP' | 'SMS'>;
  @IsOptional() @IsArray() @IsIn(NOTIFICATION_CHANNEL_VALUES, { each: true }) purchaseChannels?: Array<'EMAIL' | 'WHATSAPP' | 'SMS'>;
  @IsOptional() @IsArray() @IsIn(NOTIFICATION_CHANNEL_VALUES, { each: true }) deliveryChannels?: Array<'EMAIL' | 'WHATSAPP' | 'SMS'>;
  @IsOptional() @IsArray() @IsIn(NOTIFICATION_CHANNEL_VALUES, { each: true }) lowStockChannels?: Array<'EMAIL' | 'WHATSAPP' | 'SMS'>;
  @IsOptional() @IsArray() @IsIn(NOTIFICATION_CHANNEL_VALUES, { each: true }) transferChannels?: Array<'EMAIL' | 'WHATSAPP' | 'SMS'>;
}

export class TestSmtpDto extends TestNotificationContextDto {
  @IsOptional() @IsString() recipient?: string;
  @IsOptional() @IsString() smtpHost?: string;
  @IsOptional() @Type(() => Number) @IsNumber() smtpPort?: number;
  @IsOptional() @IsString() smtpUser?: string;
  @IsOptional() @IsString() smtpPass?: string;
  // Extra fields from the full notifications object — ignored by the service
  @IsOptional() @IsBoolean() emailEnabled?: boolean;
  @IsOptional() @IsBoolean() smsEnabled?: boolean;
  @IsOptional() @IsBoolean() whatsappEnabled?: boolean;
  @IsOptional() @IsBoolean() pushEnabled?: boolean;
  @IsOptional() @Type(() => Number) @IsNumber() lowStockThreshold?: number;
  @IsOptional() @IsBoolean() notifyOnSale?: boolean;
  @IsOptional() @IsBoolean() notifyOnPurchase?: boolean;
  @IsOptional() @IsBoolean() notifyOnLowStock?: boolean;
  @IsOptional() @IsBoolean() notifyOnTransfer?: boolean;
  @IsOptional() @IsBoolean() notifyOnDelivery?: boolean;
  @IsOptional() @IsString()  smsGatewayUrl?: string;
  @IsOptional() @IsString()  evolutionApiUrl?: string;
  @IsOptional() @IsString()  evolutionApiKey?: string;
  @IsOptional() @IsString()  evolutionInstance?: string;
  @IsOptional() @IsString()  fcmServerKey?: string;
}

export class TestSmsDto extends TestNotificationContextDto {
  @IsOptional() @IsString() recipient?: string;
  @IsOptional() @IsString() smsGatewayUrl?: string;
  @IsOptional() @IsBoolean() emailEnabled?: boolean;
  @IsOptional() @IsBoolean() smsEnabled?: boolean;
  @IsOptional() @IsBoolean() whatsappEnabled?: boolean;
  @IsOptional() @IsBoolean() pushEnabled?: boolean;
  @IsOptional() @IsNumber()  lowStockThreshold?: number;
  @IsOptional() @IsBoolean() notifyOnSale?: boolean;
  @IsOptional() @IsBoolean() notifyOnPurchase?: boolean;
  @IsOptional() @IsBoolean() notifyOnLowStock?: boolean;
  @IsOptional() @IsBoolean() notifyOnTransfer?: boolean;
  @IsOptional() @IsBoolean() notifyOnDelivery?: boolean;
  @IsOptional() @IsString()  smtpHost?: string;
  @IsOptional() @Type(() => Number) @IsNumber() smtpPort?: number;
  @IsOptional() @IsString()  smtpUser?: string;
  @IsOptional() @IsString()  smtpPass?: string;
  @IsOptional() @IsString()  evolutionApiUrl?: string;
  @IsOptional() @IsString()  evolutionApiKey?: string;
  @IsOptional() @IsString()  evolutionInstance?: string;
  @IsOptional() @IsString()  fcmServerKey?: string;
}

export class TestWhatsappDto extends TestNotificationContextDto {
  @IsOptional() @IsString() recipient?: string;
  @IsOptional() @IsString() evolutionApiUrl?: string;
  @IsOptional() @IsString() evolutionApiKey?: string;
  @IsOptional() @IsString() evolutionInstance?: string;
  @IsOptional() @IsBoolean() emailEnabled?: boolean;
  @IsOptional() @IsBoolean() smsEnabled?: boolean;
  @IsOptional() @IsBoolean() whatsappEnabled?: boolean;
  @IsOptional() @IsBoolean() pushEnabled?: boolean;
  @IsOptional() @IsNumber()  lowStockThreshold?: number;
  @IsOptional() @IsBoolean() notifyOnSale?: boolean;
  @IsOptional() @IsBoolean() notifyOnPurchase?: boolean;
  @IsOptional() @IsBoolean() notifyOnLowStock?: boolean;
  @IsOptional() @IsBoolean() notifyOnTransfer?: boolean;
  @IsOptional() @IsBoolean() notifyOnDelivery?: boolean;
  @IsOptional() @IsString()  smtpHost?: string;
  @IsOptional() @Type(() => Number) @IsNumber() smtpPort?: number;
  @IsOptional() @IsString()  smtpUser?: string;
  @IsOptional() @IsString()  smtpPass?: string;
  @IsOptional() @IsString()  smsGatewayUrl?: string;
  @IsOptional() @IsString()  fcmServerKey?: string;
}

export class TestPushDto extends TestNotificationContextDto {
  @IsOptional() @IsString() recipient?: string;
  @IsOptional() @IsString() fcmServerKey?: string;
  @IsOptional() @IsBoolean() emailEnabled?: boolean;
  @IsOptional() @IsBoolean() smsEnabled?: boolean;
  @IsOptional() @IsBoolean() whatsappEnabled?: boolean;
  @IsOptional() @IsBoolean() pushEnabled?: boolean;
  @IsOptional() @IsNumber()  lowStockThreshold?: number;
  @IsOptional() @IsBoolean() notifyOnSale?: boolean;
  @IsOptional() @IsBoolean() notifyOnPurchase?: boolean;
  @IsOptional() @IsBoolean() notifyOnLowStock?: boolean;
  @IsOptional() @IsBoolean() notifyOnTransfer?: boolean;
  @IsOptional() @IsBoolean() notifyOnDelivery?: boolean;
  @IsOptional() @IsString()  smtpHost?: string;
  @IsOptional() @Type(() => Number) @IsNumber() smtpPort?: number;
  @IsOptional() @IsString()  smtpUser?: string;
  @IsOptional() @IsString()  smtpPass?: string;
  @IsOptional() @IsString()  smsGatewayUrl?: string;
  @IsOptional() @IsString()  evolutionApiUrl?: string;
  @IsOptional() @IsString()  evolutionApiKey?: string;
  @IsOptional() @IsString()  evolutionInstance?: string;
}
