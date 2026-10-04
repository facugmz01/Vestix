import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class VerifyMfaDto {
  @IsString()
  @IsNotEmpty({ message: 'El código de autenticación es requerido' })
  code: string;
}

export class DisableMfaDto {
  @IsString()
  @IsNotEmpty({ message: 'La contraseña actual es requerida para deshabilitar MFA' })
  password: string;

  @IsString()
  @IsOptional()
  code?: string;
}

export class LoginMfaDto {
  @IsString()
  @IsNotEmpty({ message: 'El token MFA temporal es requerido' })
  mfaToken: string;

  @IsString()
  @IsNotEmpty({ message: 'El código de verificación es requerido' })
  code: string;
}
