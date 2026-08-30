import { IsNumber, IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class AdjustAccountBalanceDto {
  @IsNumber({}, { message: 'El saldo ajustado debe ser un valor numérico válido' })
  adjustedBalance: number;

  @IsString()
  @IsNotEmpty({ message: 'El motivo del ajuste es obligatorio' })
  @MinLength(5, { message: 'El motivo del ajuste debe contener al menos 5 caracteres' })
  @MaxLength(500, { message: 'El motivo del ajuste no puede exceder 500 caracteres' })
  reason: string;
}
