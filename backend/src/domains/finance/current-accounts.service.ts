import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

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
          concept: `Venta ${o.id.split('-')[0].toUpperCase()}`,
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
        concept: `OC ${po.id.split('-')[0].toUpperCase()}`,
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
    };
  }

  private mapSupplier(s: {
    id: string;
    companyName: string;
    balance: number;
    currency: string;
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
    };
  }
}
