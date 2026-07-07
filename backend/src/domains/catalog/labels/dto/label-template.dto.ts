import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsInt,
  IsIn,
  IsObject,
  IsArray,
  Min,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { LabelLayout } from '../label-layout.types';

export class CreateLabelTemplateDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsNumber()
  @Min(1)
  labelWidth!: number;

  @IsNumber()
  @Min(1)
  labelHeight!: number;

  @IsOptional()
  @IsIn(['ROLL', 'SHEET'])
  paperType?: 'ROLL' | 'SHEET';

  @IsOptional()
  @IsNumber()
  paperWidth?: number;

  @IsOptional()
  @IsNumber()
  paperHeight?: number;

  @IsOptional()
  @IsNumber()
  marginTop?: number;

  @IsOptional()
  @IsNumber()
  marginLeft?: number;

  @IsOptional()
  @IsNumber()
  rowGap?: number;

  @IsOptional()
  @IsNumber()
  colGap?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  colsPerRow?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  labelsPerSheet?: number;

  @IsOptional()
  @IsIn(['BASE', 'PRICE_LIST'])
  priceSource?: 'BASE' | 'PRICE_LIST';

  @IsOptional()
  @IsString()
  priceListId?: string;

  @IsOptional()
  @IsObject()
  layout?: LabelLayout;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  // Simplified form fields (converted to layout if layout not provided)
  @IsOptional()
  @IsBoolean()
  showStoreName?: boolean;

  @IsOptional()
  @IsBoolean()
  showProductName?: boolean;

  @IsOptional()
  @IsBoolean()
  showSizeColor?: boolean;

  @IsOptional()
  @IsBoolean()
  showBarcode?: boolean;

  @IsOptional()
  @IsBoolean()
  showPrice?: boolean;

  @IsOptional()
  @IsIn(['EAN13', 'CODE128', 'QR', 'NONE'])
  barcodeSymbology?: 'EAN13' | 'CODE128' | 'QR' | 'NONE';
}

export class UpdateLabelTemplateDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  labelWidth?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  labelHeight?: number;

  @IsOptional()
  @IsIn(['ROLL', 'SHEET'])
  paperType?: 'ROLL' | 'SHEET';

  @IsOptional()
  @IsNumber()
  paperWidth?: number;

  @IsOptional()
  @IsNumber()
  paperHeight?: number;

  @IsOptional()
  @IsNumber()
  marginTop?: number;

  @IsOptional()
  @IsNumber()
  marginLeft?: number;

  @IsOptional()
  @IsNumber()
  rowGap?: number;

  @IsOptional()
  @IsNumber()
  colGap?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  colsPerRow?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  labelsPerSheet?: number;

  @IsOptional()
  @IsIn(['BASE', 'PRICE_LIST'])
  priceSource?: 'BASE' | 'PRICE_LIST';

  @IsOptional()
  @IsString()
  priceListId?: string;

  @IsOptional()
  @IsObject()
  layout?: LabelLayout;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsBoolean()
  showStoreName?: boolean;

  @IsOptional()
  @IsBoolean()
  showProductName?: boolean;

  @IsOptional()
  @IsBoolean()
  showSizeColor?: boolean;

  @IsOptional()
  @IsBoolean()
  showBarcode?: boolean;

  @IsOptional()
  @IsBoolean()
  showPrice?: boolean;

  @IsOptional()
  @IsIn(['EAN13', 'CODE128', 'QR', 'NONE'])
  barcodeSymbology?: 'EAN13' | 'CODE128' | 'QR' | 'NONE';
}

export class PrintLabelsDto {
  @IsOptional()
  @IsString()
  templateId?: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class PrintItemDto {
  @IsString()
  variantId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class BulkPrintLabelsDto {
  @IsOptional()
  @IsString()
  templateId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrintItemDto)
  items!: PrintItemDto[];
}
