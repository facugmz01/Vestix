import { IsOptional, IsString, Length } from 'class-validator';

export class CompleteDeliveryDto {
  @IsString()
  @Length(6, 6)
  otp: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
