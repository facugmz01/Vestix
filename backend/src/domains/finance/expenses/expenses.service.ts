import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { AuditService, AuditAction } from '../../../modules/audit/audit.service';
import { ExpenseCategoriesService } from './expense-categories.service';
import {
  CreateExpenseDto,
  CancelExpenseDto,
  ExpenseOriginType,
  ExpenseStatus,
} from './dto/create-expense.dto';
import { ExpenseFiltersDto } from './dto/expense-filters.dto';
import * as crypto from 'crypto';

@Injectable()
export class ExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly categoriesService: ExpenseCategoriesService,
  ) {}

  /**
   * Imputes and records an operational expense with strict atomicity and pessimistic locking.
   */
  async createExpense(
    dto: CreateExpenseDto,
    user: { userId: string; email?: string; branchId?: string },
  ) {
    if (dto.amount <= 0) {
      throw new BadRequestException('El monto del gasto debe ser estrictamente mayor a 0');
    }

    // 1. Verify Expense Category
    const category = await this.categoriesService.findById(dto.expenseCategoryId);
    if (!category.isActive) {
      throw new BadRequestException(`La categoría de gasto '${category.name}' se encuentra inactiva.`);
    }

    let targetAccountId: string;
    let targetCashShiftId: string | null = null;
    let targetBranchId: string | null = dto.branchId || user.branchId || null;

    // 2. Resolve Funding Source
    if (dto.originType === ExpenseOriginType.CASH_SHIFT) {
      let shiftId = dto.cashShiftId;
      if (!shiftId) {
        // Look up active shift for user's assigned register
        const activeShift = await this.prisma.cashShift.findFirst({
          where: {
            openedByUserId: user.userId,
            status: 'OPEN',
          },
          include: {
            cashRegister: {
              include: {
                paymentMethods: { where: { type: 'CASH', isActive: true } },
              },
            },
          },
        });

        if (!activeShift) {
          throw new BadRequestException(
            'No se encontró un turno de caja abierto para el usuario actual. Debe abrir turno o seleccionar una cuenta financiera.',
          );
        }
        shiftId = activeShift.id;
      }

      const shift = await this.prisma.cashShift.findUnique({
        where: { id: shiftId },
        include: {
          cashRegister: {
            include: {
              paymentMethods: { where: { type: 'CASH', isActive: true } },
            },
          },
        },
      });

      if (!shift) {
        throw new NotFoundException('El turno de caja especificado no existe.');
      }
      if (shift.status !== 'OPEN') {
        throw new BadRequestException('No se pueden imputar gastos a un turno de caja cerrado.');
      }

      const cashPaymentMethod = shift.cashRegister.paymentMethods[0];
      if (!cashPaymentMethod?.accountId) {
        throw new BadRequestException(
          `La caja registradora '${shift.cashRegister.name}' no tiene una cuenta de efectivo vinculada en tesorería.`,
        );
      }

      targetAccountId = cashPaymentMethod.accountId;
      targetCashShiftId = shift.id;
      if (!targetBranchId) {
        targetBranchId = shift.cashRegister.branchId;
      }
    } else {
      // Direct Financial Account outflow
      if (!dto.financialAccountId) {
        throw new BadRequestException('Debe indicar la cuenta financiera de origen del gasto.');
      }

      const account = await this.prisma.financialAccount.findUnique({
        where: { id: dto.financialAccountId },
      });

      if (!account) {
        throw new NotFoundException('La cuenta financiera seleccionada no existe.');
      }
      if (!account.isActive) {
        throw new BadRequestException(`La cuenta '${account.name}' está desactivada.`);
      }

      targetAccountId = account.id;
      if (!targetBranchId && account.branchId) {
        targetBranchId = account.branchId;
      }
    }

    const expenseId = crypto.randomUUID();
    const transactionReference = `EXP-${expenseId.substring(0, 8).toUpperCase()}`;
    const expenseDate = dto.date ? new Date(dto.date) : new Date();

    // 3. Execute in Atomic Transaction with Row Locking
    const result = await this.prisma.$transaction(async (tx) => {
      // Pessimistic Row-Level Lock on Financial Account to prevent race conditions
      const accountsLocked: any[] = await tx.$queryRaw`
        SELECT id, name, type, balance 
        FROM "finance"."FinancialAccount" 
        WHERE id = ${targetAccountId} 
        FOR UPDATE
      `;

      const account = accountsLocked[0];
      if (!account) {
        throw new NotFoundException('Cuenta financiera no encontrada durante la transacción.');
      }

      // Check balance if it's a cash account
      if (account.type === 'CASH' && account.balance < dto.amount) {
        throw new BadRequestException(
          `Fondos insuficientes en la caja (${account.name}). Saldo disponible: $${Number(account.balance).toFixed(2)}, Requerido: $${dto.amount.toFixed(2)}`,
        );
      }

      // 3.1 Create Ledger Financial Transaction (CREDIT = Outflow/Gasto)
      const financialTx = await tx.financialTransaction.create({
        data: {
          accountId: targetAccountId,
          type: 'CREDIT',
          amount: dto.amount,
          referenceId: transactionReference,
          description: `Gasto operativo: ${dto.description.trim()} [${category.name}]`,
        },
      });

      // 3.2 Update Financial Account Balance atomically
      await tx.financialAccount.update({
        where: { id: targetAccountId },
        data: { balance: { decrement: dto.amount } },
      });

      // 3.3 Create Expense Record
      const expense = await tx.expense.create({
        data: {
          id: expenseId,
          expenseCategoryId: category.id,
          amount: dto.amount,
          currency: dto.currency || 'ARS',
          date: expenseDate,
          description: dto.description.trim(),
          notes: dto.notes?.trim() || null,
          receiptNumber: dto.receiptNumber?.trim() || null,
          voucherUrl: dto.voucherUrl?.trim() || null,
          status: ExpenseStatus.PAID,
          cashShiftId: targetCashShiftId,
          financialAccountId: targetAccountId,
          createdById: user.userId,
          branchId: targetBranchId,
          financialTransactionId: financialTx.id,
        },
        include: {
          expenseCategory: true,
          financialAccount: true,
          cashShift: {
            include: {
              cashRegister: { select: { id: true, name: true, code: true } },
            },
          },
          createdBy: { select: { id: true, fullName: true, email: true } },
          branch: { select: { id: true, name: true, code: true } },
          financialTransaction: true,
        },
      });

      return expense;
    });

    // 4. Audit Log
    void this.auditService.log({
      userId: user.userId,
      userEmail: user.email,
      action: AuditAction.CREATE,
      resource: 'Expense',
      resourceId: result.id,
      module: 'Finance',
      description: `Gasto registrado: $${dto.amount} (${category.name} - ${dto.description.trim()})`,
      newValue: {
        id: result.id,
        amount: dto.amount,
        categoryId: category.id,
        categoryName: category.name,
        originType: dto.originType,
        accountId: targetAccountId,
        cashShiftId: targetCashShiftId,
      },
    });

    return result;
  }

  /**
   * Retrieves paginated expenses matching filters.
   */
  async getExpenses(filters: ExpenseFiltersDto) {
    const page = Number(filters.page) || 1;
    const pageSize = Number(filters.pageSize) || 15;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (filters.expenseCategoryId) {
      where.expenseCategoryId = filters.expenseCategoryId;
    }

    if (filters.branchId) {
      where.branchId = filters.branchId;
    }

    if (filters.financialAccountId) {
      where.financialAccountId = filters.financialAccountId;
    }

    if (filters.cashShiftId) {
      where.cashShiftId = filters.cashShiftId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) {
        where.date.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        // End of day if date only
        const end = new Date(filters.endDate);
        if (filters.endDate.length <= 10) {
          end.setHours(23, 59, 59, 999);
        }
        where.date.lte = end;
      }
    }

    if (filters.search?.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { description: { contains: q, mode: 'insensitive' } },
        { receiptNumber: { contains: q, mode: 'insensitive' } },
        { notes: { contains: q, mode: 'insensitive' } },
        { expenseCategory: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: pageSize,
        include: {
          expenseCategory: true,
          financialAccount: { select: { id: true, name: true, type: true, currency: true } },
          cashShift: {
            select: {
              id: true,
              cashRegister: { select: { id: true, name: true, code: true } },
            },
          },
          createdBy: { select: { id: true, fullName: true, email: true } },
          branch: { select: { id: true, name: true, code: true } },
          financialTransaction: { select: { id: true, type: true, amount: true, referenceId: true } },
        },
      }),
      this.prisma.expense.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  }

  /**
   * Analytical summary aggregation for metric cards and charts.
   */
  async getExpensesSummary(filters: ExpenseFiltersDto) {
    const where: any = {
      status: ExpenseStatus.PAID,
    };

    if (filters.branchId) where.branchId = filters.branchId;
    if (filters.expenseCategoryId) where.expenseCategoryId = filters.expenseCategoryId;
    if (filters.financialAccountId) where.financialAccountId = filters.financialAccountId;

    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = new Date(filters.startDate);
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        if (filters.endDate.length <= 10) end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    } else {
      // Default to current month if no date filter is provided
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      where.date = { gte: firstDay };
    }

    const expenses = await this.prisma.expense.findMany({
      where,
      include: {
        expenseCategory: { select: { id: true, name: true, code: true } },
        financialAccount: { select: { id: true, name: true, type: true } },
        branch: { select: { id: true, name: true } },
      },
    });

    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
    const count = expenses.length;

    // Group by category
    const categoryMap = new Map<string, { id: string; name: string; code: string; total: number; count: number }>();
    for (const exp of expenses) {
      const cat = exp.expenseCategory;
      const cur = categoryMap.get(cat.id) || {
        id: cat.id,
        name: cat.name,
        code: cat.code,
        total: 0,
        count: 0,
      };
      cur.total += exp.amount;
      cur.count += 1;
      categoryMap.set(cat.id, cur);
    }

    const byCategory = Array.from(categoryMap.values())
      .map((c) => ({
        ...c,
        percentage: totalAmount > 0 ? (c.total / totalAmount) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);

    // Group by origin (Cash vs Accounts)
    let cashTotal = 0;
    let bankTotal = 0;
    for (const exp of expenses) {
      if (exp.cashShiftId || exp.financialAccount?.type === 'CASH') {
        cashTotal += exp.amount;
      } else {
        bankTotal += exp.amount;
      }
    }

    const topCategory = byCategory[0] || null;

    return {
      totalAmount,
      count,
      byCategory,
      byOrigin: {
        cashTotal,
        bankTotal,
      },
      topCategory,
    };
  }

  /**
   * Retrieves single expense by ID with complete relations.
   */
  async getExpenseById(id: string) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
      include: {
        expenseCategory: true,
        financialAccount: true,
        cashShift: {
          include: {
            cashRegister: { select: { id: true, name: true, code: true, branch: true } },
            openedByUser: { select: { id: true, fullName: true, email: true } },
          },
        },
        createdBy: { select: { id: true, fullName: true, email: true } },
        branch: true,
        financialTransaction: true,
      },
    });

    if (!expense) throw new NotFoundException('Gasto no encontrado');
    return expense;
  }

  /**
   * Reverses and cancels an expense atomically (reimburses ledger and resets balance).
   */
  async cancelExpense(
    id: string,
    dto: CancelExpenseDto,
    user: { userId: string; email?: string },
  ) {
    const expense = await this.getExpenseById(id);

    if (expense.status === ExpenseStatus.CANCELLED) {
      throw new BadRequestException('El gasto ya se encuentra anulado.');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Revert financial balance if it was paid
      if (expense.financialAccountId && expense.financialTransactionId && expense.status === ExpenseStatus.PAID) {
        // Post Reversing DEBIT Transaction (DEBIT = Entry/Refund in treasury)
        await tx.financialTransaction.create({
          data: {
            accountId: expense.financialAccountId,
            type: 'DEBIT',
            amount: expense.amount,
            referenceId: `EXP-CAN-${expense.id.substring(0, 8).toUpperCase()}`,
            description: `Anulación de gasto: ${expense.description} (Motivo: ${dto.reason.trim()})`,
          },
        });

        // Re-increment account balance
        await tx.financialAccount.update({
          where: { id: expense.financialAccountId },
          data: { balance: { increment: expense.amount } },
        });
      }

      // 2. Mark expense as CANCELLED
      const updated = await tx.expense.update({
        where: { id },
        data: {
          status: ExpenseStatus.CANCELLED,
          notes: expense.notes
            ? `${expense.notes} | ANULADO: ${dto.reason.trim()}`
            : `ANULADO: ${dto.reason.trim()}`,
        },
        include: {
          expenseCategory: true,
          financialAccount: true,
          createdBy: { select: { id: true, fullName: true, email: true } },
        },
      });

      return updated;
    });

    // 3. Log Audit Trail
    void this.auditService.log({
      userId: user.userId,
      userEmail: user.email,
      action: AuditAction.DELETE,
      resource: 'Expense',
      resourceId: expense.id,
      module: 'Finance',
      description: `Gasto anulado: $${expense.amount} (${expense.description}). Motivo: ${dto.reason.trim()}`,
      previousValue: { status: expense.status, amount: expense.amount },
      newValue: { status: ExpenseStatus.CANCELLED, cancellationReason: dto.reason.trim() },
    });

    return result;
  }
}
