import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { StockMovementService } from '../logistics/stock-movement.service';
import { NotificationTriggersService } from '../notifications/notification-triggers.service';
import { AccountsService } from '../finance/accounts.service';
import { BulkImportPurchasesDto } from './dto/bulk-purchases.dto';
import {
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
  ProcessDirectPurchaseDto,
  IssuePurchaseOrderDto,
  RegisterPurchasePaymentDto,
} from './dto/purchasing.dto';
import { v4 as uuidv4 } from 'uuid';
import { formatEntityId } from '../../common/utils/format-id.util';

type PurchaseLineInput = {
  variantId: string;
  orderedQuantity: number;
  unitCost: number;
  discountAmount?: number;
};

@Injectable()
export class PurchasingService {
  private readonly logger = new Logger(PurchasingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stockMovementService: StockMovementService,
    private readonly notificationTriggers: NotificationTriggersService,
    private readonly accountsService: AccountsService,
  ) {}

  private resolveWarehouseId(dto: { destinationWarehouseId?: string; warehouseId?: string }) {
    const warehouseId = dto.destinationWarehouseId || dto.warehouseId;
    if (!warehouseId) {
      throw new BadRequestException('Se requiere un depósito de destino (destinationWarehouseId).');
    }
    return warehouseId;
  }

  /** Subtotal de líneas − descuento de orden + flete */
  private computeOrderTotals(
    lines: PurchaseLineInput[],
    headerDiscount = 0,
    shippingCost = 0,
  ) {
    const linesSubtotal = lines.reduce((sum, l) => {
      const lineDiscount = Math.max(0, l.discountAmount || 0);
      return sum + Math.max(0, l.orderedQuantity * l.unitCost - lineDiscount);
    }, 0);
    const discountAmount = Math.max(0, headerDiscount || 0);
    const shipping = Math.max(0, shippingCost || 0);
    if (discountAmount > linesSubtotal) {
      throw new BadRequestException('El descuento de la orden no puede superar el subtotal de artículos.');
    }
    const totalAmount = Math.max(0, linesSubtotal - discountAmount + shipping);
    return { linesSubtotal, discountAmount, shippingCost: shipping, totalAmount };
  }

  private mapLineCreates(lines: PurchaseLineInput[]) {
    return lines.map(l => {
      const discountAmount = Math.max(0, l.discountAmount || 0);
      return {
        variantId: l.variantId,
        orderedQuantity: l.orderedQuantity,
        unitCost: l.unitCost,
        discountAmount,
        totalAmount: Math.max(0, l.orderedQuantity * l.unitCost - discountAmount),
      };
    });
  }

  /**
   * Impacto financiero de una compra:
   * - Deuda pendiente → incrementa Supplier.balance + movimiento CC
   * - Pago parcial/total → CREDIT en tesorería + recibo CC (si había deuda registrada previa no aplica en alta)
   */
  private async applyPurchaseFinanceInTx(
    tx: any,
    params: {
      supplierId: string;
      supplierName: string;
      poId: string;
      totalAmount: number;
      paidAmount: number;
      paymentAccountId?: string;
      paymentReference?: string;
      notes?: string;
    },
  ) {
    const paidAmount = Math.max(0, Math.min(params.paidAmount || 0, params.totalAmount));
    const remainingDebt = Math.max(0, params.totalAmount - paidAmount);
    const poLabel = formatEntityId(params.poId, 'OC-');

    if (paidAmount > 0) {
      if (!params.paymentAccountId) {
        throw new BadRequestException('Seleccioná la cuenta de origen del pago.');
      }
      const account = await tx.financialAccount.findUnique({ where: { id: params.paymentAccountId } });
      if (!account) throw new NotFoundException('Cuenta financiera no encontrada');
      if (account.type === 'CASH' && account.balance < paidAmount) {
        throw new BadRequestException(`Fondos insuficientes en la caja. Saldo: $${account.balance}`);
      }

      const payDesc = params.paymentReference
        ? `Pago a ${params.supplierName} por ${poLabel} (ref: ${params.paymentReference})`
        : `Pago a ${params.supplierName} por ${poLabel}`;

      await this.accountsService.postTransactionInTx(
        tx,
        params.paymentAccountId,
        'CREDIT',
        paidAmount,
        params.poId,
        payDesc,
      );
    }

    if (remainingDebt > 0) {
      const updated = await tx.supplier.update({
        where: { id: params.supplierId },
        data: { balance: { increment: remainingDebt } },
      });
      await tx.currentAccountMovement.create({
        data: {
          accountId: params.supplierId,
          entityType: 'SUPPLIER',
          documentType: 'DEBIT_NOTE',
          referenceId: params.poId,
          description: params.notes
            ? `Compra ${poLabel}: ${params.notes}`
            : `Deuda por compra ${poLabel}`,
          amount: remainingDebt,
          debit: 0,
          credit: remainingDebt,
          balanceAfter: updated.balance,
        },
      });
    }

    return { paidAmount, remainingDebt };
  }

  async createPO(dto: CreatePurchaseOrderDto | any) {
    try {
      const destinationWarehouseId = this.resolveWarehouseId(dto);
      const lines: PurchaseLineInput[] = (dto.lines || []).map((l: any) => ({
        variantId: l.variantId,
        orderedQuantity: l.orderedQuantity ?? l.quantity,
        unitCost: l.unitCost,
        discountAmount: l.discountAmount || 0,
      }));
      if (lines.length === 0) {
        throw new BadRequestException('La orden debe tener al menos un artículo.');
      }

      const { discountAmount, shippingCost, totalAmount } = this.computeOrderTotals(
        lines,
        dto.discountAmount,
        dto.shippingCost,
      );

      return await this.prisma.purchaseOrder.create({
        data: {
          supplierId: dto.supplierId,
          destinationWarehouseId,
          status: 'DRAFT',
          totalAmount,
          paidAmount: 0,
          discountAmount,
          shippingCost,
          currency: dto.currency || 'ARS',
          notes: dto.notes,
          lines: { create: this.mapLineCreates(lines) },
        },
        include: { lines: true, supplier: true },
      });
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Error creating PO: ${error.message}`, error.stack);
      throw new BadRequestException('Error al crear la orden de compra. Verificá los datos o sincronizá la base de datos.');
    }
  }

  async processDirectPurchase(dto: ProcessDirectPurchaseDto | any) {
    const lines: PurchaseLineInput[] = (dto.lines || []).map((l: any) => ({
      variantId: l.variantId,
      orderedQuantity: l.quantity ?? l.orderedQuantity,
      unitCost: l.unitCost,
      discountAmount: l.discountAmount || 0,
    }));
    if (lines.length === 0) {
      throw new BadRequestException('La compra debe tener al menos un artículo.');
    }

    const { discountAmount, shippingCost, totalAmount } = this.computeOrderTotals(
      lines,
      dto.discountAmount,
      dto.shippingCost,
    );

    const requestedPaid = dto.paymentAmount != null ? Number(dto.paymentAmount) : 0;
    if (requestedPaid > totalAmount) {
      throw new BadRequestException('El monto a pagar no puede superar el total de la compra.');
    }
    if (requestedPaid > 0 && !dto.paymentAccountId) {
      throw new BadRequestException('Seleccioná la cuenta de origen del pago.');
    }

    const warehouseId = this.resolveWarehouseId({ warehouseId: dto.warehouseId, destinationWarehouseId: dto.warehouseId });

    const supplier = await this.prisma.supplier.findUnique({ where: { id: dto.supplierId } });
    if (!supplier) throw new NotFoundException('Proveedor no encontrado');

    return this.prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.create({
        data: {
          supplierId: dto.supplierId,
          destinationWarehouseId: warehouseId,
          status: 'ISSUED',
          totalAmount,
          paidAmount: 0,
          discountAmount,
          shippingCost,
          completedAt: null,
          notes: dto.notes,
          issuedAt: new Date(),
          lines: { create: this.mapLineCreates(lines) },
        },
        include: { lines: true, supplier: true },
      });

      const { paidAmount } = await this.applyPurchaseFinanceInTx(tx, {
        supplierId: dto.supplierId,
        supplierName: supplier.companyName,
        poId: po.id,
        totalAmount,
        paidAmount: requestedPaid,
        paymentAccountId: dto.paymentAccountId,
        paymentReference: dto.paymentReference,
        notes: dto.notes,
      });

      return tx.purchaseOrder.update({
        where: { id: po.id },
        data: { paidAmount },
        include: { lines: true, supplier: true },
      });
    }).then((po) => {
      void this.notificationTriggers.onPurchaseOrderIssued(po.id);
      return po;
    });
  }

  async bulkImportPurchases(dto: BulkImportPurchasesDto) {
    return this.prisma.$transaction(async (tx) => {
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
              receivedQuantity: dto.updateStock ? line.quantity : 0,
              unitCost: line.unitCost,
              discountAmount: 0,
              totalAmount: lineTotal
            });

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

          const poId = uuidv4();
          await tx.purchaseOrder.create({
            data: {
              id: poId,
              supplierId,
              destinationWarehouseId: dto.warehouseId,
              status: dto.updateStock ? 'COMPLETED' : 'ISSUED',
              totalAmount,
              paidAmount: 0,
              currency: 'ARS',
              issuedAt: firstLine.date ? new Date(firstLine.date) : new Date(),
              completedAt: dto.updateStock ? (firstLine.date ? new Date(firstLine.date) : new Date()) : null,
              lines: {
                create: poLinesData
              }
            }
          });

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
            await tx.currentAccountMovement.create({
              data: {
                accountId: supplierId,
                entityType: 'SUPPLIER',
                documentType: 'DEBIT_NOTE',
                referenceId: poId,
                description: `Deuda por compra importada ${formatEntityId(poId, 'OC-')}`,
                amount: totalAmount,
                debit: 0,
                credit: totalAmount,
                balanceAfter: (await tx.supplier.findUnique({ where: { id: supplierId } }))!.balance,
              },
            });
          } else if (finalPaymentStatus === 'PAID_CASH') {
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

  private mapPOResponse(po: any) {
    if (!po) return po;
    return {
      ...po,
      supplierName: po.supplier?.companyName,
      lines: (po.lines || []).map((l: any) => ({
        ...l,
        variantSku: l.variant?.sku || l.variantSku,
        productName: l.variant?.product?.name
          ? `${l.variant.product.name}${l.variant.size ? ` (${l.variant.size})` : ''}${l.variant.color ? ` · ${l.variant.color}` : ''}`
          : l.productName,
      })),
    };
  }

  async findAll(query: any = {}) {
    const page = parseInt(query.page) || 1;
    const pageSize = parseInt(query.pageSize) || 50;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.supplierId) where.supplierId = query.supplierId;

    const [data, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where,
        include: { supplier: true, lines: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);

    return { data: data.map((po) => this.mapPOResponse(po)), total, page, pageSize };
  }

  async getPO(id: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const include = {
      supplier: true,
      lines: { include: { variant: { include: { product: true } } } },
    };

    const po = uuidRegex.test(id)
      ? await this.prisma.purchaseOrder.findUnique({ where: { id }, include })
      : await this.prisma.purchaseOrder.findFirst({ where: { id: { startsWith: id } }, include });

    return this.mapPOResponse(po);
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

  async updatePO(id: string, dto: UpdatePurchaseOrderDto | any) {
    const po = await this.getPO(id);
    if (!po) throw new NotFoundException('Orden de compra no encontrada');
    if (po.status !== 'DRAFT') throw new BadRequestException('Solo se pueden editar órdenes en borrador');

    const lines: PurchaseLineInput[] = (dto.lines || []).map((l: any) => ({
      variantId: l.variantId,
      orderedQuantity: l.orderedQuantity ?? l.quantity,
      unitCost: l.unitCost,
      discountAmount: l.discountAmount || 0,
    }));
    if (lines.length === 0) {
      throw new BadRequestException('La orden debe tener al menos un artículo.');
    }

    const { discountAmount, shippingCost, totalAmount } = this.computeOrderTotals(
      lines,
      dto.discountAmount ?? po.discountAmount,
      dto.shippingCost ?? po.shippingCost,
    );

    return this.prisma.$transaction(async (tx) => {
      await tx.pOLineItem.deleteMany({ where: { purchaseOrderId: id } });

      const destinationWarehouseId = dto.destinationWarehouseId || dto.warehouseId || po.destinationWarehouseId;

      return tx.purchaseOrder.update({
        where: { id },
        data: {
          destinationWarehouseId,
          notes: dto.notes !== undefined ? dto.notes : po.notes,
          totalAmount,
          discountAmount,
          shippingCost,
          lines: { create: this.mapLineCreates(lines) },
        },
        include: { lines: true, supplier: true },
      });
    });
  }

  async issueOrder(id: string, dto: IssuePurchaseOrderDto | any = {}) {
    const po = await this.getPO(id);
    if (!po) throw new NotFoundException('Orden de compra no encontrada');
    if (po.status !== 'DRAFT') {
      throw new BadRequestException('Solo se pueden emitir órdenes en estado borrador');
    }

    const requestedPaid = dto.paymentAmount != null ? Number(dto.paymentAmount) : 0;
    if (requestedPaid > po.totalAmount) {
      throw new BadRequestException('El monto a pagar no puede superar el total de la orden.');
    }
    if (requestedPaid > 0 && !dto.paymentAccountId) {
      throw new BadRequestException('Seleccioná la cuenta de origen del pago.');
    }

    const supplierName = (po as any).supplier?.companyName || 'Proveedor';

    return this.prisma.$transaction(async (tx) => {
      const notes = dto.notes !== undefined && dto.notes !== ''
        ? [po.notes, dto.notes].filter(Boolean).join(' | ')
        : po.notes;

      const { paidAmount } = await this.applyPurchaseFinanceInTx(tx, {
        supplierId: po.supplierId,
        supplierName,
        poId: po.id,
        totalAmount: po.totalAmount,
        paidAmount: requestedPaid,
        paymentAccountId: dto.paymentAccountId,
        paymentReference: dto.paymentReference,
        notes: dto.notes || po.notes,
      });

      return tx.purchaseOrder.update({
        where: { id },
        data: {
          status: 'ISSUED',
          issuedAt: new Date(),
          paidAmount,
          notes,
        },
        include: { supplier: true, lines: { include: { variant: { include: { product: true } } } } },
      });
    }).then((issued) => {
      void this.notificationTriggers.onPurchaseOrderIssued(issued.id);
      return issued;
    });
  }

  /**
   * Registra un pago adicional contra una OC ya emitida (reduce deuda del proveedor).
   */
  async registerPayment(id: string, dto: RegisterPurchasePaymentDto) {
    const po = await this.getPO(id);
    if (!po) throw new NotFoundException('Orden de compra no encontrada');
    if (po.status === 'DRAFT' || po.status === 'CANCELLED') {
      throw new BadRequestException('No se puede registrar un pago sobre una orden en borrador o cancelada.');
    }

    const outstanding = Math.max(0, po.totalAmount - po.paidAmount);
    if (outstanding <= 0) {
      throw new BadRequestException('La orden ya está totalmente pagada.');
    }

    const amount = Number(dto.amount);
    if (amount <= 0) throw new BadRequestException('El monto debe ser mayor a cero.');
    if (amount > outstanding) {
      throw new BadRequestException(`El pago no puede superar el saldo pendiente ($${outstanding}).`);
    }

    const supplierName = (po as any).supplier?.companyName || 'Proveedor';
    const poLabel = formatEntityId(po.id, 'OC-');

    return this.prisma.$transaction(async (tx) => {
      const account = await tx.financialAccount.findUnique({ where: { id: dto.paymentAccountId } });
      if (!account) throw new NotFoundException('Cuenta financiera no encontrada');
      if (account.type === 'CASH' && account.balance < amount) {
        throw new BadRequestException(`Fondos insuficientes en la caja. Saldo: $${account.balance}`);
      }

      const payDesc = dto.paymentReference
        ? `Pago a ${supplierName} por ${poLabel} (ref: ${dto.paymentReference})`
        : `Pago a ${supplierName} por ${poLabel}`;

      await this.accountsService.postTransactionInTx(
        tx,
        dto.paymentAccountId,
        'CREDIT',
        amount,
        po.id,
        payDesc,
      );

      const updatedSupplier = await tx.supplier.update({
        where: { id: po.supplierId },
        data: { balance: { decrement: amount } },
      });

      await tx.currentAccountMovement.create({
        data: {
          accountId: po.supplierId,
          entityType: 'SUPPLIER',
          documentType: 'RECEIPT',
          referenceId: `${po.id}-pay-${Date.now()}`,
          description: dto.notes || `Recibo de pago ${poLabel}`,
          amount,
          debit: amount,
          credit: 0,
          balanceAfter: Math.max(0, updatedSupplier.balance),
        },
      });

      return tx.purchaseOrder.update({
        where: { id: po.id },
        data: {
          paidAmount: { increment: amount },
          notes: dto.notes
            ? [po.notes, dto.notes].filter(Boolean).join(' | ')
            : po.notes,
        },
        include: { supplier: true, lines: { include: { variant: { include: { product: true } } } } },
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
    const settings = await this.prisma.systemSettings.findUnique({ where: { id: 'default' } });
    const inventoryConfig = ((settings as any)?.inventory) || {};
    const reorderPoint = parseInt(inventoryConfig.defaultReorderPoint) || 10;
    const reorderQuantity = parseInt(inventoryConfig.defaultReorderQuantity) || 50;

    const stockToReplenish = await this.prisma.stockLevel.findMany({
      where: {
        availableQuantity: { lte: reorderPoint }
      }
    });

    const variantIds = [...new Set(stockToReplenish.map(s => s.variantId))];
    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: variantIds } }
    });
    const variantMap = new Map(variants.map(v => [v.id, v]));

    if (stockToReplenish.length === 0) {
      return { success: true, message: 'No hay productos por debajo del punto de reposición.', ordersCreated: 0 };
    }

    const draftOrders: Record<string, Record<string, any[]>> = {};

    for (const stock of stockToReplenish) {
      const variant = variantMap.get(stock.variantId);
      const neededQty = reorderQuantity - stock.availableQuantity;
      if (neededQty <= 0) continue;

      const supplierId = 'UNKNOWN_SUPPLIER';
      const warehouseId = stock.warehouseId;

      if (!draftOrders[supplierId]) draftOrders[supplierId] = {};
      if (!draftOrders[supplierId][warehouseId]) draftOrders[supplierId][warehouseId] = [];

      draftOrders[supplierId][warehouseId].push({
        variantId: stock.variantId,
        orderedQuantity: neededQty,
        unitCost: variant?.costPrice || 0,
        totalAmount: neededQty * (variant?.costPrice || 0)
      });
    }

    let ordersCreated = 0;

    await this.prisma.$transaction(async (tx) => {
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
