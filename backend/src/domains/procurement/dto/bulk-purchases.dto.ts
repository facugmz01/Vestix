import { IsArray, ValidateNested, IsString, IsNumber, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class BulkPurchaseRowDto {
  @IsString()
  orderId: string;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  supplierIdentifier?: string;

  @IsString()
  sku: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unitCost: number;

  @IsOptional()
  @IsString()
  paymentStatus?: string;
}

export class BulkImportPurchasesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkPurchaseRowDto)
  rows: BulkPurchaseRowDto[];

  @IsBoolean()
  updateStock: boolean;

  @IsEnum(['PAID_CASH', 'CURRENT_ACCOUNT', 'FROM_CSV'])
  paymentResolution: 'PAID_CASH' | 'CURRENT_ACCOUNT' | 'FROM_CSV';

  @IsString()
  warehouseId: string;
}
