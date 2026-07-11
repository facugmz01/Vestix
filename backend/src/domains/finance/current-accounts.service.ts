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

    const manualRows = manualMovements.map(m => ({
      id: m.referenceId,
      type: m.credit > 0 ? 'CREDIT' : 'DEBIT',
      concept: m.description,
      amount: m.amount,
      createdAt: m.createdAt.toISOString(),
      balanceAfter: m.balanceAfter,
    }));

    if (account.entityType === 'CUSTOMER') {
      const orders = await this.prisma.saleOrder.findMany({
        where: { customerId: accountId, paymentMethod: 'CUSTOMER_CREDIT' },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      });
      const total = await this.prisma.saleOrder.count({
        where: { customerId: accountId, paymentMethod: 'CUSTOMER_CREDIT' },
      });

      return {
        data: [...manualRows, ...orders.map(o => ({
          id: o.id,
          type: 'DEBIT',
          concept: formatSaleId(o.id, o.status),
          amount: o.grandTotal,
          createdAt: o.createdAt.toISOString(),
          balanceAfter: 0,
        }))].slice((page - 1) * pageSize, page * pageSize),
        total: total + manualRows.length,
        page,
        pageSize,
      };
    }

    const pos = await this.prisma.purchaseOrder.findMany({
      where: { supplierId: accountId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    const total = await this.prisma.purchaseOrder.count({ where: { supplierId: accountId } });

    return {
      data: [...manualRows, ...pos.map(po => ({
        id: po.id,
        type: 'CREDIT',
        concept: formatEntityId(po.id, 'OC-'),
        amount: po.totalAmount,
        createdAt: po.createdAt.toISOString(),
        balanceAfter: 0,
      }))].slice((page - 1) * pageSize, page * pageSize),
      total: total + manualRows.length,
      page,
      pageSize,
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
      referenceId: string;
      description: string;
      amount: number;
      credit: number;
      debit: number;
      balanceAfter: number;
      createdAt: Date;
    },
    entityType: 'CUSTOMER' | 'SUPPLIER',
  ) {
    const isCustomerCredit = entityType === 'CUSTOMER' && movement.credit > 0;
    const isSupplierDebit = entityType === 'SUPPLIER' && movement.debit > 0;
    return {
      id: movement.referenceId,
      type: isCustomerCredit || isSupplierDebit ? ('CREDIT' as const) : ('DEBIT' as const),
      concept: movement.description,
      amount: movement.amount,
      createdAt: movement.createdAt.toISOString(),
      balanceAfter: movement.balanceAfter,
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
