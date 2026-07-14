import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsNumber,
  IsUUID,
  Min,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class POLineItemDto {
  @IsUUID('4')
  @IsNotEmpty()
  variantId: string;

  @IsNumber()
  @Min(1)
  orderedQuantity: number;

  @IsNumber()
  @Min(0)
  unitCost: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;
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

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  shippingCost?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsString()
  expectedDeliveryDate?: string;

  @IsOptional()
  @IsString()
  currency?: string;
}

export class UpdatePurchaseOrderDto {
  @IsOptional()
  @IsUUID('4')
  destinationWarehouseId?: string;

  @IsOptional()
  @IsUUID('4')
  warehouseId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => POLineItemDto)
  lines?: POLineItemDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  shippingCost?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsString()
  expectedDeliveryDate?: string;
}

export class DirectPurchaseLineDto {
  @IsUUID('4')
  @IsNotEmpty()
  variantId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitCost: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;
}

export class ProcessDirectPurchaseDto {
  @IsUUID('4')
  @IsNotEmpty()
  supplierId: string;

  @IsUUID('4')
  @IsNotEmpty()
  warehouseId: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DirectPurchaseLineDto)
  lines: DirectPurchaseLineDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  shippingCost?: number;

  @IsOptional()
  @IsUUID('4')
  paymentAccountId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  paymentAmount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  paymentReference?: string;
}

export class IssuePurchaseOrderDto {
  @IsOptional()
  @IsUUID('4')
  paymentAccountId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  paymentAmount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  paymentReference?: string;
}

export class RegisterPurchasePaymentDto {
  @IsUUID('4')
  @IsNotEmpty()
  paymentAccountId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  paymentReference?: string;
}

class POReceiptLineDto {
  @IsUUID('4')
  @IsNotEmpty()
  lineItemId: string;

  @IsNumber()
  @Min(1)
  receivedQuantity: number;
}

export class ReceivePurchaseOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => POReceiptLineDto)
  receipts: POReceiptLineDto[];
}
