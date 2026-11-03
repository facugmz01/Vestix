import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';

export class AddCreditBalanceDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  financialAccountId?: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
