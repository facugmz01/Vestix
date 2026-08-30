import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
  ValidateIf,
  MaxLength,
} from 'class-validator';

export enum ExpenseOriginType {
  CASH_SHIFT = 'CASH_SHIFT',
  FINANCIAL_ACCOUNT = 'FINANCIAL_ACCOUNT',
}

export enum ExpenseStatus {
  PAID = 'PAID',
  PENDING = 'PENDING',
  CANCELLED = 'CANCELLED',
}

export class CreateExpenseDto {
  @IsUUID('4', { message: 'El ID de categoría de gasto debe ser un UUID válido' })
  @IsNotEmpty({ message: 'La categoría de gasto es obligatoria' })
  expenseCategoryId: string;

  @IsNumber({}, { message: 'El monto debe ser un número válido' })
  @IsPositive({ message: 'El monto debe ser estrictamente mayor a 0' })
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha debe ser una cadena ISO válida' })
  date?: string;

  @IsString()
  @IsNotEmpty({ message: 'La descripción del gasto es obligatoria' })
  @MaxLength(500, { message: 'La descripción no puede exceder 500 caracteres' })
  description: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  receiptNumber?: string;

  @IsOptional()
  @IsString()
  voucherUrl?: string;

  @IsEnum(ExpenseOriginType, {
    message: 'El tipo de origen debe ser CASH_SHIFT o FINANCIAL_ACCOUNT',
  })
  originType: ExpenseOriginType;

  @ValidateIf((o) => o.originType === ExpenseOriginType.CASH_SHIFT)
  @IsUUID('4', { message: 'El ID del turno de caja debe ser un UUID válido' })
  @IsOptional()
  cashShiftId?: string;

  @ValidateIf((o) => o.originType === ExpenseOriginType.FINANCIAL_ACCOUNT)
  @IsUUID('4', { message: 'El ID de la cuenta financiera debe ser un UUID válido' })
  @IsNotEmpty({
    message: 'Debe especificar la cuenta financiera de origen si el egreso no es de caja',
  })
  financialAccountId?: string;

  @IsOptional()
  @IsUUID('4', { message: 'El ID de la sucursal debe ser un UUID válido' })
  branchId?: string;
}

export class CancelExpenseDto {
  @IsString()
  @IsNotEmpty({ message: 'Debe indicar el motivo de la anulación' })
  @MaxLength(300, { message: 'El motivo no puede exceder 300 caracteres' })
  reason: string;
}
