import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateBackupDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
