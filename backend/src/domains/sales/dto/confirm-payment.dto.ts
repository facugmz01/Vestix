import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ConfirmPaymentDto {
  @IsString()
  @IsOptional()
  @MaxLength(120)
  paymentReference?: string;
}
