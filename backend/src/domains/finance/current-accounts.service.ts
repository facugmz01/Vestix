import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { formatEntityId, formatSaleId } from '../../common/utils/format-id.util';

export interface CurrentAccountView {
  id: string;
  entityId: string;
  entityName: string;
  entityType: 'CUSTOMER' | 'SUPPLIER';
  balance: number;
  currency: string;
  creditLimit?: number;
  overdueAmount: number;
  lastMovementDate?: string;
  phone?: string | null;
  email?: string | null;
}

@Injectable()
export class CurrentAccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: {
    page?: number;
    pageSize?: number;
    search?: string;
    entityType?: 'CUSTOMER' | 'SUPPLIER';
  } = {}) {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 15;
    const search = filters.search?.trim();

    const accounts: CurrentAccountView[] = [];

    if (!filters.entityType || filters.entityType === 'CUSTOMER') {
      const customers = await this.prisma.customer.findMany({
        where: {
          isActive: true,
          usedCredit: { gt: 0 },
          ...(search ? { fullName: { contains: search, mode: 'insensitive' } } : {}),
        },
        orderBy: { updatedAt: 'desc' },
      });
      accounts.push(...customers.map(c => this.mapCustomer(c)));
    }

    if (!filters.entityType || filters.entityType === 'SUPPLIER') {
      const suppliers = await this.prisma.supplier.findMany({
        where: {
          balance: { gt: 0 },
          ...(search ? { companyName: { contains: search, mode: 'insensitive' } } : {}),
        },
        orderBy: { updatedAt: 'desc' },
      });
      accounts.push(...suppliers.map(s => this.mapSupplier(s)));
    }

    const total = accounts.length;
    const skip = (page - 1) * pageSize;
    const data = accounts.slice(skip, skip + pageSize);

    return { data, total, page, pageSize };
  }

  async findById(id: string): Promise<CurrentAccountView> {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (customer) return this.mapCustomer(customer);

    const supplier = await this.prisma.supplier.findUnique({ where: { id } });
    if (supplier) return this.mapSupplier(supplier);

    throw new NotFoundException('Cuenta corriente no encontrada');
  }

  async getMovements(accountId: string, filters: { page?: number; pageSize?: number } = {}) {
    const account = await this.findById(accountId);
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 15;

    const manualMovements = await this.prisma.currentAccountMovement.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
    });

    /** Shape esperado por CurrentAccountDetailDrawer / frontend types */
    const mappedManual = manualMovements.map(m => this.mapMovementRow(m, accountId));

    const rows: ReturnType<CurrentAccountsService['mapMovementRow']>[] = [...mappedManual];

    if (account.entityType === 'CUSTOMER') {
      // Legacy fallback: synthesize INVOICE rows for old CC sales that never wrote CurrentAccountMovement.
      // Prefer durable movements when present (coveredRefs). Only completed/confirmed sales count.
      const creditSales = await this.prisma.saleOrder.findMany({
        where: {
          customerId: accountId,
          paymentMethod: { in: ['CUSTOMER_CREDIT', 'MULTIPLE'] },
          status: { in: ['COMPLETED', 'CONFIRMED', 'DELIVERED', 'READY_FOR_PICKUP', 'SHIPPED'] },
        },
        include: {
          payments: { include: { paymentMethod: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      const coveredRefs = new Set(manualMovements.map(m => m.referenceId));
      for (const o of creditSales) {
        if (coveredRefs.has(o.id)) continue;

        let debit = 0;
        if (o.paymentMethod === 'CUSTOMER_CREDIT') {
          debit = o.grandTotal;
        } else {
          debit = (o.payments || [])
            .filter((p: { paymentMethod?: { type?: string } }) => p.paymentMethod?.type === 'CUSTOMER_CREDIT')
            .reduce((sum: number, p: { amount: number }) => sum + p.amount, 0);
        }
        if (debit <= 0.01) continue;

        rows.push({
          id: `sale-${o.id}`,
          accountId,
          date: o.createdAt.toISOString(),
          documentType: 'INVOICE',
          referenceId: o.id,
          description: formatSaleId(o.id, o.status),
          debit,
          credit: 0,
          balanceAfter: 0,
        });
      }
    } else {
      // Legacy: OCs con saldo pendiente sin CurrentAccountMovement (compras viejas)
      const coveredRefs = new Set(manualMovements.map(m => m.referenceId));
      const openPos = await this.prisma.purchaseOrder.findMany({
        where: {
          supplierId: accountId,
          status: { notIn: ['DRAFT', 'CANCELLED'] },
        },
        orderBy: { createdAt: 'desc' },
      });
      for (const po of openPos) {
        const outstanding = Math.max(0, po.totalAmount - (po.paidAmount || 0));
        if (outstanding <= 0) continue;
        if (coveredRefs.has(po.id)) continue;
        rows.push({
          id: `legacy-po-${po.id}`,
          accountId,
          date: (po.issuedAt || po.createdAt).toISOString(),
          documentType: 'DEBIT_NOTE',
          referenceId: po.id,
          description: `Deuda pendiente ${formatEntityId(po.id, 'OC-')}`,
          debit: 0,
          credit: outstanding,
          balanceAfter: 0,
        });
      }
    }

    rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const total = rows.length;
    const data = rows.slice((page - 1) * pageSize, page * pageSize);

    return { data, total, page, pageSize };
  }

  private mapMovementRow(
    m: {
      id: string;
      accountId: string;
      documentType: string;
      referenceId: string;
      description: string;
      debit: number;
      credit: number;
      balanceAfter: number;
      dueDate?: Date | null;
      createdAt: Date;
    },
    accountId: string,
  ): {
    id: string;
    accountId: string;
    date: string;
    documentType: 'RECEIPT' | 'CREDIT_NOTE' | 'DEBIT_NOTE' | 'INVOICE';
    referenceId: string;
    description: string;
    debit: number;
    credit: number;
    balanceAfter: number;
    dueDate?: string;
  } {
    return {
      id: m.id,
      accountId: m.accountId || accountId,
      date: m.createdAt.toISOString(),
      documentType: m.documentType as 'RECEIPT' | 'CREDIT_NOTE' | 'DEBIT_NOTE' | 'INVOICE',
      referenceId: m.referenceId,
      description: m.description,
      debit: m.debit,
      credit: m.credit,
      balanceAfter: m.balanceAfter,
      ...(m.dueDate ? { dueDate: m.dueDate.toISOString() } : {}),
    };
  }

  private mapCustomer(c: {
    id: string;
    fullName: string;
    usedCredit: number;
    creditLimit: number;
    phone?: string | null;
    email?: string | null;
    updatedAt: Date;
  }): CurrentAccountView {
    return {
      id: c.id,
      entityId: c.id,
      entityName: c.fullName,
      entityType: 'CUSTOMER',
      balance: c.usedCredit,
      currency: 'ARS',
      creditLimit: c.creditLimit,
      overdueAmount: c.creditLimit > 0 && c.usedCredit > c.creditLimit
        ? c.usedCredit - c.creditLimit
        : c.usedCredit,
      lastMovementDate: c.updatedAt.toISOString(),
      phone: c.phone,
      email: c.email,
    };
  }

  /**
   * Charges a house-credit (cuenta corriente) sale onto the customer balance
   * and writes a durable CurrentAccountMovement (same pattern as supplier PO debt).
   * Idempotent per orderId: skips if an INVOICE movement already exists for the sale.
   */
  async chargeCustomerSaleInTx(
    tx: any,
    params: {
      customerId: string;
      amount: number;
      orderId: string;
      description?: string;
    },
  ) {
    if (params.amount <= 0.01) return null;

    const existing = await tx.currentAccountMovement.findFirst({
      where: {
        accountId: params.customerId,
        referenceId: params.orderId,
        documentType: 'INVOICE',
      },
    });
    if (existing) return existing;

    const customer = await tx.customer.findUnique({ where: { id: params.customerId } });
    if (!customer) throw new BadRequestException('Customer not found');

    if (customer.usedCredit + params.amount > customer.creditLimit) {
      throw new BadRequestException('Credit limit exceeded');
    }

    const updated = await tx.customer.update({
      where: { id: params.customerId },
      data: { usedCredit: { increment: params.amount } },
    });

    return tx.currentAccountMovement.create({
      data: {
        accountId: params.customerId,
        entityType: 'CUSTOMER',
        documentType: 'INVOICE',
        referenceId: params.orderId,
        description: params.description || `Venta a cuenta corriente ${formatSaleId(params.orderId)}`,
        amount: params.amount,
        debit: params.amount,
        credit: 0,
        balanceAfter: Math.max(0, updated.usedCredit),
      },
    });
  }

  /**
   * Reverses a prior house-credit charge (cancel / void). Idempotent per orderId.
   */
  async reverseCustomerSaleInTx(
    tx: any,
    params: {
      customerId: string;
      amount: number;
      orderId: string;
      description?: string;
    },
  ) {
    if (params.amount <= 0.01) return null;

    const existingReversal = await tx.currentAccountMovement.findFirst({
      where: {
        accountId: params.customerId,
        referenceId: params.orderId,
        documentType: 'CREDIT_NOTE',
      },
    });
    if (existingReversal) return existingReversal;

    const invoice = await tx.currentAccountMovement.findFirst({
      where: {
        accountId: params.customerId,
        referenceId: params.orderId,
        documentType: 'INVOICE',
      },
    });
    const reverseAmount = invoice?.amount ?? params.amount;
    if (reverseAmount <= 0.01) return null;

    const updated = await tx.customer.update({
      where: { id: params.customerId },
      data: { usedCredit: { decrement: reverseAmount } },
    });

    return tx.currentAccountMovement.create({
      data: {
        accountId: params.customerId,
        entityType: 'CUSTOMER',
        documentType: 'CREDIT_NOTE',
        referenceId: params.orderId,
        description: params.description || `Anulación venta ${formatSaleId(params.orderId)}`,
        amount: reverseAmount,
        debit: 0,
        credit: reverseAmount,
        balanceAfter: Math.max(0, updated.usedCredit),
      },
    });
  }

  async registerPaymentReceipt(
    accountId: string,
    payload: { amount: number; referenceId: string; description: string },
  ) {
    return this.applyMovement(accountId, {
      documentType: 'RECEIPT',
      referenceId: payload.referenceId,
      description: payload.description || 'Recibo de cobro',
      amount: payload.amount,
      customerEffect: 'decrement',
      supplierEffect: 'decrement',
    });
  }

  async issueCreditNote(
    accountId: string,
    payload: { amount: number; referenceId: string; description: string },
  ) {
    return this.applyMovement(accountId, {
      documentType: 'CREDIT_NOTE',
      referenceId: payload.referenceId,
      description: payload.description || 'Nota de crédito',
      amount: payload.amount,
      customerEffect: 'decrement',
      supplierEffect: 'decrement',
    });
  }

  async issueDebitNote(
    accountId: string,
    payload: { amount: number; referenceId: string; description: string; dueDate?: string },
  ) {
    return this.applyMovement(accountId, {
      documentType: 'DEBIT_NOTE',
      referenceId: payload.referenceId,
      description: payload.description || 'Nota de débito',
      amount: payload.amount,
      customerEffect: 'increment',
      supplierEffect: 'increment',
      dueDate: payload.dueDate ? new Date(payload.dueDate) : undefined,
    });
  }

  private async applyMovement(
    accountId: string,
    input: {
      documentType: 'RECEIPT' | 'CREDIT_NOTE' | 'DEBIT_NOTE';
      referenceId: string;
      description: string;
      amount: number;
      customerEffect: 'increment' | 'decrement';
      supplierEffect: 'increment' | 'decrement';
      dueDate?: Date;
    },
  ) {
    if (input.amount <= 0) {
      throw new BadRequestException('El monto debe ser mayor a cero');
    }

    const customer = await this.prisma.customer.findUnique({ where: { id: accountId } });
    if (customer) {
      return this.prisma.$transaction(async (tx) => {
        const updated = await tx.customer.update({
          where: { id: accountId },
          data: {
            usedCredit:
              input.customerEffect === 'increment'
                ? { increment: input.amount }
                : { decrement: input.amount },
          },
        });
        const balanceAfter = Math.max(0, updated.usedCredit);
        const isCredit = input.customerEffect === 'decrement';
        const movement = await tx.currentAccountMovement.create({
          data: {
            accountId,
            entityType: 'CUSTOMER',
            documentType: input.documentType,
            referenceId: input.referenceId,
            description: input.description,
            amount: input.amount,
            debit: isCredit ? 0 : input.amount,
            credit: isCredit ? input.amount : 0,
            balanceAfter,
            dueDate: input.dueDate,
          },
        });
        return this.mapMovementResponse(movement, 'CUSTOMER');
      });
    }

    const supplier = await this.prisma.supplier.findUnique({ where: { id: accountId } });
    if (supplier) {
      return this.prisma.$transaction(async (tx) => {
        const updated = await tx.supplier.update({
          where: { id: accountId },
          data: {
            balance:
              input.supplierEffect === 'increment'
                ? { increment: input.amount }
                : { decrement: input.amount },
          },
        });
        const balanceAfter = Math.max(0, updated.balance);
        const isDebit = input.supplierEffect === 'decrement';
        const movement = await tx.currentAccountMovement.create({
          data: {
            accountId,
            entityType: 'SUPPLIER',
            documentType: input.documentType,
            referenceId: input.referenceId,
            description: input.description,
            amount: input.amount,
            debit: isDebit ? input.amount : 0,
            credit: isDebit ? 0 : input.amount,
            balanceAfter,
            dueDate: input.dueDate,
          },
        });
        return this.mapMovementResponse(movement, 'SUPPLIER');
      });
    }

    throw new NotFoundException('Cuenta corriente no encontrada');
  }

  private mapMovementResponse(
    movement: {
      id: string;
      accountId?: string;
      documentType?: string;
      referenceId: string;
      description: string;
      amount: number;
      credit: number;
      debit: number;
      balanceAfter: number;
      dueDate?: Date | null;
      createdAt: Date;
    },
    _entityType: 'CUSTOMER' | 'SUPPLIER',
  ) {
    return {
      id: movement.id,
      accountId: movement.accountId,
      date: movement.createdAt.toISOString(),
      documentType: (movement.documentType || 'RECEIPT') as 'RECEIPT' | 'CREDIT_NOTE' | 'DEBIT_NOTE' | 'INVOICE',
      referenceId: movement.referenceId,
      description: movement.description,
      debit: movement.debit,
      credit: movement.credit,
      balanceAfter: movement.balanceAfter,
      dueDate: movement.dueDate ? movement.dueDate.toISOString() : undefined,
      amount: movement.amount,
    };
  }

  private mapSupplier(s: {
    id: string;
    companyName: string;
    balance: number;
    currency: string;
    phone?: string | null;
    email?: string | null;
    updatedAt: Date;
  }): CurrentAccountView {
    return {
      id: s.id,
      entityId: s.id,
      entityName: s.companyName,
      entityType: 'SUPPLIER',
      balance: s.balance,
      currency: s.currency,
      overdueAmount: s.balance,
      lastMovementDate: s.updatedAt.toISOString(),
      phone: s.phone,
      email: s.email,
    };
  }
}
