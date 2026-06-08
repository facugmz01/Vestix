import { IsString, IsNotEmpty, IsEnum, IsBoolean, IsOptional, IsNumber, IsDateString, Min } from 'class-validator';
import { PriceListType } from '../models/price-list.model';

export class CreatePriceListDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(PriceListType)
  @IsOptional()
  type?: PriceListType;

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
  @IsDateString()
  validFrom?: string;

  @IsOptional()
  @IsDateString()
  validTo?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
