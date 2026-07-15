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
}
