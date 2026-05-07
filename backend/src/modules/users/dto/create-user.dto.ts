import { IsEmail, IsString, IsNotEmpty, IsOptional, IsEnum, IsArray, IsUUID, IsBoolean } from 'class-validator';

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  STORE_MANAGER = 'STORE_MANAGER',
  CASHIER = 'CASHIER',
  WAREHOUSE_OPERATOR = 'WAREHOUSE_OPERATOR',
}

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  @IsNotEmpty()
  role: string;

  @IsUUID('4')
  @IsOptional()
  branchId?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
