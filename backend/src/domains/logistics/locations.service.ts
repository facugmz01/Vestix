import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { paginate } from '../../core/prisma/paginate';

export interface CreateLocationDto {
  warehouseId: string;
  code: string;
  name?: string;
  type?: string;
  barcode?: string;
  isActive?: boolean;
}

export type UpdateLocationDto = Partial<CreateLocationDto>;

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: Record<string, any> = {}) {
    const extraWhere: Record<string, any> = {};
    if (query.warehouseId) extraWhere.warehouseId = query.warehouseId;
    if (query.type) extraWhere.type = query.type;
    if (query.isActive !== undefined) extraWhere.isActive = query.isActive === 'true' || query.isActive === true;

    const result = await paginate(this.prisma.warehouseLocation, query, {
      searchFields: ['code', 'name', 'barcode'],
      where: extraWhere,
      orderBy: { code: 'asc' },
      include: {
        warehouse: { include: { branch: true } },
      },
    });

    return {
      ...result,
      data: result.data.map((row: any) => this.mapLocation(row)),
    };
  }

  async findOne(id: string) {
    const row = await this.prisma.warehouseLocation.findUnique({
      where: { id },
      include: { warehouse: { include: { branch: true } } },
    });
    if (!row) throw new NotFoundException('Ubicación no encontrada');
    return this.mapLocation(row);
  }

  async create(dto: CreateLocationDto) {
    const warehouse = await this.prisma.warehouse.findUnique({ where: { id: dto.warehouseId } });
    if (!warehouse) throw new NotFoundException('Depósito no encontrado');

    const exists = await this.prisma.warehouseLocation.findUnique({
      where: { warehouseId_code: { warehouseId: dto.warehouseId, code: dto.code } },
    });
    if (exists) {
      throw new ConflictException(`Ya existe la ubicación "${dto.code}" en este depósito`);
    }

    const row = await this.prisma.warehouseLocation.create({
      data: {
        warehouseId: dto.warehouseId,
        code: dto.code.trim(),
        name: dto.name?.trim(),
        type: dto.type || 'BIN',
        barcode: dto.barcode?.trim(),
        isActive: dto.isActive ?? true,
      },
      include: { warehouse: { include: { branch: true } } },
    });
    return this.mapLocation(row);
  }

  async update(id: string, dto: UpdateLocationDto) {
    await this.findOne(id);

    if (dto.code && dto.warehouseId) {
      const conflict = await this.prisma.warehouseLocation.findFirst({
        where: {
          warehouseId: dto.warehouseId,
          code: dto.code,
          NOT: { id },
        },
      });
      if (conflict) {
        throw new ConflictException(`Ya existe la ubicación "${dto.code}" en este depósito`);
      }
    }

    const row = await this.prisma.warehouseLocation.update({
      where: { id },
      data: {
        ...(dto.warehouseId !== undefined ? { warehouseId: dto.warehouseId } : {}),
        ...(dto.code !== undefined ? { code: dto.code.trim() } : {}),
        ...(dto.name !== undefined ? { name: dto.name?.trim() } : {}),
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.barcode !== undefined ? { barcode: dto.barcode?.trim() } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
      include: { warehouse: { include: { branch: true } } },
    });
    return this.mapLocation(row);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.warehouseLocation.delete({ where: { id } });
    return { success: true };
  }

  private mapLocation(row: any) {
    return {
      id: row.id,
      code: row.code,
      name: row.name ?? undefined,
      warehouseId: row.warehouseId,
      type: row.type,
      barcode: row.barcode ?? undefined,
      isActive: row.isActive,
      createdAt: row.createdAt.toISOString(),
      warehouseName: row.warehouse?.name,
      branchName: row.warehouse?.branch?.name,
    };
  }
}
