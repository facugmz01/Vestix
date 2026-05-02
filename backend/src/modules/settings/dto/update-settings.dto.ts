import { IsString, IsBoolean, IsNumber, IsOptional, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

class StoreSettingsDto {
  @IsString() name: string;
  @IsString() legalName: string;
  @IsString() cuit: string;
  @IsString() currency: string;
  @IsString() timezone: string;
  @IsString() @IsOptional() logoUrl?: string;
}

class SkuSettingsDto {
  @IsString() prefix: string;
  @IsBoolean() includeCategory: boolean;
  @IsBoolean() includeBrand: boolean;
  @IsBoolean() includeColor: boolean;
  @IsBoolean() includeSize: boolean;
  @IsString() separator: string;
  @IsBoolean() uppercased: boolean;
}

class BarcodeSettingsDto {
  @IsString() companyPrefix: string;
  @IsBoolean() autoGenerate: boolean;
}

class PricingSettingsDto {
  @IsNumber() @Min(0) @Max(1) defaultVatRate: number;
  @IsNumber() @Min(0) @Max(1) defaultMarginTarget: number;
  @IsBoolean() allowNegativeMargin: boolean;
  @IsNumber() @Min(0) roundToNearest: number;
  @IsString() defaultRetailPriceListId: string;
  @IsString() @IsOptional() defaultWholesalePriceListId?: string;
}

class InventorySettingsDto {
  @IsBoolean() allowNegativeStock: boolean;
  @IsNumber() @Min(0) defaultReorderPoint: number;
  @IsNumber() @Min(1) reservationTtlMinutes: number;
}

class OfflineSettingsDto {
  @IsNumber() @Min(1) maxOfflineHours: number;
  @IsBoolean() requireManagerPinForReturns: boolean;
  @IsBoolean() requireManagerPinForDiscounts: boolean;
}

export class UpdateSettingsDto {
  @ValidateNested() @Type(() => StoreSettingsDto) @IsOptional() store?: StoreSettingsDto;
  @ValidateNested() @Type(() => SkuSettingsDto) @IsOptional() sku?: SkuSettingsDto;
  @ValidateNested() @Type(() => BarcodeSettingsDto) @IsOptional() barcode?: BarcodeSettingsDto;
  @ValidateNested() @Type(() => PricingSettingsDto) @IsOptional() pricing?: PricingSettingsDto;
  @ValidateNested() @Type(() => InventorySettingsDto) @IsOptional() inventory?: InventorySettingsDto;
  @ValidateNested() @Type(() => OfflineSettingsDto) @IsOptional() offline?: OfflineSettingsDto;
}
