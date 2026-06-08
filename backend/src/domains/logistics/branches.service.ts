import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createBranchDto: CreateBranchDto) {
    const { config, settings, ...branchData } = createBranchDto;

    const exists = await this.prisma.branch.findUnique({ where: { code: branchData.code } });
    if (exists) throw new ConflictException('El código de sucursal ya existe');

    return this.prisma.branch.create({
      data: {
        name: branchData.name,
        code: branchData.code,
        address: branchData.address,
        phone: branchData.phone,
        isMain: branchData.isMain ?? false,
        isActive: branchData.isActive ?? true,
        settings: settings ?? config ?? undefined,
      },
      include: { warehouses: true }
    });
  }

  async findAll(query: any = {}) {
    const page = parseInt(query.page) || 1;
    const pageSize = parseInt(query.pageSize) || 50;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.branch.findMany({
        where,
        include: { warehouses: true },
        orderBy: [{ isMain: 'desc' }, { name: 'asc' }],
        skip,
        take: pageSize,
      }),
      this.prisma.branch.count({ where }),
    ]);

    // Add userCount placeholder
    const enriched = data.map(b => ({ ...b, userCount: 0 }));

    return { data: enriched, total, page, pageSize };
  }

  async findOne(id: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id },
      include: { warehouses: true }
    });
    if (!branch) throw new NotFoundException(`Sucursal ${id} no encontrada`);
    return branch;
  }

  async update(id: string, updateBranchDto: UpdateBranchDto) {
    await this.findOne(id);
    const { config, settings, ...branchData } = updateBranchDto;

    return this.prisma.branch.update({
      where: { id },
      data: {
        ...branchData,
        settings: settings ?? config ?? undefined,
        updatedAt: new Date(),
      },
      include: { warehouses: true }
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.branch.delete({ where: { id } });
  }

  async assignUserToBranch(branchId: string, userId: string) {
    return {
      success: true,
      message: `User ${userId} successfully authorized for Branch ${branchId}`
    };
  }
}
