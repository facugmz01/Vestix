import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { OpenShiftDto, CloseShiftDto } from './dto/treasury.dto';

@Injectable()
export class TreasuryService {
  constructor(private prisma: PrismaService) {}

  async getActiveShift(userId: string) {
    return this.prisma.cashShift.findFirst({
      where: {
        openedByUserId: userId,
        status: 'OPEN',
      },
      include: {
        cashRegister: true,
      },
    });
  }

  async openShift(dto: OpenShiftDto, userId: string) {
    // Check if user already has an open shift
    const existing = await this.getActiveShift(userId);
    if (existing) {
      throw new BadRequestException('User already has an open shift');
    }

    // Check if register is already open by someone else
    const registerOpen = await this.prisma.cashShift.findFirst({
      where: {
        cashRegisterId: dto.cashRegisterId,
        status: 'OPEN',
      },
    });
    if (registerOpen) {
      throw new BadRequestException('Cash register is already open by another user');
    }

    return this.prisma.cashShift.create({
      data: {
        cashRegisterId: dto.cashRegisterId,
        openedByUserId: userId,
        openingAmount: dto.openingAmount,
        status: 'OPEN',
      },
    });
  }

  async closeShift(dto: CloseShiftDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const shift = await tx.cashShift.findUnique({
        where: { id: dto.shiftId },
        include: { sales: true },
      });

      if (!shift) throw new BadRequestException('Shift not found');
      if (shift.status !== 'OPEN') throw new BadRequestException('Shift is already closed');
      if (shift.openedByUserId !== userId) throw new BadRequestException('You can only close your own shift');

      // Calculate expected amount
      // expected = openingAmount + sum(sales paid in cash)
      // For MVP, assuming all POS sales in this shift were cash or that the sales total applies.
      // We will sum the grandTotal of sales that are CASH.
      let cashSalesTotal = 0;
      for (const sale of shift.sales) {
        if (sale.paymentMethod === 'CASH') {
          cashSalesTotal += sale.grandTotal;
        }
      }

      const expectedAmount = shift.openingAmount + cashSalesTotal;
      const difference = dto.closingAmount - expectedAmount;

      const closedShift = await tx.cashShift.update({
        where: { id: shift.id },
        data: {
          status: 'CLOSED',
          closedByUserId: userId,
          closedAt: new Date(),
          closingAmount: dto.closingAmount,
          expectedAmount: expectedAmount,
          difference: difference,
          notes: dto.notes,
        },
      });

      return closedShift;
    });
  }

  async findAllShifts(filters: any) {
    const { page = 1, pageSize = 15, status } = filters;
    const skip = (page - 1) * pageSize;
    const where: any = {};

    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.cashShift.findMany({
        where,
        skip,
        take: Number(pageSize),
        orderBy: { openedAt: 'desc' },
        include: { cashRegister: true },
      }),
      this.prisma.cashShift.count({ where }),
    ]);

    return { data, total, page: Number(page), pageSize: Number(pageSize) };
  }

  async findOneShift(id: string) {
    return this.prisma.cashShift.findUnique({
      where: { id },
      include: {
        cashRegister: true,
        sales: true,
      },
    });
  }

  async getShiftMovements(shiftId: string) {
    // Treasury movements are not yet fully modeled in Prisma Schema MVP.
    // Returning empty array to prevent 404 crashes in frontend UI.
    return [];
  }

  async createMovement(shiftId: string, payload: any, userId: string) {
    throw new BadRequestException('Treasury movements are not implemented in the current schema version');
  }
}
