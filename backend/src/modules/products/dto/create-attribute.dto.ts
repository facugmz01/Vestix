import { IsString, IsNotEmpty, IsArray, ArrayMinSize } from 'class-validator';

export class CreateAttributeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  values: string[];
}
