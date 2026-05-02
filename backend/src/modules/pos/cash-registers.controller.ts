import { Controller, Get, Post, Body, Param, Patch, Delete, Query, ParseUUIDPipe } from '@nestjs/common';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';
import { PrismaService } from '../../core/prisma/prisma.service';
import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsUUID } from 'class-validator';

class CreateCashRegisterDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() code: string;
  @IsUUID('4') @IsNotEmpty() branchId: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

@Controller('cash-registers')
export class CashRegistersController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  async create(@Body() dto: CreateCashRegisterDto) {
    return this.prisma.cashRegister.create({
      data: {
        name: dto.name,
        code: dto.code,
        branchId: dto.branchId,
        isActive: dto.isActive ?? true,
      },
      include: { branch: true }
    });
  }

  @Get()
  @RequirePermissions({ action: 'read', subject: 'Settings' })
  async findAll(@Query() query: any) {
    const page = parseInt(query.page) || 1;
    const pageSize = parseInt(query.pageSize) || 15;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (query.branchId) where.branchId = query.branchId;
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true';

    const [data, total] = await Promise.all([
      this.prisma.cashRegister.findMany({
        where,
        include: { branch: true },
        orderBy: { name: 'asc' },
        skip,
        take: pageSize,
      }),
      this.prisma.cashRegister.count({ where }),
    ]);

    return { data, total, page, pageSize };
  }

  @Get(':id')
  @RequirePermissions({ action: 'read', subject: 'Settings' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.prisma.cashRegister.findUniqueOrThrow({
      where: { id },
      include: { branch: true }
    });
  }

  @Patch(':id')
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: Partial<CreateCashRegisterDto>) {
    return this.prisma.cashRegister.update({
      where: { id },
      data: dto,
      include: { branch: true }
    });
  }

  @Delete(':id')
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.prisma.cashRegister.delete({ where: { id } });
  }
}
