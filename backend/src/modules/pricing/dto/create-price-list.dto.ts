import { IsString, IsNotEmpty, IsEnum, IsBoolean, IsOptional, IsNumber, IsDateString } from 'class-validator';
import { PriceListType } from '../models/price-list.model';

export class CreatePriceListDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(PriceListType)
  type: PriceListType;

  @IsString()
  @IsNotEmpty()
  currency: string;

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
}
