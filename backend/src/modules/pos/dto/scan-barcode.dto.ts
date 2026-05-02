import { IsString, IsNotEmpty } from 'class-validator';

export class ScanBarcodeDto {
  @IsString()
  @IsNotEmpty()
  barcode: string; // The raw 13-digit string from the physical laser scanner
}
