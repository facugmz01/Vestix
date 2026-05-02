import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  private mapCustomer(c: any) {
    if (!c) return null;
    const { creditLimit, usedCredit, ...rest } = c;
    return {
      ...rest,
      credit: {
        limit: creditLimit,
        used: usedCredit,
        available: creditLimit - usedCredit
      }
    };
  }

  async create(dto: CreateCustomerDto) {
    if (dto.taxId) {
      const exists = await this.prisma.customer.findUnique({ where: { taxId: dto.taxId } });
      if (exists) throw new ConflictException(`El identificador fiscal ${dto.taxId} ya está registrado`);
    }

    const customer = await this.prisma.customer.create({
      data: {
        type: dto.type || 'INDIVIDUAL',
        fullName: dto.fullName,
        taxId: dto.taxId,
        email: dto.email,
        phone: dto.phone,
        creditLimit: dto.initialCreditLimit || 0,
        isActive: dto.isActive ?? true,
      }
    });

    return this.mapCustomer(customer);
  }

  async findAll(query: any = {}) {
    const page = parseInt(query.page) || 1;
    const pageSize = parseInt(query.pageSize) || 50;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (query.search) {
      where.OR = [
        { fullName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { taxId: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        orderBy: { fullName: 'asc' },
        skip,
        take: pageSize,
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      data: data.map(c => this.mapCustomer(c)),
      total,
      page,
      pageSize
    };
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new NotFoundException('Cliente no encontrado');
    return this.mapCustomer(customer);
  }

  async update(id: string, dto: any) {
    await this.findOne(id);
    
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
}
