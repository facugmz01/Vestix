import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber, IsEnum, IsObject, IsDateString } from 'class-validator';

export enum PromotionTypeDto {
  PERCENTAGE_DISCOUNT = 'PERCENTAGE_DISCOUNT',
  FIXED_DISCOUNT = 'FIXED_DISCOUNT',
  BOGO = 'BOGO',
  BULK_DISCOUNT = 'BULK_DISCOUNT',
  CART_TOTAL_DISCOUNT = 'CART_TOTAL_DISCOUNT',
  CATEGORY_DISCOUNT = 'CATEGORY_DISCOUNT',
}

export class CreatePromotionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(PromotionTypeDto)
  type: PromotionTypeDto;

  @IsNumber()
  value: number;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsObject()
  applicableTo?: {
    type: 'ALL' | 'CATEGORY' | 'BRAND' | 'PRODUCT';
    ids?: string[];
  };
}

export class UpdatePromotionDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(PromotionTypeDto)
  type?: PromotionTypeDto;

  @IsOptional()
  @IsNumber()
  value?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsObject()
  applicableTo?: {
    type: 'ALL' | 'CATEGORY' | 'BRAND' | 'PRODUCT';
    ids?: string[];
  };
}

export class BulkPromotionUpdateDto {
  @IsOptional()
  @IsString()
  promotionId?: string;

  @IsOptional()
  @IsString()
  priceListId?: string;

  @IsString()
  action: 'APPLY_PROMO' | 'APPLY_PRICE_LIST_MODIFIER' | 'FLATTEN_PRICES';
}
