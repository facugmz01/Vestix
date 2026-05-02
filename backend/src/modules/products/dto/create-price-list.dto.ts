import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CreatePriceListDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  margin: number;
}
