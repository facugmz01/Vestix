import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class BulkProductRowDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  brand?: string;

  @IsNumber()
  @IsOptional()
  costPrice?: number;

  @IsNumber()
  @IsOptional()
  basePrice?: number;

  @IsNumber()
  @IsOptional()
  initialStock?: number;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  variant?: string;

  @IsEnum(['overwrite', 'skip'])
  @IsOptional()
  resolution?: 'overwrite' | 'skip';
}

export class BulkValidateDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkProductRowDto)
  rows: BulkProductRowDto[];
}

export class BulkImportDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkProductRowDto)
  rows: BulkProductRowDto[];
}
