import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AuditService, AuditAction } from '../../modules/audit/audit.service';
import { AdjustAccountBalanceDto } from './dto/adjust-account.dto';
import * as crypto from 'crypto';

export enum AccountAdjustmentType {
  INCOME_SURPLUS = 'INCOME_SURPLUS',
  EXPENSE_DEFICIT = 'EXPENSE_DEFICIT',
  RECONCILIATION = 'RECONCILIATION',
}

@Injectable()
export class AccountAdjustmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Performs an atomic account balance adjustment/reconciliation with strict ledger audit trail.
   */
  async adjustAccountBalance(
    accountId: string,
    dto: AdjustAccountBalanceDto,
    user: { userId: string; email?: string },
  ) {
    if (!dto.reason || dto.reason.trim().length < 5) {
      throw new BadRequestException('El motivo del ajuste debe tener al menos 5 caracteres.');
    }

    const adjustedBalance = Number(dto.adjustedBalance);
    if (isNaN(adjustedBalance)) {
      throw new BadRequestException('El saldo ajustado debe ser un número válido.');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Pessimistic Lock on Account
      const lockedAccounts: any[] = await tx.$queryRaw`
        SELECT id, name, type, balance, "isActive", currency 
        FROM "finance"."FinancialAccount" 
        WHERE id = ${accountId} 
        FOR UPDATE
      `;

      const account = lockedAccounts[0];
      if (!account) {
        throw new NotFoundException('La cuenta financiera no existe.');
      }
      if (!account.isActive) {
        throw new BadRequestException(`La cuenta '${account.name}' se encuentra inactiva.`);
      }

      const previousBalance = Number(account.balance);
      const difference = adjustedBalance - previousBalance;

      // Precision check (e.g. within 0.001)
      if (Math.abs(difference) < 0.0001) {
        throw new BadRequestException(
          'El saldo ingresado es idéntico al saldo actual en sistema. No se requiere ningún ajuste contable.',
        );
      }

      const isSurplus = difference > 0;
      const adjustmentType = isSurplus
        ? AccountAdjustmentType.INCOME_SURPLUS
        : AccountAdjustmentType.EXPENSE_DEFICIT;

      // In the treasury ledger: DEBIT increases account balance (surplus), CREDIT decreases it (deficit)
      const txType = isSurplus ? 'DEBIT' : 'CREDIT';
      const absAmount = Math.abs(difference);
      const adjustmentId = crypto.randomUUID();
      const referenceId = `ADJ-${adjustmentId.substring(0, 8).toUpperCase()}`;

      // 2. Create Ledger Transaction
      const financialTx = await tx.financialTransaction.create({
        data: {
          accountId: account.id,
          type: txType,
          amount: absAmount,
          referenceId,
          description: `Ajuste contable (${isSurplus ? 'Sobrante' : 'Faltante'}): ${dto.reason.trim()} [Anterior: $${previousBalance.toFixed(2)} -> Nuevo: $${adjustedBalance.toFixed(2)}]`,
        },
      });

      // 3. Update Account Balance
      const updatedAccount = await tx.financialAccount.update({
        where: { id: accountId },
        data: { balance: adjustedBalance },
      });

      // 4. Create Account Adjustment Record
      const adjustment = await tx.accountAdjustment.create({
        data: {
          id: adjustmentId,
          financialAccountId: accountId,
          previousBalance,
          adjustedBalance,
          difference,
          type: adjustmentType,
          reason: dto.reason.trim(),
          approvedById: user.userId,
          financialTransactionId: financialTx.id,
        },
        include: {
          financialAccount: true,
          approvedBy: { select: { id: true, fullName: true, email: true } },
          financialTransaction: true,
        },
      });

      return {
        adjustment,
        account: updatedAccount,
        transaction: financialTx,
        difference,
        previousBalance,
        adjustedBalance,
      };
    });

    // 5. Audit Log (Forensic log)
    void this.auditService.log({
      userId: user.userId,
      userEmail: user.email,
      action: AuditAction.RECONCILE,
      resource: 'FinancialAccount',
      resourceId: accountId,
      module: 'Finance',
      description: `Ajuste de saldo en '${result.account.name}': Dif. $${result.difference > 0 ? '+' : ''}${result.difference.toFixed(2)} (${dto.reason.trim()})`,
      previousValue: { balance: result.previousBalance },
      newValue: {
        balance: result.adjustedBalance,
        difference: result.difference,
        type: result.adjustment.type,
        reason: dto.reason.trim(),
        adjustmentId: result.adjustment.id,
        financialTransactionId: result.transaction.id,
      },
    });

    return result.adjustment;
  }

  /**
   * Retrieves adjustment history for a specific financial account.
   */
  async getAccountAdjustments(accountId: string) {
    const account = await this.prisma.financialAccount.findUnique({
      where: { id: accountId },
    });
    if (!account) throw new NotFoundException('Cuenta financiera no encontrada');

    return this.prisma.accountAdjustment.findMany({
      where: { financialAccountId: accountId },
      orderBy: { createdAt: 'desc' },
      include: {
        approvedBy: { select: { id: true, fullName: true, email: true } },
        financialTransaction: true,
      },
    });
  }
}
