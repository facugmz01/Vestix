import { Injectable, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../core/prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { MovementType } from '../inventory/enums/movement-type.enum';

@Injectable()
export class SalesService {
  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService,
  ) {}

  async createSale(dto: CreateSaleDto) {
    return this.prisma.$transaction(async (tx) => {
      // Idempotency check: if the order ID already exists, return it immediately
      if (dto.id) {
        const existing = await tx.saleOrder.findUnique({ where: { id: dto.id }, include: { lines: true } });
        if (existing) {
          return existing;
        }
      }

      // 1. Calculate Server Total & Gather Historical Details
      let serverSubtotal = 0;
      const orderLines = [];

      for (const line of dto.lines) {
        const variant = await tx.productVariant.findUnique({
          where: { id: line.variantId },
          include: { product: true },
        });

        if (!variant) {
          throw new BadRequestException(`Variant ${line.variantId} not found`);
        }

        const basePrice = line.unitPriceOverride ?? variant.basePrice;
        const discountAmount = basePrice * ((line.discountPct || 0) / 100);
        const lineTotal = (basePrice - discountAmount) * line.quantity;
        
        serverSubtotal += lineTotal;

        orderLines.push({
          variantId: line.variantId,
          categoryId: line.categoryId || variant.product.categoryId,
          quantity: line.quantity,
          basePrice: basePrice,
          discountAmount: discountAmount * line.quantity,
          finalPrice: lineTotal,
          historicalSku: variant.sku,
          historicalName: variant.product.name,
          historicalCost: variant.costPrice,
        });

        // 2. Deduct Stock via InventoryService atomically
        await this.inventoryService.recordMovement(
          {
            variantId: line.variantId,
            quantity: line.quantity,
            type: MovementType.SALE,
            sourceWarehouseId: dto.warehouseId,
            unitCost: variant.costPrice,
          },
          tx, 
        );
      }

      const serverGrandTotal = serverSubtotal - (dto.cartDiscountTotal || 0);

      // 3. Create SaleOrder
      const saleOrder = await tx.saleOrder.create({
        data: {
          id: dto.id || randomUUID(),
          branchId: dto.branchId,
          warehouseId: dto.warehouseId,
          customerId: dto.customerId,
          cashShiftId: dto.cashShiftId,
          source: dto.source || 'POS',
          subtotal: serverSubtotal,
          cartDiscountTotal: dto.cartDiscountTotal || 0,
          grandTotal: serverGrandTotal,
          status: dto.status || 'COMPLETED',
          createdAt: dto.createdAtIso ? new Date(dto.createdAtIso) : new Date(),
          paymentMethod: dto.paymentMethod || 'CASH',
          paymentAccountId: dto.paymentAccountId,
          lines: {
            create: orderLines,
          },
        },
      });

      // 4. Handle Variance if offline POS calculated a different total
      const posTotal = dto.posGrandTotal ?? serverGrandTotal;
      if (Math.abs(serverGrandTotal - posTotal) > 0.01) {
        await tx.saleOrderVariance.create({
          data: {
            orderId: saleOrder.id,
            posTotal: posTotal,
            serverTotal: serverGrandTotal,
            difference: serverGrandTotal - posTotal,
            resolved: false,
          },
        });
      }

      return saleOrder;
    });
  }
}
