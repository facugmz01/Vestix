import {
  IsDateString,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CustomerType } from '../../dto/create-customer.dto';

export class IssueGiftCardCustomerDto {
  @IsEnum(CustomerType)
  @IsOptional()
  type?: CustomerType;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsOptional()
  @IsString()
  taxId?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class IssueGiftCardDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsString()
  issuedTo?: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => IssueGiftCardCustomerDto)
  newCustomer?: IssueGiftCardCustomerDto;

  @IsIn(['INCOME', 'EXPENSE'])
  fundingType: 'INCOME' | 'EXPENSE';

  @IsString()
  @IsNotEmpty()
  accountId: string;

  @IsOptional()
  @IsString()
  fundingNotes?: string;
}

export class RedeemGiftCardDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsNumber()
  @Min(0.01)
  amount: number;
}
