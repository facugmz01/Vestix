import { Type } from 'class-transformer';
import { IsBoolean, IsEmail, IsIn, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';

export class GeneralSettingsDto {
  @IsOptional()
  @IsString()
  companyName: string;

  @IsOptional()
  @IsString()
  taxId: string;

  @IsOptional()
  @IsString()
  legalName: string;

  @IsOptional()
  @IsOptional()
  @IsString()
  address: string;

  @IsOptional()
  @IsOptional()
  @IsString()
  city: string;

  @IsOptional()
  @IsOptional()
  @IsString()
  province: string;

  @IsOptional()
  @IsOptional()
  @IsString()
  country: string;

  @IsOptional()
  @IsOptional()
  @IsString()
  phone: string;

  @IsOptional()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsOptional()
  @IsString()
  storefrontUrl?: string;

  @IsOptional()
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  timezone: string;

  @IsOptional()
  @IsString()
  locale: string;

  @IsOptional()
  @IsString()
  currency: string;
}

export class PricingSettingsDto {
  @IsOptional()
  @IsString()
  defaultPriceListId: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  vatDefaultPct: number;

  @IsOptional()
  @IsBoolean()
  allowManualDiscount: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  maxDiscountPct: number;

  @IsOptional()
  @IsIn(['NONE', 'NEAREST_10', 'UP', 'DOWN'])
  roundingRule: 'NONE' | 'NEAREST_10' | 'UP' | 'DOWN';

  @IsOptional()
  @IsBoolean()
  showPricesWithTax: boolean;
}

export class SkuBarcodeSettingsDto {
  @IsOptional()
  @IsString()
  skuPrefix: string;

  @IsOptional()
  @IsBoolean()
  skuAutoGenerate: boolean;

  @IsOptional()
  @IsIn(['EAN13', 'CODE128', 'QR', 'NONE'])
  barcodeFormat: 'EAN13' | 'CODE128' | 'QR' | 'NONE';

  @IsOptional()
  @IsBoolean()
  barcodeAutoGenerate: boolean;

  @IsOptional()
  @IsNumber()
  nextSkuSequence: number;
}

export class InvoicingSettingsDto {
  @IsOptional()
  @IsNumber()
  fiscalPointSale: number;

  @IsOptional()
  @IsIn(['homologation', 'production'])
  afipEnvironment: 'homologation' | 'production';

  @IsOptional()
  @IsIn(['FACTURA_B', 'FACTURA_A', 'FACTURA_C'])
  defaultInvoiceType: 'FACTURA_B' | 'FACTURA_A' | 'FACTURA_C';

  @IsOptional()
  @IsBoolean()
  autoIssueOnSale: boolean;

  @IsOptional()
  @IsOptional()
  @IsString()
  invoiceFooterText?: string;
}

export class NotificationSettingsDto {
  @IsOptional()
  @IsBoolean()
  emailEnabled: boolean;

  @IsOptional()
  @IsBoolean()
  smsEnabled: boolean;

  @IsOptional()
  @IsBoolean()
  whatsappEnabled: boolean;

  @IsOptional()
  @IsBoolean()
  pushEnabled: boolean;

  @IsOptional()
  @IsNumber()
  lowStockThreshold: number;

  @IsOptional()
  @IsBoolean()
  notifyOnSale: boolean;

  @IsOptional()
  @IsBoolean()
  notifyOnPurchase: boolean;

  @IsOptional()
  @IsBoolean()
  notifyOnLowStock: boolean;

  @IsOptional()
  @IsBoolean()
  notifyOnTransfer: boolean;

  @IsOptional()
  @IsOptional()
  @IsString()
  smtpHost?: string;

  @IsOptional()
  @IsOptional()
  @IsNumber()
  smtpPort?: number;

  @IsOptional()
  @IsOptional()
  @IsString()
  smtpUser?: string;

  @IsOptional()
  @IsOptional()
  @IsString()
  smtpPass?: string;

  @IsOptional()
  @IsOptional()
  @IsString()
  smsGatewayUrl?: string;

  @IsOptional()
  @IsOptional()
  @IsString()
  openWaUrl?: string;

  @IsOptional()
  @IsOptional()
  @IsString()
  openWaSession?: string;

  @IsOptional()
  @IsOptional()
  @IsString()
  fcmServerKey?: string;
}

export class IntegrationSettingsDto {
  @IsOptional()
  @IsBoolean()
  mercadopagoEnabled: boolean;

  @IsOptional()
  @IsBoolean()
  mercadolibreEnabled: boolean;

  @IsOptional()
  @IsBoolean()
  woocommerceEnabled: boolean;

  @IsOptional()
  @IsBoolean()
  shopifyEnabled: boolean;

  @IsOptional()
  @IsOptional()
  @IsString()
  mlAppId?: string;

  @IsOptional()
  @IsOptional()
  @IsString()
  mlSecretKey?: string;

  @IsOptional()
  @IsOptional()
  @IsString()
  shopifyStoreUrl?: string;

  @IsOptional()
  @IsOptional()
  @IsString()
  shopifyAccessToken?: string;

  @IsOptional()
  @IsOptional()
  @IsString()
  wooStoreUrl?: string;

  @IsOptional()
  @IsOptional()
  @IsString()
  wooConsumerKey?: string;

  @IsOptional()
  @IsOptional()
  @IsString()
  wooConsumerSecret?: string;
}

export class OfflineSettingsDto {
  @IsOptional()
  @IsBoolean()
  offlineModeEnabled: boolean;

  @IsOptional()
  @IsNumber()
  posOfflineTtlHours: number;

  @IsOptional()
  @IsNumber()
  maxQueueSize: number;

  @IsOptional()
  @IsBoolean()
  autoSyncOnReconnect: boolean;

  @IsOptional()
  @IsIn(['ASK_USER', 'SERVER_WINS', 'CLIENT_WINS'])
  conflictStrategy: 'ASK_USER' | 'SERVER_WINS' | 'CLIENT_WINS';
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
}
