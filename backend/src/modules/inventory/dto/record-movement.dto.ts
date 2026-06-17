import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { MovementType } from '../enums/movement-type.enum';

export class RecordMovementDto {
  @IsUUID()
  @IsNotEmpty()
  variantId: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  quantity: number;

  @IsEnum(MovementType)
  @IsNotEmpty()
  type: MovementType;

  @IsNumber()
  @IsOptional()
  unitCost?: number;

  @IsUUID()
  @IsOptional()
  sourceWarehouseId?: string;

  @IsUUID()
  @IsOptional()
  destinationWarehouseId?: string;

  @IsString()
  @IsOptional()
  referenceId?: string;

  @IsUUID()
  @IsOptional()
  batchId?: string;
}
