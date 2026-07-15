import { IsString, IsNotEmpty, IsEnum, IsOptional, IsNumber, Min, IsBoolean, IsUUID } from 'class-validator';
import { AccountType } from '../models/account.model';

export class CreateAccountDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(AccountType)
  type: AccountType;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsUUID('4')
  branchId?: string;

  /** Saldo inicial (se registra como DEBIT de apertura si > 0) */
  @IsOptional()
  @IsNumber()
  @Min(0)
  initialBalance?: number;
}

export class UpdateAccountDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsEnum(AccountType)
  type?: AccountType;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsUUID('4')
  branchId?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
