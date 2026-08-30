import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsUUID } from 'class-validator';

export class CreateExpenseCategoryDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la categoría es requerido' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'El código de la categoría es requerido' })
  code: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID('4', { message: 'El ID de la categoría padre debe ser un UUID válido' })
  parentId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateExpenseCategoryDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  code?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID('4')
  parentId?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
