import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { AccountsService } from '../accounts.service';
import { SettingsService } from '../../../modules/settings/settings.service';
import * as crypto from 'crypto';

@Injectable()
export class CashService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accountsService: AccountsService,
    private readonly settingsService: SettingsService,
  ) {}

  /**
   * 1. GET ACTIVE SHIFT
   */
  async getActiveShift(cashRegisterId: string) {
    return this.prisma.cashShift.findFirst({
      where: {
        cashRegisterId,
        status: 'OPEN',
      },
      include: {
        openedByUser: { select: { id: true, fullName: true, email: true } },
      }
    });
  }

  /**
   * 1b. GET ACTIVE SHIFT FOR USER
   * A helper to find if the current user has any open shift on their assigned register.
   */
  async getActiveShiftForUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { branch: { include: { cashRegisters: true } } }
    });

    if (!user || !user.branch || user.branch.cashRegisters.length === 0) {
      throw new BadRequestException('El usuario no tiene una sucursal o caja asignada.');
    }

    // Default to the first register of the branch for simplicity, or ideally the user's specific assigned register
    const cashRegister = user.branch.cashRegisters[0];

    return this.getActiveShift(cashRegister.id);
  }

  /**
   * 2. OPEN SHIFT
   * Cashier counts the float in the morning and opens the register.
   */
  async openShift(cashRegisterId: string, userId: string, reportedOpeningBalance: number) {
    const register = await this.prisma.cashRegister.findUnique({ where: { id: cashRegisterId } });
    if (!register) throw new NotFoundException('Caja registradora no encontrada.');

    const activeShift = await this.getActiveShift(cashRegisterId);
    if (activeShift) {
      throw new BadRequestException('Ya existe un turno abierto para esta caja.');
    }

    return this.prisma.cashShift.create({
      data: {
        cashRegisterId,
        openedByUserId: userId,
        status: 'OPEN',
        openingAmount: reportedOpeningBalance,
        openedAt: new Date(),
      }
    });
  }

  /**
   * 3. CLOSE SHIFT (The Blind Count)
   */
  async closeShift(shiftId: string, userId: string, actualCountedBalance: number, notes?: string) {
    const shift = await this.prisma.cashShift.findUnique({
      where: { id: shiftId },
      include: { cashRegister: { include: { paymentMethods: { include: { account: true } } } } }
    });

    if (!shift) {
      throw new NotFoundException('Turno no encontrado.');
    }

    if (shift.status === 'CLOSED') {
      throw new BadRequestException('El turno ya se encuentra cerrado.');
    }

    const posSettings = await this.settingsService.getPosSettings();

    if (posSettings.boxMode === 'STRICT' && shift.openedByUserId !== userId) {
      throw new BadRequestException('El modo de caja es ESTRICTO. Solo el usuario que abrió el turno puede cerrarlo.');
    }

    // Calcular el esperado: 
    // En un sistema real, es: Saldo Inicial + Ventas en Efectivo - Egresos/Retiros.
    // Para simplificar, buscamos los pagos de tipo CASH vinculados a las ventas de este turno.
    
    // Obtener la cuenta de EFECTIVO vinculada a la caja
    const cashPaymentMethod = shift.cashRegister.paymentMethods.find(p => p.type === 'CASH');
    const cashAccountId = cashPaymentMethod?.accountId;

    let expected = shift.openingAmount;

    if (cashAccountId) {
      // Sumar todas las transacciones de esta cuenta creadas DURANTE el turno
      const transactions = await this.prisma.financialTransaction.findMany({
        where: {
          accountId: cashAccountId,
          createdAt: { gte: shift.openedAt }
        }
      });

      const netCashFlow = transactions.reduce((sum, tx) => {
        return sum + (tx.type === 'DEBIT' ? tx.amount : -tx.amount);
      }, 0);

      expected += netCashFlow;
    }

    // The moment of truth: Does the physical money match the math?
    const difference = actualCountedBalance - expected;

    const closedShift = await this.prisma.cashShift.update({
      where: { id: shiftId },
      data: {
        status: 'CLOSED',
        closedByUserId: userId,
        closingAmount: actualCountedBalance,
        expectedAmount: expected,
        difference: difference,
        closedAt: new Date(),
        notes,
      }
    });

    // STRICT RECONCILIATION:
    if (difference !== 0 && cashAccountId) {
      const adjustmentType = difference < 0 ? 'CREDIT' : 'DEBIT'; // Credit removes money, Debit adds money
      await this.accountsService.postTransaction(
        cashAccountId,
        adjustmentType,
        Math.abs(difference),
        `SHIFT-ADJ-${shift.id}`,
        `Ajuste de Cierre de Caja (Arqueo). Esperado: ${expected}, Contado: ${actualCountedBalance}`
      );
    }

    return closedShift;
  }

  /**
   * 4. EXPENSES (Cash Out / Petty Cash)
   * A manager takes $15 out of the drawer to pay the window washer.
   */
  async recordExpense(accountId: string, amount: number, description: string, userId: string) {
    // Hits the core treasury ledger to physically deduct the money
    await this.accountsService.postTransaction(
      accountId,
      'CREDIT', // Money leaves the drawer
      amount,
      `EXP-${crypto.randomUUID()}`,
      `Cash Expense by ${userId}: ${description}`
    );

    return { success: true, message: `Expense of $${amount} recorded.` };
  }

  /**
   * 5. CASH DROP (Transfer from Register to Safe/Bank)
   * The drawer has too much cash, so the manager moves $500 to the backroom safe.
   */
  async performCashDrop(sourceAccountId: string, destinationAccountId: string, amount: number, userId: string) {
    const source = await this.accountsService.getAccount(sourceAccountId);
    if (source.balance < amount) {
      throw new BadRequestException('Cannot drop more cash than is currently in the drawer.');
    }

    // 1. Money leaves Register
    await this.accountsService.postTransaction(
      sourceAccountId,
      'CREDIT',
      amount,
      `DROP-${crypto.randomUUID()}`,
      `Cash Drop by ${userId} to Safe`
    );

    // 2. Money enters Safe (or Bank)
    await this.accountsService.postTransaction(
      destinationAccountId,
      'DEBIT',
      amount,
      `DROP-${crypto.randomUUID()}`,
      `Received Cash Drop from Register ${source.name}`
    );

    return { success: true, amount };
  }

  async getShifts(page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;
    const [data, total] = await Promise.all([
      this.prisma.cashShift.findMany({
        skip,
        take: pageSize,
        orderBy: { openedAt: 'desc' },
        include: {
          openedByUser: { select: { fullName: true } },
          closedByUser: { select: { fullName: true } },
          cashRegister: { select: { name: true, branch: { select: { name: true } } } }
        }
      }),
      this.prisma.cashShift.count()
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async getShiftById(shiftId: string) {
    const shift = await this.prisma.cashShift.findUnique({
      where: { id: shiftId },
      include: {
        openedByUser: { select: { fullName: true } },
        closedByUser: { select: { fullName: true } },
        cashRegister: { select: { name: true, branch: { select: { name: true } } } }
      }
    });
    if (!shift) throw new NotFoundException('Turno no encontrado');
    return shift;
  }

  async getShiftMovements(shiftId: string) {
    const shift = await this.prisma.cashShift.findUnique({
      where: { id: shiftId },
      include: { cashRegister: { include: { paymentMethods: true } } }
    });
    if (!shift) throw new NotFoundException('Turno no encontrado');

    const cashPaymentMethod = shift.cashRegister.paymentMethods.find(p => p.type === 'CASH');
    if (!cashPaymentMethod?.accountId) return [];

    const end = shift.closedAt || new Date();
    const transactions = await this.prisma.financialTransaction.findMany({
      where: {
        accountId: cashPaymentMethod.accountId,
        createdAt: { gte: shift.openedAt, lte: end }
      },
      orderBy: { createdAt: 'desc' }
    });

    return transactions.map(t => ({
      id: t.id,
      type: t.type === 'DEBIT' ? 'INCOME' : 'EXPENSE',
      concept: t.description || t.referenceId,
      amount: t.amount,
      createdAt: t.createdAt
    }));
  }

  async addManualMovement(shiftId: string, userId: string, type: 'INCOME' | 'EXPENSE', amount: number, concept: string) {
    const shift = await this.prisma.cashShift.findUnique({
      where: { id: shiftId },
      include: { cashRegister: { include: { paymentMethods: true } } }
    });
    if (!shift) throw new NotFoundException('Turno no encontrado');
    if (shift.status === 'CLOSED') throw new BadRequestException('El turno está cerrado');

    const cashPaymentMethod = shift.cashRegister.paymentMethods.find(p => p.type === 'CASH');
    if (!cashPaymentMethod?.accountId) throw new BadRequestException('No hay cuenta de efectivo asociada a esta caja');

    const txType = type === 'INCOME' ? 'DEBIT' : 'CREDIT'; // Income adds money (Debit in our treasury logic), Expense removes money (Credit)
    
    await this.accountsService.postTransaction(
      cashPaymentMethod.accountId,
      txType,
      amount,
      `MANUAL-${crypto.randomUUID()}`,
      concept
    );

    return { success: true };
  }
}
