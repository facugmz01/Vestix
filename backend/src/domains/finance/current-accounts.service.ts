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
        data: orders.map(o => ({
          id: o.id,
          type: 'DEBIT',
          concept: formatSaleId(o.id, o.status),
          amount: o.grandTotal,
          createdAt: o.createdAt.toISOString(),
          balanceAfter: 0,
        })),
        total,
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
      data: pos.map(po => ({
        id: po.id,
        type: 'CREDIT',
        concept: formatEntityId(po.id, 'OC-'),
        amount: po.totalAmount,
        createdAt: po.createdAt.toISOString(),
        balanceAfter: 0,
      })),
      total,
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
    if (payload.amount <= 0) {
      throw new BadRequestException('El monto debe ser mayor a cero');
    }

    const customer = await this.prisma.customer.findUnique({ where: { id: accountId } });
    if (customer) {
      const updated = await this.prisma.customer.update({
        where: { id: accountId },
        data: { usedCredit: { decrement: payload.amount } },
      });
      return {
        id: payload.referenceId,
        type: 'CREDIT' as const,
        concept: payload.description || 'Recibo de cobro',
        amount: payload.amount,
        createdAt: new Date().toISOString(),
        balanceAfter: Math.max(0, updated.usedCredit),
      };
    }

    const supplier = await this.prisma.supplier.findUnique({ where: { id: accountId } });
    if (supplier) {
      const updated = await this.prisma.supplier.update({
        where: { id: accountId },
        data: { balance: { decrement: payload.amount } },
      });
      return {
        id: payload.referenceId,
        type: 'DEBIT' as const,
        concept: payload.description || 'Pago a proveedor',
        amount: payload.amount,
        createdAt: new Date().toISOString(),
        balanceAfter: Math.max(0, updated.balance),
      };
    }

    throw new NotFoundException('Cuenta corriente no encontrada');
  }

  async issueCreditNote(
    accountId: string,
    payload: { amount: number; referenceId: string; description: string },
  ) {
    if (payload.amount <= 0) {
      throw new BadRequestException('El monto debe ser mayor a cero');
    }

    const customer = await this.prisma.customer.findUnique({ where: { id: accountId } });
    if (customer) {
      const updated = await this.prisma.customer.update({
        where: { id: accountId },
        data: { usedCredit: { decrement: payload.amount } },
      });
      return {
        id: payload.referenceId,
        type: 'CREDIT' as const,
        concept: payload.description || 'Nota de crédito',
        amount: payload.amount,
        createdAt: new Date().toISOString(),
        balanceAfter: Math.max(0, updated.usedCredit),
      };
    }

    const supplier = await this.prisma.supplier.findUnique({ where: { id: accountId } });
    if (supplier) {
      const updated = await this.prisma.supplier.update({
        where: { id: accountId },
        data: { balance: { decrement: payload.amount } },
      });
      return {
        id: payload.referenceId,
        type: 'DEBIT' as const,
        concept: payload.description || 'Nota de crédito proveedor',
        amount: payload.amount,
        createdAt: new Date().toISOString(),
        balanceAfter: Math.max(0, updated.balance),
      };
    }

    throw new NotFoundException('Cuenta corriente no encontrada');
  }

  async issueDebitNote(
    accountId: string,
    payload: { amount: number; referenceId: string; description: string; dueDate?: string },
  ) {
    if (payload.amount <= 0) {
      throw new BadRequestException('El monto debe ser mayor a cero');
    }

    const customer = await this.prisma.customer.findUnique({ where: { id: accountId } });
    if (customer) {
      const updated = await this.prisma.customer.update({
        where: { id: accountId },
        data: { usedCredit: { increment: payload.amount } },
      });
      return {
        id: payload.referenceId,
        type: 'DEBIT' as const,
        concept: payload.description || 'Nota de débito',
        amount: payload.amount,
        createdAt: new Date().toISOString(),
        balanceAfter: updated.usedCredit,
      };
    }

    const supplier = await this.prisma.supplier.findUnique({ where: { id: accountId } });
    if (supplier) {
      const updated = await this.prisma.supplier.update({
        where: { id: accountId },
        data: { balance: { increment: payload.amount } },
      });
      return {
        id: payload.referenceId,
        type: 'CREDIT' as const,
        concept: payload.description || 'Nota de débito proveedor',
        amount: payload.amount,
        createdAt: new Date().toISOString(),
        balanceAfter: updated.balance,
      };
    }

    throw new NotFoundException('Cuenta corriente no encontrada');
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
