import { IsOptional, IsString, MinLength, IsIn } from 'class-validator';

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
  @IsIn(['PROPIO', 'ANDREANI', 'MERCADO_ENVIOS'])
  carrierType?: 'PROPIO' | 'ANDREANI' | 'MERCADO_ENVIOS';

  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
