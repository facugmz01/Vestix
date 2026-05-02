import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async createAccount(dto: CreateAccountDto) {
    return this.prisma.financialAccount.create({
      data: {
        name: dto.name,
        type: dto.type,
        currency: dto.currency,
        branchId: dto.branchId,
        balance: 0,
        isActive: true,
      }
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

  /**
   * CORE LEDGER ENGINE: Posts a financial transaction.
   */
  async postTransaction(accountId: string, type: 'DEBIT' | 'CREDIT', amount: number, referenceId: string, description: string) {
    if (amount <= 0) throw new BadRequestException('El monto debe ser positivo');

    return this.prisma.$transaction(async (tx) => {
      const account = await tx.financialAccount.findUnique({ where: { id: accountId } });
      if (!account) throw new NotFoundException('Cuenta no encontrada');

      // Create transaction record
      const transaction = await tx.financialTransaction.create({
        data: {
          accountId,
          type,
          amount,
          referenceId,
          description,
        }
      });

      // Update materialized balance
      const balanceChange = type === 'DEBIT' ? amount : -amount;
      await tx.financialAccount.update({
        where: { id: accountId },
        data: { balance: { increment: balanceChange } }
      });

      return transaction;
    });
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
