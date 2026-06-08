import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  // Supports infinite depth hierarchy (e.g., Men -> Tops -> T-Shirts)
  @IsOptional()
  @IsUUID('4')
  parentId?: string; 
}
