import { IsString, IsNotEmpty, IsOptional, IsEmail, IsNumber, IsEnum, IsBoolean, ValidateIf } from 'class-validator';

export enum CustomerType {
  INDIVIDUAL = 'INDIVIDUAL',
  BUSINESS = 'BUSINESS',
}

export class CreateCustomerDto {
  @IsEnum(CustomerType)
  @IsOptional()
  type?: CustomerType;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsOptional()
  @IsString()
  @ValidateIf(o => o.taxId !== '' && o.taxId !== null)
  taxId?: string;

  @IsOptional()
  @IsEmail()
  @ValidateIf(o => o.email !== '' && o.email !== null)
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsNumber()
  initialCreditLimit?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  @ValidateIf(o => o.priceListId !== '' && o.priceListId !== null)
  priceListId?: string;
}
