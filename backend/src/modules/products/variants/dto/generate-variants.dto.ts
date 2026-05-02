import { IsString, IsArray, IsNumber, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class AttributeOptionsDto {
  @IsString()
  name: string; // e.g., 'Size', 'Color', 'Fit'

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  values: string[]; // e.g., ['S', 'M', 'L'], ['Red', 'Blue']
}

export class GenerateVariantsDto {
  @IsNumber()
  basePrice: number; // Default price applied to all generated variants

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttributeOptionsDto)
  attributes: AttributeOptionsDto[]; // Array of attributes to generate combinations for
}
