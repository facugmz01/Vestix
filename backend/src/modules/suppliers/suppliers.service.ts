import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';

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
    const page = parseInt(query.page) || 1;
    const pageSize = parseInt(query.pageSize) || 50;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (query.search) {
      where.OR = [
        { companyName: { contains: query.search, mode: 'insensitive' } },
        { contactName: { contains: query.search, mode: 'insensitive' } },
        { taxId: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        orderBy: { companyName: 'asc' },
        skip,
        take: pageSize,
      }),
      this.prisma.supplier.count({ where }),
    ]);

    return {
      data: data.map(s => this.mapSupplier(s)),
      total,
      page,
      pageSize
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
}
