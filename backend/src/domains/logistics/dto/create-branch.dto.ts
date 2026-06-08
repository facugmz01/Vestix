import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsObject } from 'class-validator';

export class CreateBranchDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isMain?: boolean;

  // Frontend sends settings as a flat object
  @IsOptional()
  @IsObject()
  settings?: {
    taxId?: string;
    posReceiptHeader?: string;
    posReceiptFooter?: string;
  };

  // Also accept legacy config shape
  @IsOptional()
  @IsObject()
  config?: {
    timezone?: string;
    isPosEnabled?: boolean;
    taxIdentifier?: string;
  };
}
