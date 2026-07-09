import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { BulkImportSalesDto } from './dto/bulk-sales.dto';
import { v4 as uuidv4 } from 'uuid';

import { CatalogFacade } from '../catalog/catalog.facade';
import { SaleOrderRepository } from './repositories/sale-order.repository';

@Injectable()
export class SalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: SaleOrderRepository,
    private readonly catalogFacade: CatalogFacade
  ) { }

  /**
   * Domain-specific read operations.
   * All complex writes have been offloaded to the CheckoutOrchestrator.
   */
  async getOrderById(id: string) {
    const order = await this.repository.findById(id);

    if (order) {
      const variantIds = order.lines.map(l => l.variantId);
      const variants = await this.catalogFacade.getVariantsDetails(variantIds);
      const variantMap = new Map<string, any>(variants.map((v: any) => [v.id, v]));

      (order as any).lines = order.lines.map(l => {
        const variant = variantMap.get(l.variantId) as
          | { sku?: string; product?: { name?: string } | null }
          | undefined;
        const productName =
          l.historicalName ||
          variant?.product?.name ||
          null;
        const variantSku =
          l.historicalSku ||
          variant?.sku ||
          null;

        return {
          ...l,
          variant,
          productName,
          variantSku,
        };
      });

      (order as any).customerName =
        order.customer?.fullName || (order as any).customerName || 'Consumidor Final';
    }

    return order;
  }

  async listRecentOrders(branchId: string) {
    return this.repository.findRecentByBranch(branchId);
  }

  async getOrders(params: { page?: any; pageSize?: any; search?: string; status?: string }) {
    const page = parseInt(params.page) || 1;
    const pageSize = parseInt(params.pageSize) || 15;
    const skip = (page - 1) * pageSize;
    const { search, status } = params;

    const where: any = {};
    if (status) where.status = status;
    if (search && search.trim() !== '') {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { customer: { fullName: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const { data, total } = await this.repository.findPaginated(where, skip, pageSize);

    return { 
      data: data.map(order => ({
        ...order,
        customerName: order.customer?.fullName || 'Consumidor Final'
      })), 
      total 
    };
  }
  async updateOrderStatus(id: string, status: string) {
    return this.repository.updateStatus(id, status);
  }
  async bulkImportSales(dto: BulkImportSalesDto) {
    return this.prisma.$transaction(async (tx) => {
      // Group rows by orderId
      const groupedOrders: Record<string, typeof dto.rows> = {};
      for (const row of dto.rows) {
        if (!groupedOrders[row.orderId]) {
          groupedOrders[row.orderId] = [];
        }
        groupedOrders[row.orderId].push(row);
      }

      let createdCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const [externalOrderId, lines] of Object.entries(groupedOrders)) {
        try {
          const firstLine = lines[0];
          let customerId = null;

          // Resolve Customer
          if (firstLine.customerIdentifier) {
            const ident = firstLine.customerIdentifier.trim();
            const customer = await tx.customer.findFirst({
              where: {
                OR: [
                  { email: { equals: ident, mode: 'insensitive' } },
                  { taxId: ident },
                  { fullName: { equals: ident, mode: 'insensitive' } }
                ]
              }
            });

            if (customer) {
              customerId = customer.id;
            } else {
              const newCust = await tx.customer.create({
                data: {
                  type: 'INDIVIDUAL',
                  fullName: ident,
                  email: ident.includes('@') ? ident : null,
                  isActive: true
                }
              });
              customerId = newCust.id;
            }
          }

          // Resolve SKUs
          const orderLinesData = [];
          let subtotal = 0;

          for (const line of lines) {
            const variant = await tx.productVariant.findUnique({
              where: { sku: line.sku },
              include: { product: true }
            });

            if (!variant) {
              throw new Error(`SKU no encontrado: ${line.sku}`);
            }

            const lineTotal = line.quantity * line.unitPrice;
            subtotal += lineTotal;

            orderLinesData.push({
              id: uuidv4(),
              variantId: variant.id,
              categoryId: variant.product.categoryId,
              quantity: line.quantity,
              basePrice: line.unitPrice,
              discountAmount: 0,
              finalPrice: lineTotal,
              historicalSku: variant.sku,
              historicalName: variant.product.name,
              historicalCost: variant.costPrice
            });

            // Handle Stock
            if (dto.updateStock) {
              // Create Inventory Movement (Output)
              const wh = await tx.warehouse.findFirst({ where: { branchId: dto.branchId }});
              if (wh) {
                await tx.inventoryMovement.create({
                  data: {
                    variantId: variant.id,
                    sourceWarehouseId: wh.id,
                    type: 'SALE',
                    quantity: -line.quantity,
                    unitCost: variant.costPrice,
                    referenceId: externalOrderId
                  }
                });

                // Update Stock Level
                const stockLevel = await tx.stockLevel.findFirst({
                  where: { variantId: variant.id, warehouseId: wh.id }
                });
                if (stockLevel) {
                  await tx.stockLevel.update({
                    where: { id: stockLevel.id },
                    data: {
                      physicalQuantity: { decrement: line.quantity },
                      availableQuantity: { decrement: line.quantity }
                    }
                  });
                }
              }
            }
          }

          // Create the Order
          const orderId = uuidv4();
          await tx.saleOrder.create({
            data: {
              id: orderId,
              branchId: dto.branchId,
              source: 'IMPORT',
              customerId,
              subtotal,
              cartDiscountTotal: 0,
              grandTotal: subtotal,
              paymentMethod: dto.paymentResolution === 'PAID_CASH' ? 'CASH' : 'CUSTOMER_CREDIT',
              status: 'COMPLETED',
              createdAt: firstLine.date ? new Date(firstLine.date) : new Date(),
              lines: {
                create: orderLinesData
              }
            }
          });

          // EVENT BOUNDARY
          await tx.outboxEvent.create({
            data: {
              aggregate: 'SaleOrder',
              aggregateId: orderId,
              type: 'ORDER_CREATED',
              payload: { orderId: orderId, branchId: dto.branchId, status: 'COMPLETED', grandTotal: subtotal }
            }
          });

          // Handle Payments/Debt
          let finalPaymentStatus = dto.paymentResolution;
          if (finalPaymentStatus === 'FROM_CSV' && firstLine.paymentStatus) {
            const ps = firstLine.paymentStatus.toUpperCase();
            if (ps.includes('PAGAD') || ps.includes('EFECTIVO') || ps.includes('CASH')) {
              finalPaymentStatus = 'PAID_CASH';
            } else {
              finalPaymentStatus = 'CURRENT_ACCOUNT';
            }
          }

          if (finalPaymentStatus === 'CURRENT_ACCOUNT' && customerId) {
            await tx.customer.update({
              where: { id: customerId },
              data: { usedCredit: { increment: subtotal } }
            });
          } else if (finalPaymentStatus === 'PAID_CASH') {
             // Let's find cash payment method
             const pm = await tx.paymentMethod.findFirst({ where: { type: 'CASH' } });
             if (pm) {
               await tx.saleOrderPayment.create({
                 data: {
                   orderId,
                   paymentMethodId: pm.id,
                   amount: subtotal
                 }
               });
             }
          }

          createdCount++;
        } catch (error: any) {
          errorCount++;
          errors.push(`Orden ${externalOrderId}: ${error.message}`);
        }
      }

      return {
        success: true,
        createdCount,
        errorCount,
        errors
      };
    }, { timeout: 30000 }); // Increase timeout for massive imports
  }
}
