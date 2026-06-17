import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';

export class ReceiveGoodsLineDto {
  @IsUUID()
  @IsNotEmpty()
  variantId: string;

  @IsNumber()
  @Min(1)
  receivedQuantity: number;

  @IsString()
  @IsOptional()
  batchId?: string; // Optional batch tracking on receipt
}

export class ReceiveGoodsDto {
  @IsUUID()
  @IsNotEmpty()
  purchaseOrderId: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => ReceiveGoodsLineDto)
  lines: ReceiveGoodsLineDto[];
}
