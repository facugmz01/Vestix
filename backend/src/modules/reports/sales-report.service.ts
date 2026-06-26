import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import {
  DateRangeFilter,
  SalesSummaryReport,
  TopSellingVariant,
  CogsReport,
} from './models/report.model';

@Injectable()
export class SalesReportService {
  private readonly logger = new Logger(SalesReportService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getSalesSummary(filter: DateRangeFilter): Promise<SalesSummaryReport> {
    this.logger.log(`[SalesReport] Summary requested: ${filter.from.toISOString()} -> ${filter.to.toISOString()}`);
    
    const branchFilter = filter.branchId ? { branchId: filter.branchId } : {};

    const orders = await this.prisma.saleOrder.findMany({
      where: {
        createdAt: { gte: filter.from, lte: filter.to },
        status: { not: 'CANCELLED' },
        ...branchFilter,
      },
      include: {
        payments: {
          include: { paymentMethod: true }
        }
      }
    });

    let totalOrders = 0;
    let totalRevenue = 0;
    let totalDiscounts = 0;
    let netRevenue = 0;

    const methodMap = new Map<string, { count: number, amount: number }>();
    const channelMap = new Map<string, number>();

    for (const order of orders) {
      totalOrders++;
      totalRevenue += order.subtotal;
      totalDiscounts += order.cartDiscountTotal;
      netRevenue += order.grandTotal;

      const source = order.source || 'POS';
      channelMap.set(source, (channelMap.get(source) || 0) + order.grandTotal);

      if (order.payments && order.payments.length > 0) {
        for (const payment of order.payments) {
          const methodType = payment.paymentMethod?.type || 'UNKNOWN';
          const current = methodMap.get(methodType) || { count: 0, amount: 0 };
          current.count++;
          current.amount += payment.amount;
          methodMap.set(methodType, current);
        }
      } else {
        const methodType = order.paymentMethod || 'UNKNOWN';
        const current = methodMap.get(methodType) || { count: 0, amount: 0 };
        current.count++;
        current.amount += order.grandTotal;
        methodMap.set(methodType, current);
      }
    }

    const byPaymentMethod = Array.from(methodMap.entries()).map(([method, data]) => ({
      method,
      count: data.count,
      amount: data.amount
    }));

    const byChannel = Object.fromEntries(channelMap);

    return {
      period: { from: filter.from, to: filter.to },
      totalOrders,
      totalRevenue,
      totalDiscounts,
      netRevenue,
      averageOrderValue: totalOrders > 0 ? netRevenue / totalOrders : 0,
      byPaymentMethod,
      byChannel,
    };
  }

  async getTopSellers(filter: DateRangeFilter, limit = 10): Promise<TopSellingVariant[]> {
    const branchFilter = filter.branchId ? { branchId: filter.branchId } : {};

    const lineItems = await this.prisma.orderLineItem.findMany({
      where: {
        order: {
          createdAt: { gte: filter.from, lte: filter.to },
          status: { not: 'CANCELLED' },
          ...branchFilter,
        }
      },
      include: {
        variant: {
          include: { product: true }
        }
      }
    });

    const variantMap = new Map<string, TopSellingVariant>();

    for (const item of lineItems) {
      if (!variantMap.has(item.variantId)) {
        variantMap.set(item.variantId, {
          variantId: item.variantId,
          name: item.variant?.product?.name || item.historicalName || 'Unknown',
          sku: item.variant?.sku || item.historicalSku || 'Unknown',
          totalUnitsSold: 0,
          totalRevenue: 0,
        });
      }
      
      const v = variantMap.get(item.variantId)!;
      v.totalUnitsSold += item.quantity;
      v.totalRevenue += item.finalPrice;
    }

    return Array.from(variantMap.values())
      .sort((a, b) => b.totalUnitsSold - a.totalUnitsSold)
      .slice(0, limit);
  }

  async getCogsReport(filter: DateRangeFilter): Promise<CogsReport> {
    const branchFilter = filter.branchId ? { branchId: filter.branchId } : {};
    
    let warehouseFilter = {};
    if (filter.branchId) {
      const warehouses = await this.prisma.warehouse.findMany({
        where: { branchId: filter.branchId },
        select: { id: true }
      });
      warehouseFilter = {
        sourceWarehouseId: { in: warehouses.map(w => w.id) }
      };
    }

    const movements = await this.prisma.inventoryMovement.findMany({
      where: {
        type: 'SALE',
        createdAt: { gte: filter.from, lte: filter.to },
        ...warehouseFilter,
      }
    });

    let totalCOGS = 0;
    for (const m of movements) {
      totalCOGS += (m.quantity * m.unitCost);
    }

    const salesSummary = await this.getSalesSummary(filter);
    const totalRevenue = salesSummary.netRevenue;
    const grossProfit = totalRevenue - totalCOGS;

    return {
      period: { from: filter.from, to: filter.to },
      totalCOGS,
      totalRevenue,
      grossProfit,
      grossMarginPct: totalRevenue > 0 ? parseFloat(((grossProfit / totalRevenue) * 100).toFixed(2)) : 0,
    };
  }
}
