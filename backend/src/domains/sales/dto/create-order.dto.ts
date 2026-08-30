import { IsString, IsNotEmpty, IsEnum, IsArray, ValidateNested, IsNumber, IsOptional, IsUUID, Min, IsBoolean, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderSource, PaymentMethod } from '../models/order.model';
// Removed @shared/types to prevent TS5011 rootDir compilation issues
interface SharedCreateSaleDto { id: string; }
interface CreateSaleLineDto { variantId: string; }

class OrderLineDto implements CreateSaleLineDto {
  @IsUUID('4')
  @IsNotEmpty()
  variantId: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @IsOptional()
  discountPct?: number;

  @IsNumber()
  @IsOptional()
  unitPriceOverride?: number;
}

export class PaymentSplitDto {
  @IsString()
  @IsNotEmpty()
  method: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  @IsOptional()
  reference?: string;
}

export class GiftCardRedemptionDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsNumber()
  @Min(0.01)
  amount: number;
}

export class FiscalCustomerDto {
  @IsString()
  @IsOptional()
  taxId?: string;

  @IsString()
  @IsOptional()
  docType?: 'CUIT' | 'CUIL' | 'DNI';

  @IsString()
  @IsOptional()
  businessName?: string;

  @IsString()
  @IsOptional()
  taxCondition?: string;

  @IsString()
  @IsOptional()
  fiscalAddress?: string;
}

export class LoyaltyRedemptionDto {
  @IsInt()
  @Min(1)
  points: number;
}

export class CreateOrderDto implements SharedCreateSaleDto {
  @IsUUID('4')
  @IsNotEmpty()
  id: string; // MANDATORY from client for Idempotency

  @IsUUID('4')
  @IsNotEmpty()
  branchId: string;

  @IsUUID('4')
  @IsOptional()
  warehouseId?: string; // Where the physical stock is being pulled from

  @IsEnum(OrderSource)
  source: OrderSource;

  @IsUUID('4')
  @IsOptional()
  customerId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderLineDto)
  lines: OrderLineDto[];

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsUUID('4')
  @IsOptional()
  paymentAccountId?: string; // Required for Cash/Card, skipped for Customer Credit
  
  @IsString()
  @IsOptional()
  status?: string; // COMPLETED | QUOTE

  @IsString()
  @IsOptional()
  createdAtIso?: string; // Used to retain the accurate offline POS timestamp

  @IsNumber()
  @IsOptional()
  posGrandTotal?: number; // Offline POS calculated total, critical for PriceVariance tracking

  @IsNumber()
  @IsOptional()
  cartDiscountTotal?: number; // Manual cart-level discount amount (excludes line discounts & promotions)

  @IsBoolean()
  @IsOptional()
  wasReserved?: boolean; // Flag to determine if the stock should deduct from 'available' or 'reserved' quantities

  @IsUUID('4')
  @IsOptional()
  cashShiftId?: string; // Link to the active POS session/shift

  @IsBoolean()
  @IsOptional()
  issueInvoice?: boolean;

  @IsBoolean()
  @IsOptional()
  emitInvoice?: boolean;

  @IsString()
  @IsOptional()
  invoiceType?: string; // 'FACTURA_A', 'FACTURA_B', 'FACTURA_C', etc.

  @IsOptional()
  @ValidateNested()
  @Type(() => FiscalCustomerDto)
  fiscalCustomerData?: FiscalCustomerDto;

  @IsString()
  @IsOptional()
  paymentReference?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PaymentSplitDto)
  payments?: PaymentSplitDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => GiftCardRedemptionDto)
  giftCardRedemption?: GiftCardRedemptionDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LoyaltyRedemptionDto)
  loyaltyRedemption?: LoyaltyRedemptionDto;
}

export class EmitOrderInvoiceDto {
  @IsOptional()
  @IsString()
  invoiceType?: string; // 'FACTURA_A', 'FACTURA_B', 'FACTURA_C', etc.

  @IsOptional()
  @ValidateNested()
  @Type(() => FiscalCustomerDto)
  fiscalCustomerData?: FiscalCustomerDto;
}

