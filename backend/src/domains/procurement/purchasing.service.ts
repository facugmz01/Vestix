import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { StockMovementService } from '../logistics/stock-movement.service';
import { BulkImportPurchasesDto } from './dto/bulk-purchases.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PurchasingService {
  private readonly logger = new Logger(PurchasingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stockMovementService: StockMovementService
  ) {}

  async createPO(dto: any) {
    try {
      const totalAmount = (dto.lines || []).reduce((sum, l) => sum + (l.orderedQuantity * l.unitCost), 0);

      return await this.prisma.purchaseOrder.create({
        data: {
          supplierId: dto.supplierId,
          destinationWarehouseId: dto.destinationWarehouseId,
          status: 'DRAFT',
          totalAmount: totalAmount,
          paidAmount: 0,
          currency: dto.currency || 'ARS',
          notes: dto.notes,
          lines: {
            create: (dto.lines || []).map(l => ({
              variantId: l.variantId,
              orderedQuantity: l.orderedQuantity,
              unitCost: l.unitCost,
              totalAmount: l.orderedQuantity * l.unitCost
            }))
          }
        },
        include: { lines: true }
      });
    } catch (error: any) {
      this.logger.error(`Error creating PO: ${error.message}`, error.stack);
      throw new BadRequestException('Error al crear la orden de compra. Verificá los datos o sincronizá la base de datos.');
    }
  }

  async processDirectPurchase(dto: {
    supplierId: string;
    warehouseId: string;
    branchId: string;
    paymentAccountId?: string;
    paymentAmount?: number;
    lines: {
      variantId: string;
      quantity: number;
      unitCost: number;
      discountAmount?: number;
    }[];
    notes?: string;
  }) {
    const totalAmount = dto.lines.reduce((sum, l) => sum + (l.quantity * l.unitCost) - (l.discountAmount || 0), 0);
    const paidAmount = dto.paymentAmount || 0;

    return this.prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.create({
        data: {
          supplierId: dto.supplierId,
          destinationWarehouseId: dto.warehouseId,
          status: 'ISSUED', // Changed from COMPLETED to ISSUED/PENDING RECEIPT
          totalAmount,
          paidAmount,
          completedAt: null, // Not completed until received
          notes: dto.notes,
          lines: {
            create: dto.lines.map(l => ({
              variantId: l.variantId,
              orderedQuantity: l.quantity,
              receivedQuantity: 0, // Stock not loaded yet
              unitCost: l.unitCost,
              discountAmount: l.discountAmount || 0,
              totalAmount: (l.quantity * l.unitCost) - (l.discountAmount || 0)
            }))
          }
        },
        include: { lines: true }
      });

      // REMOVED: Stock loading logic. Stock must now be received via Goods Receipts.

      const remainingDebt = totalAmount - paidAmount;
      await tx.supplier.update({
        where: { id: dto.supplierId },
        data: { balance: { increment: remainingDebt } }
      });

      if (paidAmount > 0 && dto.paymentAccountId) {
        await tx.financialTransaction.create({
          data: {
            accountId: dto.paymentAccountId,
            type: 'CREDIT',
            amount: paidAmount,
            referenceId: po.id,
            description: `Pago a proveedor por compra ${po.id}`
          }
        });

        await tx.financialAccount.update({
          where: { id: dto.paymentAccountId },
          data: { balance: { decrement: paidAmount } }
        });
      }

      return po;
    });
  }

  async bulkImportPurchases(dto: BulkImportPurchasesDto) {
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
          let supplierId = null;

          // Resolve Supplier
          if (firstLine.supplierIdentifier) {
            const ident = firstLine.supplierIdentifier.trim();
            const supplier = await tx.supplier.findFirst({
              where: {
                OR: [
                  { email: { equals: ident, mode: 'insensitive' } },
                  { taxId: ident },
                  { companyName: { equals: ident, mode: 'insensitive' } }
                ]
              }
            });

            if (supplier) {
              supplierId = supplier.id;
            } else {
              const newSup = await tx.supplier.create({
                data: {
                  companyName: ident,
                  email: ident.includes('@') ? ident : null
                }
              });
              supplierId = newSup.id;
            }
          }

          if (!supplierId) {
             throw new Error("Se requiere un proveedor.");
          }

          // Resolve SKUs
          const poLinesData = [];
          let totalAmount = 0;

          for (const line of lines) {
            const variant = await tx.productVariant.findUnique({
              where: { sku: line.sku }
            });

            if (!variant) {
              throw new Error(`SKU no encontrado: ${line.sku}`);
            }

            const lineTotal = line.quantity * line.unitCost;
            totalAmount += lineTotal;

            poLinesData.push({
              id: uuidv4(),
              variantId: variant.id,
              orderedQuantity: line.quantity,
              receivedQuantity: dto.updateStock ? line.quantity : 0, // Si impacta stock se asume recibido
              unitCost: line.unitCost,
              discountAmount: 0,
              totalAmount: lineTotal
            });

            // Handle Stock Update via Goods Receipt Simulation
            if (dto.updateStock) {
              await tx.inventoryMovement.create({
                data: {
                  variantId: variant.id,
                  destinationWarehouseId: dto.warehouseId,
                  type: 'RECEIPT',
                  quantity: line.quantity,
                  unitCost: line.unitCost,
                  referenceId: externalOrderId
                }
              });

              // Update Stock Level
              const stockLevel = await tx.stockLevel.findFirst({
                where: { variantId: variant.id, warehouseId: dto.warehouseId }
              });
              if (stockLevel) {
                await tx.stockLevel.update({
                  where: { id: stockLevel.id },
                  data: {
                    physicalQuantity: { increment: line.quantity },
                    availableQuantity: { increment: line.quantity }
                  }
                });
              } else {
                await tx.stockLevel.create({
                  data: {
                    variantId: variant.id,
                    warehouseId: dto.warehouseId,
                    physicalQuantity: line.quantity,
                    availableQuantity: line.quantity
                  }
                });
              }
            }
          }

          // Create the Purchase Order
          const poId = uuidv4();
          await tx.purchaseOrder.create({
            data: {
              id: poId,
              supplierId,
              destinationWarehouseId: dto.warehouseId,
              status: dto.updateStock ? 'COMPLETED' : 'ISSUED',
              totalAmount,
              paidAmount: 0, // Se ajusta despues
              currency: 'ARS',
              issuedAt: firstLine.date ? new Date(firstLine.date) : new Date(),
              completedAt: dto.updateStock ? (firstLine.date ? new Date(firstLine.date) : new Date()) : null,
              lines: {
                create: poLinesData
              }
            }
          });

          // Create Goods Receipt implicitly if stock updated
          if (dto.updateStock) {
             const grId = uuidv4();
             await tx.goodsReceipt.create({
                data: {
                  id: grId,
                  purchaseOrderId: poId,
                  destinationWarehouseId: dto.warehouseId,
                  status: 'VALIDATED',
                  lines: {
                    create: poLinesData.map(l => ({
                       poLineItemId: l.id,
                       variantId: l.variantId,
                       expectedQuantity: l.orderedQuantity,
                       receivedQuantity: l.receivedQuantity,
                       difference: 0
                    }))
                  }
                }
             });
          }

          // Handle Debt
          let finalPaymentStatus = dto.paymentResolution;
          if (finalPaymentStatus === 'FROM_CSV' && firstLine.paymentStatus) {
            const ps = firstLine.paymentStatus.toUpperCase();
            if (ps.includes('PAGAD') || ps.includes('EFECTIVO') || ps.includes('CASH')) {
              finalPaymentStatus = 'PAID_CASH';
            } else {
              finalPaymentStatus = 'CURRENT_ACCOUNT';
            }
          }

          if (finalPaymentStatus === 'CURRENT_ACCOUNT') {
            await tx.supplier.update({
              where: { id: supplierId },
              data: { balance: { increment: totalAmount } }
            });
          } else if (finalPaymentStatus === 'PAID_CASH') {
             // Let's just mark PO paid amount. Since no cash register is required for supplier payment from import, we just update PO
             await tx.purchaseOrder.update({
               where: { id: poId },
               data: { paidAmount: totalAmount }
             });
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
    }, { timeout: 30000 });
  }

  async findAll(query: any = {}) {
    const page = parseInt(query.page) || 1;
    const pageSize = parseInt(query.pageSize) || 50;
    const skip = (page - 1) * pageSize;

    const [data, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        include: { supplier: true, lines: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.purchaseOrder.count(),
    ]);

    return { data, total, page, pageSize };
  }

  async getPO(id: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (uuidRegex.test(id)) {
      return this.prisma.purchaseOrder.findUnique({
        where: { id },
        include: { 
          supplier: true,
          lines: { include: { variant: { include: { product: true } } } } 
        }
      });
    }

    // Short ID / Prefix search
    return this.prisma.purchaseOrder.findFirst({
      where: { id: { startsWith: id } },
      include: { 
        supplier: true,
        lines: { include: { variant: { include: { product: true } } } } 
      }
    });
  }

  async applyReceiptToPO(poId: string, receiptLines: { poLineItemId: string, receivedQuantity: number }[]) {
    return this.prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findUnique({
        where: { id: poId },
        include: { lines: true }
      });
      if (!po) return;

      for (const receipt of receiptLines) {
        await tx.pOLineItem.update({
          where: { id: receipt.poLineItemId },
          data: { receivedQuantity: { increment: receipt.receivedQuantity } }
        });
      }

      const updatedPo = await tx.purchaseOrder.findUnique({
        where: { id: poId },
        include: { lines: true }
      });

      const allFullyReceived = updatedPo.lines.every(l => l.receivedQuantity >= l.orderedQuantity);
      await tx.purchaseOrder.update({
        where: { id: poId },
        data: { 
          status: allFullyReceived ? 'COMPLETED' : 'PARTIALLY_RECEIVED',
          completedAt: allFullyReceived ? new Date() : undefined
        }
      });
    });
  }

  async updatePO(id: string, dto: any) {
    const po = await this.getPO(id);
    if (!po) throw new NotFoundException('Orden de compra no encontrada');
    if (po.status !== 'DRAFT') throw new BadRequestException('Solo se pueden editar órdenes en borrador');

    return this.prisma.$transaction(async (tx) => {
      await tx.pOLineItem.deleteMany({ where: { purchaseOrderId: id } });
      
      const totalAmount = (dto.lines || []).reduce((sum: number, l: any) => sum + (l.orderedQuantity * l.unitCost), 0);

      return tx.purchaseOrder.update({
        where: { id },
        data: {
          destinationWarehouseId: dto.destinationWarehouseId,
          notes: dto.notes,
          totalAmount,
          lines: {
            create: (dto.lines || []).map((l: any) => ({
              variantId: l.variantId,
              orderedQuantity: l.orderedQuantity,
              unitCost: l.unitCost,
              totalAmount: l.orderedQuantity * l.unitCost
            }))
          }
        },
        include: { lines: true }
      });
    });
  }

  async removePO(id: string) {
    const po = await this.getPO(id);
    if (!po) throw new NotFoundException('Orden de compra no encontrada');
    if (po.status !== 'DRAFT') throw new BadRequestException('Solo se pueden borrar órdenes en borrador');

    return this.prisma.$transaction(async (tx) => {
      await tx.pOLineItem.deleteMany({ where: { purchaseOrderId: id } });
      return tx.purchaseOrder.delete({ where: { id } });
    });
  }

  async generateReplenishmentOrders() {
    // 1. Find all stock levels where available <= reorderPoint
    const stockToReplenish = await this.prisma.stockLevel.findMany({
      where: {
        availableQuantity: { lte: this.prisma.stockLevel.fields.reorderPoint }
      },
      include: {
        variant: {
          include: { product: true }
        }
      }
    });

    if (stockToReplenish.length === 0) {
      return { success: true, message: 'No hay productos por debajo del punto de reposición.', ordersCreated: 0 };
    }

    // 2. Group by preferredSupplierId and destinationWarehouseId
    // Map of SupplierId -> WarehouseId -> PO Lines
    const draftOrders: Record<string, Record<string, any[]>> = {};

    for (const stock of stockToReplenish) {
      const neededQty = stock.minQuantity - stock.availableQuantity;
      if (neededQty <= 0) continue;

      // Fallback: If no preferred supplier, use a 'UNKNOWN_SUPPLIER' key so the user can assign it later
      const supplierId = stock.variant.product.preferredSupplierId || 'UNKNOWN_SUPPLIER';
      const warehouseId = stock.warehouseId;

      if (!draftOrders[supplierId]) draftOrders[supplierId] = {};
      if (!draftOrders[supplierId][warehouseId]) draftOrders[supplierId][warehouseId] = [];

      draftOrders[supplierId][warehouseId].push({
        variantId: stock.variantId,
        orderedQuantity: neededQty,
        unitCost: stock.variant.costPrice || 0, // Fallback to 0 if not set
        totalAmount: neededQty * (stock.variant.costPrice || 0)
      });
    }

    let ordersCreated = 0;

    await this.prisma.$transaction(async (tx) => {
      // If UNKNOWN_SUPPLIER exists, we either create a dummy supplier or we throw an error.
      // We will create a dummy "Proveedores Varios" supplier if it doesn't exist.
      let defaultSupplierId: string | null = null;
      if (draftOrders['UNKNOWN_SUPPLIER']) {
        let dummy = await tx.supplier.findFirst({ where: { companyName: 'Proveedores Varios' } });
        if (!dummy) {
          dummy = await tx.supplier.create({ data: { companyName: 'Proveedores Varios' } });
        }
        defaultSupplierId = dummy.id;
      }

      for (const [supplierIdKey, warehouseGroups] of Object.entries(draftOrders)) {
        const actualSupplierId = supplierIdKey === 'UNKNOWN_SUPPLIER' ? defaultSupplierId! : supplierIdKey;

        for (const [warehouseId, lines] of Object.entries(warehouseGroups)) {
          const totalAmount = lines.reduce((sum, l) => sum + l.totalAmount, 0);

          await tx.purchaseOrder.create({
            data: {
              supplierId: actualSupplierId,
              destinationWarehouseId: warehouseId,
              status: 'DRAFT',
              totalAmount,
              notes: 'Generada automáticamente por regla de reaprovisionamiento.',
              lines: {
                create: lines.map(l => ({
                  variantId: l.variantId,
                  orderedQuantity: l.orderedQuantity,
                  unitCost: l.unitCost,
                  totalAmount: l.totalAmount
                }))
              }
            }
          });
          ordersCreated++;
        }
      }
    });

    return { 
      success: true, 
      message: `Se han generado ${ordersCreated} órdenes de compra en borrador.`, 
      ordersCreated 
    };
  }
}

