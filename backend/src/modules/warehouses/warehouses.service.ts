import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';

@Injectable()
export class WarehousesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateWarehouseDto) {
    if (dto.code) {
      const exists = await this.prisma.warehouse.findUnique({ where: { code: dto.code } });
      if (exists) throw new ConflictException(`El código de depósito "${dto.code}" ya existe`);
    }

    return this.prisma.warehouse.create({
      data: {
        name: dto.name,
        code: dto.code,
        type: dto.type || 'STORAGE',
        address: dto.address,
        branchId: dto.branchId,
        isActive: dto.isActive ?? true,
      },
      include: { branch: true }
    });
  }

  async findAll(query: any = {}) {
    const page = parseInt(query.page) || 1;
    const pageSize = parseInt(query.pageSize) || 50;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (query.branchId) where.branchId = query.branchId;
    if (query.type) where.type = query.type;
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true';
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.warehouse.findMany({
        where,
        include: { branch: true },
        orderBy: { name: 'asc' },
        skip,
        take: pageSize,
      }),
      this.prisma.warehouse.count({ where }),
    ]);

    return { data, total, page, pageSize };
  }

  async findOne(id: string) {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id },
      include: { branch: true }
    });
    if (!warehouse) throw new NotFoundException(`Depósito ${id} no encontrado`);
    return warehouse;
  }

  async update(id: string, dto: UpdateWarehouseDto) {
    await this.findOne(id);
    
    if (dto.code) {
      const exists = await this.prisma.warehouse.findFirst({ 
        where: { code: dto.code, id: { not: id } } 
      });
      if (exists) throw new ConflictException(`El código de depósito "${dto.code}" ya está en uso`);
    }

    return this.prisma.warehouse.update({
      where: { id },
      data: dto,
      include: { branch: true }
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.warehouse.delete({ where: { id } });
  }
}
