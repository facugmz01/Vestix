import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsString, IsUUID, Min } from 'class-validator';

export enum AdjustStockType {
  ADD = 'ADD',
  SUBTRACT = 'SUBTRACT',
  SET = 'SET',
}

export class AdjustStockDto {
  @IsUUID('4')
  @IsNotEmpty()
  variantId: string;

  @IsUUID('4')
  @IsNotEmpty()
  warehouseId: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  quantity: number;

  @IsEnum(AdjustStockType)
  type: AdjustStockType;

  @IsString()
  @IsNotEmpty()
  reason: string;
}
