import { IsString, IsNotEmpty, IsOptional, IsEmail, IsNumber, IsEnum, IsBoolean } from 'class-validator';

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
  taxId?: string;

  @IsOptional()
  @IsEmail()
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
}
