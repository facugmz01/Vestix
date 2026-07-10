import { IsBoolean, IsOptional } from 'class-validator';

export class RestoreBackupDto {
  @IsOptional()
  @IsBoolean()
  confirm?: boolean;
}
