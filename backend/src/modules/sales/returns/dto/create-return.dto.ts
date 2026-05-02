import { IsString, IsNotEmpty, IsEnum, IsArray, ValidateNested, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum ReturnAction {
  REFUND = 'REFUND',
  EXCHANGE = 'EXCHANGE',
  STORE_CREDIT = 'STORE_CREDIT'
}

export enum ReturnCondition {
  NEW = 'NEW',
  DEFECTIVE = 'DEFECTIVE',
  USED = 'USED'
}

class CreateReturnItemDto {
  @IsUUID('4')
  @IsNotEmpty()
  orderLineId: string;

  @IsUUID('4')
  @IsNotEmpty()
  variantId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsEnum(ReturnCondition)
  condition: ReturnCondition;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class CreateReturnDto {
  @IsUUID('4')
  @IsNotEmpty()
  saleOrderId: string;

  @IsUUID('4')
  @IsNotEmpty()
  branchId: string;

  @IsEnum(ReturnAction)
  action: ReturnAction;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateReturnItemDto)
  items: CreateReturnItemDto[];
}
