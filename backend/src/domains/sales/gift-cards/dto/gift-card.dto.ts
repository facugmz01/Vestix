import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class IssueGiftCardDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsString()
  issuedTo?: string;
}

export class RedeemGiftCardDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsNumber()
  @Min(0.01)
  amount: number;
}
