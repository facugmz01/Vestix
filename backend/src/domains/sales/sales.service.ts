import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { BulkImportSalesDto } from './dto/bulk-sales.dto';
import { EmitOrderInvoiceDto } from './dto/create-order.dto';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

import { CatalogFacade } from '../catalog/catalog.facade';
import { SaleOrderRepository } from './repositories/sale-order.repository';
import { verifyReceiptAccessToken } from './utils/receipt-access.util';
import { SettingsService } from '../../modules/settings/settings.service';
import { resolveReceiptStyle } from './models/receipt-style.model';
import { CurrentAccountsService } from '../finance/current-accounts.service';
import { AfipProducer } from '../invoicing/afip.producer';

@Injectable()
export class SalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: SaleOrderRepository,
    private readonly catalogFacade: CatalogFacade,
    private readonly settingsService: SettingsService,
    private readonly currentAccountsService: CurrentAccountsService,
    private readonly afipProducer: AfipProducer,
  ) { }

  /**
   * Resolves the high-level fiscal invoicing state for a SaleOrder.
   */
  computeInvoicingStatus(order: any): 'NOT_REQUESTED' | 'PENDING' | 'INVOICED' | 'FAILED' {
    const invoices = order?.invoices || [];
    const hasApproved = invoices.some((inv: any) => inv.status === 'APPROVED' && (inv.cae || inv.receiptNumber));
    if (hasApproved) return 'INVOICED';

    const hasPending = invoices.some((inv: any) => inv.status === 'PENDING_AFIP' || inv.status === 'PENDING');
    if (hasPending) return 'PENDING';

    const hasFailed = invoices.some((inv: any) => inv.status === 'FAILED' || inv.status === 'REJECTED');
    if (hasFailed) return 'FAILED';

    if (order?.issueInvoice) {
      return 'PENDING';
    }

    return 'NOT_REQUESTED';
  }

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
      (order as any).invoicingStatus = this.computeInvoicingStatus(order);
    }

    return order;
  }

  async getPublicReceipt(orderId: string, token: string) {
    if (!verifyReceiptAccessToken(orderId, token)) {
      throw new ForbiddenException('Enlace de comprobante inválido o expirado');
    }

    const order = await this.getOrderById(orderId);
    if (!order) throw new NotFoundException('Venta no encontrada');

    const branch = await this.prisma.branch.findUnique({
      where: { id: order.branchId },
      select: { settings: true },
    });
    const branchSettings = (branch?.settings as Record<string, string> | null) || {};
    const posSettings = await this.settingsService.getPosSettings();

    return {
      id: order.id,
      status: order.status,
      source: order.source,
      customerName: (order as any).customerName || order.customer?.fullName || 'Consumidor Final',
      subtotal: order.subtotal,
      cartDiscountTotal: order.cartDiscountTotal,
      grandTotal: order.grandTotal,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt,
      lines: (order as any).lines.map((line: any) => ({
        id: line.id,
        productName: line.productName || line.historicalName || line.variant?.product?.name || 'Producto',
        variantSku: line.variantSku || line.historicalSku || line.variant?.sku || null,
        quantity: line.quantity,
        basePrice: line.basePrice,
        discountAmount: line.discountAmount,
        finalPrice: line.finalPrice,
        size: line.variant?.size || null,
      })),
      branchSettings: {
        posReceiptHeader: branchSettings.posReceiptHeader || null,
        posReceiptFooter: branchSettings.posReceiptFooter || null,
      },
      receiptStyle: resolveReceiptStyle(posSettings.receiptStyle),
    };
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
    if (status) {
      if (status === 'QUOTATION') {
        where.status = { in: ['QUOTATION', 'QUOTE'] };
      } else {
        where.status = status;
      }
    }
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
        customerName: order.customer?.fullName || 'Consumidor Final',
        invoicingStatus: this.computeInvoicingStatus(order),
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
            await this.currentAccountsService.chargeCustomerSaleInTx(tx, {
              customerId,
              amount: subtotal,
              orderId,
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

  /**
   * Post-sale / deferred electronic invoice emission for previously un-invoiced orders.
   */
  async emitOrderInvoice(id: string, dto?: EmitOrderInvoiceDto) {
    const order = await this.prisma.saleOrder.findUnique({
      where: { id },
      include: { customer: true, invoices: true, lines: true },
    });

    if (!order) {
      throw new NotFoundException('Venta no encontrada');
    }

    if (order.status === 'CANCELLED') {
      throw new BadRequestException('No se puede emitir factura para una venta cancelada');
    }

    if (order.status === 'QUOTATION' || order.status === 'QUOTE') {
      throw new BadRequestException('No se puede emitir factura para un presupuesto. Debe confirmarse la venta primero.');
    }

    const approvedInvoice = order.invoices.find(
      inv => inv.status === 'APPROVED' && (inv.cae || inv.receiptNumber)
    );
    if (approvedInvoice) {
      throw new BadRequestException(
        `Esta orden ya posee una factura emitida con CAE (Comprobante: ${approvedInvoice.receiptNumber || approvedInvoice.id}, CAE: ${approvedInvoice.cae || 'N/A'}).`
      );
    }

    const pendingInvoice = order.invoices.find(inv => inv.status === 'PENDING_AFIP');
    if (pendingInvoice) {
      throw new BadRequestException('La orden ya se encuentra en proceso de facturación ante AFIP.');
    }

    // Sync customer fiscal data if provided
    if (dto?.fiscalCustomerData && order.customerId) {
      await this.prisma.customer.update({
        where: { id: order.customerId },
        data: {
          taxId: dto.fiscalCustomerData.taxId || undefined,
          fullName: dto.fiscalCustomerData.businessName || undefined,
          taxCondition: dto.fiscalCustomerData.taxCondition || undefined,
        },
      });
    }

    const targetType = dto?.invoiceType || (order.customer?.taxCondition === 'RESPONSABLE_INSCRIPTO' ? 'FACTURA_A' : 'FACTURA_B');
    const docType = dto?.fiscalCustomerData?.docType || (dto?.fiscalCustomerData?.taxId?.length === 11 ? 'CUIT' : (order.customer?.taxId?.length === 11 ? 'CUIT' : 'DNI'));
    const docNumber = dto?.fiscalCustomerData?.taxId || order.customer?.taxId || '0';

    const netAmount = Math.round((order.grandTotal / 1.21) * 100) / 100;
    const vatAmount = Math.round((order.grandTotal - netAmount) * 100) / 100;

    const failedInvoice = order.invoices.find(inv => inv.status === 'FAILED' || inv.status === 'REJECTED');
    let invoice;
    if (failedInvoice) {
      invoice = await this.prisma.invoice.update({
        where: { id: failedInvoice.id },
        data: {
          type: targetType,
          customerDocumentType: docType,
          customerDocumentNumber: docNumber,
          netAmount,
          vatAmount,
          totalAmount: order.grandTotal,
          status: 'PENDING_AFIP',
          afipErrorMessage: null,
        },
      });
    } else {
      invoice = await this.prisma.invoice.create({
        data: {
          id: crypto.randomUUID(),
          orderId: order.id,
          type: targetType,
          customerDocumentType: docType,
          customerDocumentNumber: docNumber,
          netAmount,
          vatAmount,
          totalAmount: order.grandTotal,
          status: 'PENDING_AFIP',
        },
      });
    }

    await this.prisma.saleOrder.update({
      where: { id: order.id },
      data: { issueInvoice: true },
    });

    await this.afipProducer.enqueueInvoiceGeneration(order.id, order.branchId);

    return {
      success: true,
      message: 'Factura enviada a la cola de emisión de AFIP / ARCA.',
      orderId: order.id,
      invoiceId: invoice.id,
      invoiceType: invoice.type,
      status: 'PENDING_AFIP',
    };
  }
}
