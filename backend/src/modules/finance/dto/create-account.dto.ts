import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { AccountType } from '../models/account.model';

export class CreateAccountDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(AccountType)
  type: AccountType;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsString()
  @IsOptional()
  branchId?: string; // Required if creating a CASH register
}
