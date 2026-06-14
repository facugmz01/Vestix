import { IsArray, ValidateNested, IsString, IsNumber, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class BulkSaleRowDto {
  @IsString()
  orderId: string;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  customerIdentifier?: string;

  @IsString()
  sku: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unitPrice: number;

  @IsOptional()
  @IsString()
  paymentStatus?: string;
}

export class BulkImportSalesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkSaleRowDto)
  rows: BulkSaleRowDto[];

  @IsBoolean()
  updateStock: boolean;

  @IsEnum(['PAID_CASH', 'CURRENT_ACCOUNT', 'FROM_CSV'])
  paymentResolution: 'PAID_CASH' | 'CURRENT_ACCOUNT' | 'FROM_CSV';

  @IsString()
  branchId: string;
}
