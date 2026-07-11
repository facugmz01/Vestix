import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { paginate } from '../../core/prisma/paginate';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { BulkImportBalancesDto } from './dto/bulk-balances.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  private mapCustomer(c: any) {
    if (!c) return null;
    const { creditLimit, usedCredit, ...rest } = c;
    return {
      ...rest,
      source: c.source || 'ADMIN',
      credit: {
        limit: creditLimit,
        used: usedCredit,
        available: creditLimit - usedCredit,
        onHold: false,
      }
    };
  }

  async create(dto: CreateCustomerDto) {
    const taxId = dto.taxId === '' ? null : dto.taxId;
    const email = dto.email === '' ? null : dto.email;

    if (taxId) {
      const exists = await this.prisma.customer.findUnique({ where: { taxId } });
      if (exists) throw new ConflictException(`El identificador fiscal ${taxId} ya está registrado`);
    }

    const customer = await this.prisma.customer.create({
      data: {
        type: dto.type || 'INDIVIDUAL',
        source: 'ADMIN',
        fullName: dto.fullName,
        taxId: taxId,
        email: email,
        phone: dto.phone || null,
        creditLimit: dto.initialCreditLimit || 0,
        isActive: dto.isActive ?? true,
        priceListId: dto.priceListId || null,
        taxCondition: dto.taxCondition || null,
      }
    });

    return this.mapCustomer(customer);
  }

  async findAll(query: any = {}) {
    const extraWhere: Record<string, unknown> = {};
    if (query.type) extraWhere.type = query.type;
    if (query.source) extraWhere.source = query.source;
    if (query.isActive === 'true' || query.isActive === true) extraWhere.isActive = true;
    if (query.isActive === 'false' || query.isActive === false) extraWhere.isActive = false;

    const result = await paginate(this.prisma.customer, query, {
      searchFields: ['fullName', 'email', 'taxId', 'phone'],
      where: extraWhere,
      orderBy: { createdAt: 'desc' },
    });

    return {
      ...result,
      data: result.data.map(c => this.mapCustomer(c)),
    };
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new NotFoundException('Cliente no encontrado');
    return this.mapCustomer(customer);
  }

  async getHistory(id: string) {
    await this.findOne(id);

    const orders = await this.prisma.saleOrder.findMany({
      where: { customerId: id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        source: true,
        grandTotal: true,
        status: true,
        paymentMethod: true,
        createdAt: true,
      },
    });

    return orders.map((o) => ({
      id: o.id,
      source: o.source,
      grandTotal: o.grandTotal,
      status: o.status,
      paymentMethod: o.paymentMethod || '—',
      createdAt: o.createdAt,
    }));
  }

  async update(id: string, dto: any) {
    await this.findOne(id);
    
    if (dto.taxId === '') dto.taxId = null;
    if (dto.email === '') dto.email = null;
    if (dto.priceListId === '') dto.priceListId = null;
    if (dto.taxCondition === '') dto.taxCondition = null;

    if (dto.taxId) {
      const exists = await this.prisma.customer.findFirst({ 
        where: { taxId: dto.taxId, id: { not: id } } 
      });
      if (exists) throw new ConflictException(`El identificador fiscal ${dto.taxId} ya está en uso`);
    }

    const updated = await this.prisma.customer.update({
      where: { id },
      data: dto,
    });
    return this.mapCustomer(updated);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.customer.delete({ where: { id } });
  }

  async repayCredit(id: string, amount: number, reference: string) {
    return this.prisma.customer.update({
      where: { id },
      data: {
        usedCredit: { decrement: amount },
        updatedAt: new Date(),
      }
    });
  }

  async chargeCredit(id: string, amount: number, reference: string) {
    const raw = await this.prisma.customer.findUniqueOrThrow({ where: { id } });
    if (raw.usedCredit + amount > raw.creditLimit) {
      // Warning or stop logic could go here
    }

    return this.prisma.customer.update({
      where: { id },
      data: {
        usedCredit: { increment: amount },
        updatedAt: new Date(),
      }
    });
  }

  async bulkImportBalances(dto: BulkImportBalancesDto) {
    return this.prisma.$transaction(async (tx) => {
      let updatedCount = 0;
      const notFound = [];

      for (const row of dto.rows) {
        // Try to find the customer by taxId, then email, then fullName
        let customer = null;
        if (row.identifier) {
          customer = await tx.customer.findFirst({
            where: { taxId: row.identifier }
          });

          if (!customer) {
            const byEmail = await tx.customer.findMany({
              where: { email: { equals: row.identifier, mode: 'insensitive' } }
            });
            if (byEmail.length === 1) customer = byEmail[0];
          }

          if (!customer) {
            const byName = await tx.customer.findMany({
              where: { fullName: { equals: row.identifier, mode: 'insensitive' } }
            });
            if (byName.length === 1) customer = byName[0];
          }
        }

        if (!customer) {
          notFound.push(row.identifier);
          continue;
        }

        const newUsedCredit = dto.resolution === 'overwrite' 
          ? row.balance 
          : customer.usedCredit + row.balance;

        await tx.customer.update({
          where: { id: customer.id },
          data: { usedCredit: newUsedCredit }
        });

        updatedCount++;
      }

      return { success: true, updatedCount, notFound };
    });
  }
}
