import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsBoolean, IsOptional } from 'class-validator';

// We omit 'email' because changing an email usually requires a different, secure flow (verification)
export class UpdateUserDto extends PartialType(OmitType(CreateUserDto, ['email'] as const)) {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
