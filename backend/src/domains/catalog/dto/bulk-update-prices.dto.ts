import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class BulkUpdatePricesDto {
  @IsOptional()
  @Transform(({ value }) => (!value || value === '' || value === 'ALL' ? undefined : value))
  @IsUUID('4')
  categoryId?: string;

  @IsOptional()
  @Transform(({ value }) => (!value || value === '' || value === 'ALL' ? undefined : value))
  @IsUUID('4')
  brandId?: string;

  @IsOptional()
  @Transform(({ value }) => (!value || value === '' || value === 'BASE' || value === 'DEFAULT' ? undefined : value))
  @IsUUID('4')
  priceListId?: string;

  @IsNumber()
  percentage: number;

  @IsOptional()
  @IsString()
  rounding?: 'none' | 'round' | 'ceil' | 'floor';
}
