import { IsString, IsNotEmpty, IsEnum, IsArray, ValidateNested, IsNumber, IsOptional, IsUUID, Min, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../models/order.model';

class UpdateQuotationLineDto {
  @IsUUID('4')
  @IsNotEmpty()
  variantId: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @IsOptional()
  discountPct?: number;

  @IsNumber()
  @IsOptional()
  unitPriceOverride?: number;

  @IsNumber()
  @IsOptional()
  customUnitPrice?: number;

  @IsString()
  @IsOptional()
  discountType?: 'PERCENTAGE' | 'FIXED';

  @IsNumber()
  @IsOptional()
  discountValue?: number;
}

export class UpdateQuotationDto {
  @IsUUID('4')
  @IsOptional()
  warehouseId?: string;

  @ValidateIf((_, v) => v !== null && v !== undefined && v !== '')
  @IsUUID('4')
  @IsOptional()
  customerId?: string | null;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateQuotationLineDto)
  lines: UpdateQuotationLineDto[];

  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @IsNumber()
  @IsOptional()
  posGrandTotal?: number;

  @IsNumber()
  @IsOptional()
  cartDiscountTotal?: number;

  @IsString()
  @IsOptional()
  globalDiscountType?: 'PERCENTAGE' | 'FIXED';

  @IsNumber()
  @IsOptional()
  globalDiscountValue?: number;
}
