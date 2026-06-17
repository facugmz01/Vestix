import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddBarcodeDto {
  @IsString()
  @IsNotEmpty()
  barcode: string;

  @IsString()
  @IsOptional()
  @IsIn(['INTERNAL', 'MANUFACTURER'])
  type?: string;
}
