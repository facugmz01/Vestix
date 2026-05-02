import { IsString, IsNotEmpty, IsEnum, IsOptional, IsEmail, IsNumber, Min } from 'class-validator';
import { CustomerType } from '../models/customer.model';

export class CreateCustomerDto {
  @IsEnum(CustomerType)
  type: CustomerType;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsOptional()
  taxId?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  creditLimit?: number;
}
