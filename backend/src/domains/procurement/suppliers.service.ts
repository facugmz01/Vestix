import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { paginate } from '../../core/prisma/paginate';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { BulkImportBalancesDto } from '../sales/dto/bulk-balances.dto';

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  private mapSupplier(s: any) {
    if (!s) return null;
    const { balance, currency, ...rest } = s;
    return {
      ...rest,
      account: { balance, currency }
    };
  }

  async createSupplier(dto: CreateSupplierDto) {
    const taxId = dto.taxId === '' ? null : dto.taxId;
    const email = dto.email === '' ? null : dto.email;

    if (taxId) {
      const exists = await this.prisma.supplier.findUnique({ where: { taxId } });
      if (exists) throw new ConflictException(`El CUIT ${taxId} ya está registrado`);
    }

    const supplier = await this.prisma.supplier.create({
      data: {
        companyName: dto.companyName,
        contactName: dto.contactName || null,
        taxId: taxId,
        email: email,
        phone: dto.phone || null,
        balance: dto.initialBalance || 0,
        currency: dto.currency || 'ARS',
      }
    });

    return this.mapSupplier(supplier);
  }

  async findAll(query: any = {}) {
    const result = await paginate(this.prisma.supplier, query, {
      searchFields: ['companyName', 'contactName', 'taxId'],
      orderBy: { companyName: 'asc' },
    });

    return {
      ...result,
      data: result.data.map(s => this.mapSupplier(s)),
    };
  }

  async getSupplier(id: string) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id } });
    if (!supplier) throw new NotFoundException('Proveedor no encontrado');
    return this.mapSupplier(supplier);
  }

  async updateSupplier(id: string, dto: any) {
    await this.getSupplier(id);
    
    // Clean empty strings for unique fields
    if (dto.taxId === '') dto.taxId = null;
    if (dto.email === '') dto.email = null;

    const updated = await this.prisma.supplier.update({
      where: { id },
      data: dto,
    });
    return this.mapSupplier(updated);
  }

  async deleteSupplier(id: string) {
    await this.getSupplier(id);
    return this.prisma.supplier.delete({ where: { id } });
  }

  async bulkImportBalances(dto: BulkImportBalancesDto) {
    return this.prisma.$transaction(async (tx) => {
      let updatedCount = 0;
      const notFound = [];

      for (const row of dto.rows) {
        // Try to find the supplier by taxId, then email, then companyName
        let supplier = null;
        if (row.identifier) {
          supplier = await tx.supplier.findFirst({
            where: { taxId: row.identifier }
          });

          if (!supplier) {
            const byEmail = await tx.supplier.findMany({
              where: { email: { equals: row.identifier, mode: 'insensitive' } }
            });
            if (byEmail.length === 1) supplier = byEmail[0];
          }

          if (!supplier) {
            const byName = await tx.supplier.findMany({
              where: { companyName: { equals: row.identifier, mode: 'insensitive' } }
            });
            if (byName.length === 1) supplier = byName[0];
          }
        }

        if (!supplier) {
          notFound.push(row.identifier);
          continue;
        }

        const newBalance = dto.resolution === 'overwrite' 
          ? row.balance 
          : supplier.balance + row.balance;

        await tx.supplier.update({
          where: { id: supplier.id },
          data: { balance: newBalance }
        });

        updatedCount++;
      }

      return { success: true, updatedCount, notFound };
    });
  }
}
