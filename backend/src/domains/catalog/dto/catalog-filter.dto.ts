import { IsString, IsOptional, IsBoolean, IsArray, IsNumber } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CatalogFilterDto {
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  searchQuery?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  q?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  query?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  sortBy?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  categoryId?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  brandId?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
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
  attributes?: { key: string; value: string }[]; // Dynamic filtering, e.g., [{ key: 'Size', value: 'L' }]

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  pageSize?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  /**
   * Helper to retrieve the active trimmed search query regardless of which param name was sent.
   */
  getResolvedSearchQuery(): string | undefined {
    return resolveSearchQuery(this);
  }
}

export function resolveSearchQuery(filters?: Partial<CatalogFilterDto>): string | undefined {
  if (!filters) return undefined;
  const raw = filters.searchQuery || filters.q || filters.query || filters.search;
  const trimmed = typeof raw === 'string' ? raw.trim() : undefined;
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}


