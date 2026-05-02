import { IsString, IsOptional, IsBoolean, IsInt } from 'class-validator';

export class UpdateBranchConfigDto {
  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  receiptHeader?: string;

  @IsOptional()
  @IsString()
  receiptFooter?: string;

  @IsOptional()
  @IsString()
  taxIdentifier?: string;

  @IsOptional()
  @IsInt()
  afipPointOfSale?: number;

  @IsOptional()
  @IsBoolean()
  isPosEnabled?: boolean;
}
