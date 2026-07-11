import {
  IsDateString,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CustomerType } from '../../dto/create-customer.dto';

export class IssueGiftCardCustomerDto {
  @IsEnum(CustomerType)
  @IsOptional()
  type?: CustomerType;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsOptional()
  @IsString()
  taxId?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

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

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => IssueGiftCardCustomerDto)
  newCustomer?: IssueGiftCardCustomerDto;

  @IsIn(['INCOME', 'EXPENSE'])
  fundingType: 'INCOME' | 'EXPENSE';

  @IsString()
  @IsNotEmpty()
  accountId: string;

  @IsOptional()
  @IsString()
  fundingNotes?: string;
}

export class RedeemGiftCardDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsNumber()
  @Min(0.01)
  amount: number;
}

export class GiftCardTemplateSettingsDto {
  @IsOptional() @IsString() brandLabel?: string;
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() subtitle?: string;
  @IsOptional() @IsString() backgroundColor?: string;
  @IsOptional() @IsString() backgroundGradientEnd?: string;
  @IsOptional() useGradient?: boolean;
  @IsOptional() @IsString() textColor?: string;
  @IsOptional() @IsString() accentColor?: string;
  @IsOptional() @IsNumber() cardWidthMm?: number;
  @IsOptional() @IsNumber() cardHeightMm?: number;
  @IsOptional() @IsNumber() borderRadiusPx?: number;
  @IsOptional() @IsIn(['sans-serif', 'serif', 'monospace']) fontFamily?: 'sans-serif' | 'serif' | 'monospace';
  @IsOptional() @IsNumber() amountFontSizePx?: number;
  @IsOptional() showLogo?: boolean;
  @IsOptional() @IsString() logoUrl?: string;
  @IsOptional() showQr?: boolean;
  @IsOptional() @IsNumber() qrSizePx?: number;
  @IsOptional() showRecipient?: boolean;
  @IsOptional() showExpiry?: boolean;
  @IsOptional() showCode?: boolean;
  @IsOptional() @IsString() footerText?: string;
  @IsOptional() @IsNumber() paperMarginMm?: number;
}

export class UpdateGiftCardTemplateDto {
  @ValidateNested()
  @Type(() => GiftCardTemplateSettingsDto)
  template: GiftCardTemplateSettingsDto;
}
