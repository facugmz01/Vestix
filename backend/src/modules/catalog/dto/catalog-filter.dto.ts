import { IsString, IsOptional, IsBoolean, IsArray, IsNumber } from 'class-validator';

export class CatalogFilterDto {
  @IsString()
  @IsOptional()
  searchQuery?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  brandId?: string;

  @IsBoolean()
  @IsOptional()
  inStockOnly?: boolean;

  @IsNumber()
  @IsOptional()
  minPrice?: number;

  @IsNumber()
  @IsOptional()
  maxPrice?: number;
  
  @IsArray()
  @IsOptional()
  attributes?: { key: string, value: string }[]; // Dynamic filtering, e.g., [{ key: 'Size', value: 'L' }]
}
