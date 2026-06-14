import { IsNumber, IsOptional, IsUUID } from 'class-validator';

export class BulkUpdatePricesDto {
  @IsOptional()
  @IsUUID('4')
  categoryId?: string;

  @IsOptional()
  @IsUUID('4')
  brandId?: string;

  @IsNumber()
  percentage: number;
}
