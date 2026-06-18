import { IsString, IsOptional, IsBoolean, IsArray, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CatalogFilterDto {
  @IsString()
  @IsOptional()
  searchQuery?: string;

  @IsString()
  @IsOptional()
  sortBy?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  brandId?: string;

  @IsString()
  @IsOptional()
  brand?: string;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  inStockOnly?: boolean;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  minPrice?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  maxPrice?: number;
  
  @IsArray()
  @IsOptional()
  attributes?: { key: string, value: string }[]; // Dynamic filtering, e.g., [{ key: 'Size', value: 'L' }]

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  pageSize?: number;
}
