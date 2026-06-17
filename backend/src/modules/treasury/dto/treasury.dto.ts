import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class OpenShiftDto {
  @IsUUID()
  @IsNotEmpty()
  cashRegisterId: string;

  @IsNumber()
  @Min(0)
  openingAmount: number;
}

export class CloseShiftDto {
  @IsUUID()
  @IsNotEmpty()
  shiftId: string;

  @IsNumber()
  @Min(0)
  closingAmount: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
