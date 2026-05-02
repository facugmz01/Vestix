import { IsString, IsNotEmpty, IsBoolean, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class BranchConfigDto {
  @IsString()
  @IsNotEmpty()
  timezone: string;

  @IsBoolean()
  isPosEnabled: boolean;

  @IsOptional()
  @IsString()
  taxIdentifier?: string;
}

export class CreateBranchDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ValidateNested()
  @Type(() => BranchConfigDto)
  @IsOptional()
  config?: BranchConfigDto;
}
