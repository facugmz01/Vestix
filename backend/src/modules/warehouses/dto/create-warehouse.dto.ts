import { IsString, IsNotEmpty, IsEnum, IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { WarehouseType } from '../models/warehouse.model';

export class CreateWarehouseDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsEnum(WarehouseType)
  type: WarehouseType;

  // The critical link to the Branches module
  @IsOptional()
  @IsUUID('4')
  branchId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
