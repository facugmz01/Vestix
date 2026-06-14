import { Type } from 'class-transformer';
import { IsBoolean, IsEmail, IsIn, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';

export class GeneralSettingsDto {
  @IsString()
  companyName: string;

  @IsString()
  taxId: string;

  @IsString()
  legalName: string;

  @IsOptional()
  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  city: string;

  @IsOptional()
  @IsString()
  province: string;

  @IsOptional()
  @IsString()
  country: string;

  @IsOptional()
  @IsString()
  phone: string;

  @IsOptional()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  storefrontUrl?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsString()
  timezone: string;

  @IsString()
  locale: string;

  @IsString()
  currency: string;
}

export class PricingSettingsDto {
  @IsString()
  defaultPriceListId: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  vatDefaultPct: number;

  @IsBoolean()
  allowManualDiscount: boolean;

  @IsNumber()
  @Min(0)
  @Max(100)
  maxDiscountPct: number;

  @IsIn(['NONE', 'NEAREST_10', 'UP', 'DOWN'])
  roundingRule: 'NONE' | 'NEAREST_10' | 'UP' | 'DOWN';

  @IsBoolean()
  showPricesWithTax: boolean;
}

export class SkuBarcodeSettingsDto {
  @IsString()
  skuPrefix: string;

  @IsBoolean()
  skuAutoGenerate: boolean;

  @IsIn(['EAN13', 'CODE128', 'QR', 'NONE'])
  barcodeFormat: 'EAN13' | 'CODE128' | 'QR' | 'NONE';

  @IsBoolean()
  barcodeAutoGenerate: boolean;

  @IsNumber()
  nextSkuSequence: number;
}

export class InvoicingSettingsDto {
  @IsNumber()
  fiscalPointSale: number;

  @IsIn(['homologation', 'production'])
  afipEnvironment: 'homologation' | 'production';

  @IsIn(['FACTURA_B', 'FACTURA_A', 'FACTURA_C'])
  defaultInvoiceType: 'FACTURA_B' | 'FACTURA_A' | 'FACTURA_C';

  @IsBoolean()
  autoIssueOnSale: boolean;

  @IsOptional()
  @IsString()
  invoiceFooterText?: string;
}

export class NotificationSettingsDto {
  @IsBoolean()
  emailEnabled: boolean;

  @IsBoolean()
  smsEnabled: boolean;

  @IsBoolean()
  whatsappEnabled: boolean;

  @IsBoolean()
  pushEnabled: boolean;

  @IsNumber()
  lowStockThreshold: number;

  @IsBoolean()
  notifyOnSale: boolean;

  @IsBoolean()
  notifyOnPurchase: boolean;

  @IsBoolean()
  notifyOnLowStock: boolean;

  @IsBoolean()
  notifyOnTransfer: boolean;

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
  openWaUrl?: string;

  @IsOptional()
  @IsString()
  openWaSession?: string;

  @IsOptional()
  @IsString()
  fcmServerKey?: string;
}

export class IntegrationSettingsDto {
  @IsBoolean()
  mercadopagoEnabled: boolean;

  @IsBoolean()
  mercadolibreEnabled: boolean;

  @IsBoolean()
  woocommerceEnabled: boolean;

  @IsBoolean()
  shopifyEnabled: boolean;

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
  @IsBoolean()
  offlineModeEnabled: boolean;

  @IsNumber()
  posOfflineTtlHours: number;

  @IsNumber()
  maxQueueSize: number;

  @IsBoolean()
  autoSyncOnReconnect: boolean;

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
