import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested, IsEnum } from 'class-validator';

export class SaleLineDto {
  @IsUUID()
  @IsNotEmpty()
  variantId: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  unitPriceOverride?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  discountPct?: number;
}

export class CreateSaleDto {
  @IsUUID()
  @IsOptional()
  id?: string;

  @IsUUID()
  @IsNotEmpty()
  branchId: string;

  @IsUUID()
  @IsNotEmpty()
  warehouseId: string; // The warehouse from which stock is deducted

  @IsUUID()
  @IsOptional()
  customerId?: string;

  @IsOptional()
  source?: 'POS' | 'ECOMMERCE' | 'BACKOFFICE';

  @IsOptional()
  paymentMethod?: 'CASH' | 'CREDIT_CARD' | 'CUSTOMER_CREDIT' | 'BANK_TRANSFER' | 'MULTIPLE' | 'MIXED';

  @IsOptional()
  paymentAccountId?: string;

  @IsOptional()
  cashShiftId?: string; // used by frontend sometimes or extracted from active shift

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  createdAtIso?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  posGrandTotal?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  cartDiscountTotal?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => SaleLineDto)
  lines: SaleLineDto[];
}
