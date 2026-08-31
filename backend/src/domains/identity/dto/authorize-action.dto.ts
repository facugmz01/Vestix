import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';

export class AuthorizeActionDto {
  @IsEmail({}, { message: 'El email del supervisor debe tener un formato válido' })
  @IsNotEmpty({ message: 'El email del supervisor es obligatorio' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'La contraseña o PIN del supervisor es obligatoria' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'La acción requerida es obligatoria' })
  action: string; // e.g. 'apply:Discount' | 'override:Price' | 'apply'

  @IsString()
  @IsOptional()
  subject?: string; // e.g. 'Discount' | 'Price' | 'Sales'

  @IsString()
  @IsOptional()
  reason?: string;
}
