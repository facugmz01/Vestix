import { IsString, IsNotEmpty, IsOptional, IsEmail, IsNumber, ValidateIf } from 'class-validator';

export class CreateSupplierDto {
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @IsOptional()
  @IsString()
  contactName?: string;

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
  initialBalance?: number;

  @IsOptional()
  @IsString()
  currency?: string;
}
