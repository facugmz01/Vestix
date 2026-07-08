import { IsOptional, IsString, MinLength } from 'class-validator';

export class DispatchDeliveryDto {
  @IsString()
  @MinLength(1)
  driverName: string;

  @IsOptional()
  @IsString()
  driverPhone?: string;

  @IsOptional()
  @IsString()
  courierName?: string;

  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
