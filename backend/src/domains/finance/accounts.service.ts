import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async createAccount(dto: CreateAccountDto) {
    const initialBalance = Math.max(0, Number(dto.initialBalance) || 0);

    return this.prisma.$transaction(async (tx) => {
      const account = await tx.financialAccount.create({
        data: {
          name: dto.name.trim(),
          type: dto.type,
          currency: dto.currency || 'ARS',
          branchId: dto.branchId || null,
          balance: initialBalance,
          isActive: true,
        },
      });

      if (initialBalance > 0) {
        await tx.financialTransaction.create({
          data: {
            accountId: account.id,
            type: 'DEBIT',
            amount: initialBalance,
            referenceId: account.id,
            description: `Saldo inicial — ${account.name}`,
          },
        });
      }

      return account;
    });
  }

  async updateAccount(id: string, dto: import('./dto/create-account.dto').UpdateAccountDto) {
    const existing = await this.prisma.financialAccount.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Cuenta financiera no encontrada');

    return this.prisma.financialAccount.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.currency !== undefined ? { currency: dto.currency } : {}),
        ...(dto.branchId !== undefined ? { branchId: dto.branchId } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  async getAccount(id: string) {
    const acc = await this.prisma.financialAccount.findUnique({
      where: { id },
      include: { transactions: { take: 10, orderBy: { createdAt: 'desc' } } }
    });
    if (!acc) throw new NotFoundException('Cuenta financiera no encontrada');
    return acc;
  }

  async getAccounts() {
    return this.prisma.financialAccount.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async getAccountTransactions(accountId: string, filters: { page?: number; pageSize?: number } = {}) {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 30;
    const account = await this.prisma.financialAccount.findUnique({ where: { id: accountId } });
    if (!account) throw new NotFoundException('Cuenta no encontrada');

    const where = { accountId };
    const [data, total] = await Promise.all([
      this.prisma.financialTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.financialTransaction.count({ where }),
    ]);

    return {
      account,
      data,
      total,
      page,
      pageSize,
    };
  }

  // --- Payment Methods Config ---
  async getPaymentMethods() {
    return this.prisma.paymentMethod.findMany({
      where: { isActive: true },
      include: {
        account: true,
        cashRegister: true,
      }
    });
  }

  async createPaymentMethod(data: { name: string, type: string, accountId?: string, cashRegisterId?: string }) {
    return this.prisma.paymentMethod.create({
      data: {
        name: data.name,
        type: data.type,
        accountId: data.accountId,
        cashRegisterId: data.cashRegisterId,
        isActive: true,
      }
    });
  }

  async updatePaymentMethod(id: string, data: any) {
    return this.prisma.paymentMethod.update({
      where: { id },
      data,
    });
  }

  /**
   * CORE LEDGER ENGINE: Posts a financial transaction.
   */
  async postTransaction(accountId: string, type: 'DEBIT' | 'CREDIT', amount: number, referenceId: string, description: string) {
    return this.prisma.$transaction(async (tx) => {
      return this.postTransactionInTx(tx, accountId, type, amount, referenceId, description);
    });
  }

  /**
   * Posts a ledger entry inside an existing Prisma transaction (e.g. checkout).
   */
  async postTransactionInTx(
    tx: any,
    accountId: string,
    type: 'DEBIT' | 'CREDIT',
    amount: number,
    referenceId: string,
    description: string,
  ) {
    if (amount <= 0) throw new BadRequestException('El monto debe ser positivo');

    const account = await tx.financialAccount.findUnique({ where: { id: accountId } });
    if (!account) throw new NotFoundException('Cuenta no encontrada');

    const transaction = await tx.financialTransaction.create({
      data: { accountId, type, amount, referenceId, description },
    });

    const balanceChange = type === 'DEBIT' ? amount : -amount;
    await tx.financialAccount.update({
      where: { id: accountId },
      data: { balance: { increment: balanceChange } },
    });

    return transaction;
  }

  async generateIncomingReceipt(payload: {
    accountId: string;
    amount: number;
    payerName: string;
    referenceId: string;
    description: string;
  }) {
    await this.postTransaction(
      payload.accountId, 
      'DEBIT', 
      payload.amount, 
      payload.referenceId, 
      payload.description
    );

    return this.prisma.paymentReceipt.create({
      data: {
        accountId: payload.accountId,
        amount: payload.amount,
        payerName: payload.payerName,
        referenceId: payload.referenceId,
      }
    });
  }

  async processOutgoingPayment(payload: {
    accountId: string;
    amount: number;
    payeeName: string;
    referenceId: string;
    description: string;
  }) {
    const account = await this.getAccount(payload.accountId);
    
    if (account.type === 'CASH' && account.balance < payload.amount) {
      throw new BadRequestException(`Fondos insuficientes en la caja. Saldo: $${account.balance}`);
    }

    await this.postTransaction(
      payload.accountId,
      'CREDIT',
      payload.amount,
      payload.referenceId,
      payload.description
    );

    return { success: true, message: `Pago procesado: $${payload.amount}` };
  }

  /**
   * Resolves a guaranteed FinancialAccount ID inside a transaction.
   * Auto-links or auto-provisions if missing, ensuring financial entries are NEVER lost.
   */
  async resolvePaymentAccountInTx(
    tx: any,
    branchId: string,
    methodType: string,
    cashShiftId?: string,
    explicitAccountId?: string,
  ): Promise<string> {
    // 1. Explicit Account provided & validated
    if (explicitAccountId) {
      const explicit = await tx.financialAccount.findUnique({
        where: { id: explicitAccountId },
      });
      if (explicit && explicit.isActive) return explicit.id;
    }

    // 2. Active Cash Shift & Register lookup (strictly for POS / counter sales)
    if (cashShiftId) {
      const shift = await tx.cashShift.findUnique({
        where: { id: cashShiftId },
        include: {
          cashRegister: {
            include: {
              paymentMethods: {
                where: { isActive: true },
                include: { account: true },
              },
            },
          },
        },
      });

      if (shift?.cashRegister) {
        const registerPm = shift.cashRegister.paymentMethods.find(
          (p: { type: string; accountId?: string | null }) =>
            p.type === methodType && p.accountId,
        );
        if (registerPm?.accountId) return registerPm.accountId;

        // If Cash payment and register has no linked account, try branch CASH account
        if (methodType === 'CASH') {
          const branchCashAccount = await tx.financialAccount.findFirst({
            where: { branchId: shift.cashRegister.branchId || branchId, type: 'CASH', isActive: true },
          });
          if (branchCashAccount) {
            // Auto-link payment method for next time
            await tx.paymentMethod.upsert({
              where: { id: `pm-reg-${shift.cashRegister.id}-cash` },
              update: { accountId: branchCashAccount.id, isActive: true },
              create: {
                id: `pm-reg-${shift.cashRegister.id}-cash`,
                name: `Efectivo — ${shift.cashRegister.name}`,
                type: 'CASH',
                cashRegisterId: shift.cashRegister.id,
                accountId: branchCashAccount.id,
                isActive: true,
              },
            });
            return branchCashAccount.id;
          }
        }
      }
    }

    // 3. Look for an active PaymentMethod configured with an account
    const pm = await tx.paymentMethod.findFirst({
      where: { type: methodType, isActive: true, accountId: { not: null } },
      include: { account: true },
    });
    if (pm?.accountId && pm.account?.isActive) {
      return pm.accountId;
    }

    // 4. Look up by matching account type for the specific branch
    const targetType = methodType === 'CASH' ? 'CASH' : 'BANK';
    let account = await tx.financialAccount.findFirst({
      where: { branchId, type: targetType, isActive: true },
    });

    // 5. Fallback to any active account of matching type across the company
    if (!account) {
      account = await tx.financialAccount.findFirst({
        where: { type: targetType, isActive: true },
      });
    }

    // 6. Fallback to any active account in the branch
    if (!account) {
      account = await tx.financialAccount.findFirst({
        where: { branchId, isActive: true },
      });
    }

    // 7. Fallback to any active account overall
    if (!account) {
      account = await tx.financialAccount.findFirst({
        where: { isActive: true },
      });
    }

    // 8. Auto-provision default account if database has zero accounts
    if (!account) {
      account = await tx.financialAccount.create({
        data: {
          name: targetType === 'CASH' ? 'Caja Principal (Efectivo)' : 'Banco / Cobros Digitales',
          type: targetType,
          currency: 'ARS',
          branchId: branchId || null,
          balance: 0,
          isActive: true,
        },
      });
    }

    return account.id;
  }

  /**
   * Reconciles orphan completed sales that have no corresponding financial transactions.
   * Runs atomically without duplicating stock movements.
   */
  async reconcileOrphanSales(options?: { branchId?: string; limit?: number }) {
    const limit = options?.limit ?? 500;
    const where: any = {
      status: { in: ['COMPLETED', 'CONFIRMED'] },
    };
    if (options?.branchId) {
      where.branchId = options.branchId;
    }

    const orphanOrders = await this.prisma.saleOrder.findMany({
      where,
      include: {
        payments: { include: { paymentMethod: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    let reconciledCount = 0;
    let skippedCount = 0;
    let totalAmountReconciled = 0;
    const affectedAccounts = new Set<string>();

    for (const order of orphanOrders) {
      const existingTxCount = await this.prisma.financialTransaction.count({
        where: { referenceId: order.id, type: 'DEBIT' },
      });

      if (existingTxCount > 0) {
        skippedCount++;
        continue;
      }

      // If purely customer credit, check/ensure current account movement
      if (order.paymentMethod === 'CUSTOMER_CREDIT' && order.customerId) {
        const ccMovement = await this.prisma.currentAccountMovement.findFirst({
          where: { referenceId: order.id },
        });
        if (!ccMovement) {
          await this.prisma.$transaction(async (tx) => {
            const customer = await tx.customer.findUnique({ where: { id: order.customerId! } });
            if (customer) {
              const prevBalance = customer.currentAccountBalance || 0;
              const newBalance = prevBalance + order.grandTotal;
              await tx.customer.update({
                where: { id: customer.id },
                data: { currentAccountBalance: newBalance },
              });
              await tx.currentAccountMovement.create({
                data: {
                  accountId: customer.id,
                  entityType: 'CUSTOMER',
                  documentType: 'DEBIT_NOTE',
                  referenceId: order.id,
                  description: `Reconciliación: Cargo Venta #${order.id.slice(0, 8)}`,
                  amount: order.grandTotal,
                  debit: order.grandTotal,
                  credit: 0,
                  balanceAfter: newBalance,
                  createdAt: order.createdAt,
                },
              });
            }
          });
          reconciledCount++;
          totalAmountReconciled += order.grandTotal;
        } else {
          skippedCount++;
        }
        continue;
      }

      // Reconcile monetary sales
      await this.prisma.$transaction(async (tx) => {
        const paymentSlices: Array<{ method: string; amount: number; reference?: string }> = [];

        if (order.payments && order.payments.length > 0) {
          for (const p of order.payments) {
            paymentSlices.push({
              method: p.paymentMethod?.type || order.paymentMethod || 'CASH',
              amount: p.amount,
              reference: p.referenceId || undefined,
            });
          }
        } else {
          paymentSlices.push({
            method: order.paymentMethod || 'CASH',
            amount: order.grandTotal,
          });
        }

        let primaryAccountId: string | null = null;

        for (const slice of paymentSlices) {
          if (slice.amount <= 0.01) continue;
          if (slice.method === 'CUSTOMER_CREDIT') continue;

          const accountId = await this.resolvePaymentAccountInTx(
            tx,
            order.branchId,
            slice.method,
            order.cashShiftId || undefined,
            order.paymentAccountId || undefined,
          );

          if (!primaryAccountId) primaryAccountId = accountId;
          affectedAccounts.add(accountId);

          const desc = `Cobro Venta #${order.id.slice(0, 8)} via ${slice.method}${slice.reference ? ` Ref: ${slice.reference}` : ''} (Reconciliado)`;

          await tx.financialTransaction.create({
            data: {
              accountId,
              type: 'DEBIT',
              amount: slice.amount,
              referenceId: order.id,
              description: desc,
              createdAt: order.createdAt,
            },
          });

          await tx.financialAccount.update({
            where: { id: accountId },
            data: { balance: { increment: slice.amount } },
          });

          await tx.treasuryReceipt.create({
            data: {
              accountId,
              amount: slice.amount,
              payerName: order.customerId || 'Walk-in',
              referenceId: order.id,
              description: desc,
              createdAt: order.createdAt,
            },
          });

          totalAmountReconciled += slice.amount;
        }

        if (primaryAccountId && !order.financialAccountId) {
          await tx.saleOrder.update({
            where: { id: order.id },
            data: { financialAccountId: primaryAccountId },
          });
        }
      });

      reconciledCount++;
    }

    return {
      scanned: orphanOrders.length,
      reconciled: reconciledCount,
      skipped: skippedCount,
      totalAmountReconciled,
      affectedAccountsCount: affectedAccounts.size,
    };
  }
}

