import { IsString, IsNotEmpty, IsEnum, IsBoolean, IsOptional, IsNumber, IsDateString, Min } from 'class-validator';
import { PriceListType } from '../models/price-list.model';

export class CreatePriceListDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsOptional()
  type?: any; // Allow any type from frontend (BASE | MODIFIER) but it maps to RETAIL/etc internally

  @IsString()
  @IsOptional()
  currency?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  margin?: number;

  @IsOptional()
  @IsBoolean()
  isPercentageBased?: boolean;

  @IsOptional()
  @IsNumber()
  percentageDiscount?: number;

  @IsOptional()
  @IsNumber()
  modifierPercentage?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @IsOptional()
  @IsDateString()
  validTo?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
