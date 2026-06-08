import { IsString, IsNotEmpty, IsArray, ValidateNested, IsNumber, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

class POLineItemDto {
  @IsUUID('4')
  @IsNotEmpty()
  variantId: string;

  @IsNumber()
  @Min(1)
  orderedQuantity: number;

  @IsNumber()
  @Min(0.01)
  unitCost: number;
}

export class CreatePurchaseOrderDto {
  @IsUUID('4')
  @IsNotEmpty()
  supplierId: string;

  @IsUUID('4')
  @IsNotEmpty()
  destinationWarehouseId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => POLineItemDto)
  lines: POLineItemDto[];
}

class POReceiptLineDto {
  @IsUUID('4')
  @IsNotEmpty()
  lineItemId: string; // The specific PO line ID being received

  @IsNumber()
  @Min(1)
  receivedQuantity: number;
}

export class ReceivePurchaseOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => POReceiptLineDto)
  receipts: POReceiptLineDto[]; // Allows receiving multiple lines at once, completely or partially
}
