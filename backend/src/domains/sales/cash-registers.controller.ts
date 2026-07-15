import { Controller, Get, Post, Body, Param, Patch, Delete, Query, ParseUUIDPipe, BadRequestException } from '@nestjs/common';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../../core/rbac/guards/permissions.guard';
import { PrismaService } from '../../core/prisma/prisma.service';
import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsUUID } from 'class-validator';

class CreateCashRegisterDto {
  @IsString() @IsNotEmpty() name: string;

  @IsOptional() @IsString() code?: string;

  @IsUUID('4') @IsNotEmpty() branchId: string;

  @IsOptional() @IsBoolean() isActive?: boolean;

  /** Cuenta de tesorería (CASH) donde impactan los cobros en efectivo de esta caja POS */
  @IsOptional() @IsUUID('4') treasuryAccountId?: string;
}

@Controller('cash-registers')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class CashRegistersController {
  constructor(private readonly prisma: PrismaService) {}

  private async linkTreasuryAccount(cashRegisterId: string, registerName: string, treasuryAccountId?: string | null) {
    if (!treasuryAccountId) return;

    const account = await this.prisma.financialAccount.findUnique({ where: { id: treasuryAccountId } });
    if (!account) throw new BadRequestException('La cuenta de tesorería no existe');
    if (account.type !== 'CASH') {
      throw new BadRequestException('La caja POS debe vincularse a una cuenta de tipo CASH.');
    }

    const existing = await this.prisma.paymentMethod.findFirst({
      where: { cashRegisterId, type: 'CASH' },
    });

    if (existing) {
      await this.prisma.paymentMethod.update({
        where: { id: existing.id },
        data: { accountId: treasuryAccountId, isActive: true, name: `Efectivo — ${registerName}` },
      });
    } else {
      await this.prisma.paymentMethod.create({
        data: {
          name: `Efectivo — ${registerName}`,
          type: 'CASH',
          cashRegisterId,
          accountId: treasuryAccountId,
          isActive: true,
        },
      });
    }
  }

  private mapRegister(reg: any) {
    const cashPm = (reg.paymentMethods || []).find((pm: any) => pm.type === 'CASH');
    return {
      ...reg,
      treasuryAccountId: cashPm?.accountId || null,
      treasuryAccountName: cashPm?.account?.name || null,
      branchName: reg.branch?.name,
      paymentMethods: undefined,
    };
  }

  @Post()
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  async create(@Body() dto: CreateCashRegisterDto) {
    const code = dto.code || dto.name.toUpperCase().replace(/\s+/g, '-') + '-' + Math.random().toString(36).substring(2, 6);

    const reg = await this.prisma.cashRegister.create({
      data: {
        name: dto.name,
        code: code,
        branchId: dto.branchId,
        isActive: dto.isActive ?? true,
      },
      include: {
        branch: true,
        paymentMethods: { include: { account: true } },
      },
    });

    if (dto.treasuryAccountId) {
      await this.linkTreasuryAccount(reg.id, reg.name, dto.treasuryAccountId);
    }

    const fresh = await this.prisma.cashRegister.findUniqueOrThrow({
      where: { id: reg.id },
      include: { branch: true, paymentMethods: { include: { account: true } } },
    });
    return this.mapRegister(fresh);
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

    const [rows, total] = await Promise.all([
      this.prisma.cashRegister.findMany({
        where,
        include: {
          branch: true,
          paymentMethods: { include: { account: true } },
        },
        orderBy: { name: 'asc' },
        skip,
        take: pageSize,
      }),
      this.prisma.cashRegister.count({ where }),
    ]);

    return { data: rows.map((r) => this.mapRegister(r)), total, page, pageSize };
  }

  @Get(':id')
  @RequirePermissions({ action: 'read', subject: 'Settings' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const reg = await this.prisma.cashRegister.findUniqueOrThrow({
      where: { id },
      include: { branch: true, paymentMethods: { include: { account: true } } },
    });
    return this.mapRegister(reg);
  }

  @Patch(':id')
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: Partial<CreateCashRegisterDto>) {
    const { treasuryAccountId, ...rest } = dto as CreateCashRegisterDto;
    const reg = await this.prisma.cashRegister.update({
      where: { id },
      data: rest,
      include: { branch: true, paymentMethods: { include: { account: true } } },
    });

    if (treasuryAccountId !== undefined) {
      await this.linkTreasuryAccount(reg.id, reg.name, treasuryAccountId || null);
    }

    const fresh = await this.prisma.cashRegister.findUniqueOrThrow({
      where: { id },
      include: { branch: true, paymentMethods: { include: { account: true } } },
    });
    return this.mapRegister(fresh);
  }

  @Delete(':id')
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.prisma.cashRegister.delete({ where: { id } });
  }
}
