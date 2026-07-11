import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class RedeemLoyaltyPointsDto {
  @IsUUID('4')
  @IsNotEmpty()
  customerId: string;

  @IsInt()
  @Min(1)
  points: number;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class AdjustLoyaltyPointsDto {
  @IsUUID('4')
  @IsNotEmpty()
  customerId: string;

  @IsInt()
  points: number;

  @IsOptional()
  @IsString()
  tier?: string;
}
