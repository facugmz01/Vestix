import { IsString, IsNotEmpty, IsNumber, IsOptional, IsUUID, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ScanBarcodeDto {
  @IsString()
  @IsNotEmpty()
  barcode: string;
}

export class QuickSaleDto {
  @IsUUID('4')
  @IsNotEmpty()
  cashRegisterId: string;

  @IsUUID('4')
  @IsNotEmpty()
  variantId: string;

  @IsUUID('4')
  @IsNotEmpty()
  categoryId: string;

  @IsUUID('4')
  @IsNotEmpty()
  accountId: string;

  @IsUUID('4')
  @IsOptional()
  cashShiftId?: string;
}

class CartLineDto {
  @IsUUID('4')
  @IsNotEmpty()
  variantId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @IsOptional()
  discountPct?: number;
}

export class CalculateCartDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartLineDto)
  lines: CartLineDto[];

  @IsNumber()
  @IsOptional()
  cartDiscountPct?: number;

  @IsUUID('4')
  @IsOptional()
  customerId?: string;
}

export class OpenSessionDto {
  @IsUUID('4')
  @IsNotEmpty()
  cashRegisterId: string;

  @IsNumber()
  @Min(0)
  openingAmount: number;

  @IsUUID('4')
  @IsNotEmpty()
  userId: string;
}

export class CloseSessionDto {
  @IsUUID('4')
  @IsNotEmpty()
  shiftId: string;

  @IsNumber()
  @Min(0)
  closingAmount: number;

  @IsUUID('4')
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
