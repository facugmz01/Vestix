import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';

export class TransferLineDto {
  @IsUUID()
  @IsNotEmpty()
  variantId: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateTransferDto {
  @IsUUID()
  @IsNotEmpty()
  sourceWarehouseId: string;

  @IsUUID()
  @IsNotEmpty()
  destinationWarehouseId: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => TransferLineDto)
  lines: TransferLineDto[];
}

export class ReceiveTransferLineDto {
  @IsUUID()
  @IsNotEmpty()
  variantId: string;

  @IsNumber()
  @Min(0)
  receivedQuantity: number;
}

export class ReceiveTransferDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => ReceiveTransferLineDto)
  lines: ReceiveTransferLineDto[];
}
