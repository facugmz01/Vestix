import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateStorefrontProfileDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  @MaxLength(120)
  fullName: string;

  @IsOptional()
  @IsEmail({}, { message: 'Correo electrónico inválido.' })
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  taxId?: string;
}
