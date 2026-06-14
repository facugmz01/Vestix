import { IsArray, ValidateNested, IsString, IsNumber, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class BulkBalanceRowDto {
  @IsString()
  identifier: string;

  @IsNumber()
  balance: number;
}

export class BulkImportBalancesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkBalanceRowDto)
  rows: BulkBalanceRowDto[];

  @IsEnum(['overwrite', 'add'])
  resolution: 'overwrite' | 'add';
}
