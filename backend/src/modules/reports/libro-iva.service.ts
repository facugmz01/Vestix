import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { mapVatRateToAfipIvaId } from '../../domains/invoicing/afip-voucher.util';
import { InvoiceStatus } from '../../domains/invoicing/models/invoice.model';

export interface LibroIvaRateRow {
  ivaId: number;
  vatRatePct: number;
  netAmount: number;
  vatAmount: number;
  totalAmount: number;
  documentCount: number;
}

export interface LibroIvaVentasReport {
  period: { from: Date; to: Date };
  totals: { netAmount: number; vatAmount: number; totalAmount: number; documentCount: number };
  byVatRate: LibroIvaRateRow[];
}

export interface LibroIvaComprasReport {
  period: { from: Date; to: Date };
  totals: { netAmount: number; vatAmount: number; totalAmount: number; documentCount: number };
  byVatRate: LibroIvaRateRow[];
}

@Injectable()
export class LibroIvaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
  ) {}

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private inferVatRatePct(netAmount: number, vatAmount: number): number {
    if (netAmount <= 0 || vatAmount <= 0) return 0;
    return this.round((vatAmount / netAmount) * 100);
  }

  private bucketKey(vatRatePct: number): number {
    return mapVatRateToAfipIvaId(vatRatePct / 100);
  }

  private upsertBucket(
    buckets: Map<number, LibroIvaRateRow>,
    vatRatePct: number,
    netAmount: number,
    vatAmount: number,
    totalAmount: number,
  ) {
    const ivaId = this.bucketKey(vatRatePct);
    const existing = buckets.get(ivaId);
    if (existing) {
      existing.netAmount = this.round(existing.netAmount + netAmount);
      existing.vatAmount = this.round(existing.vatAmount + vatAmount);
      existing.totalAmount = this.round(existing.totalAmount + totalAmount);
      existing.documentCount += 1;
      return;
    }

    buckets.set(ivaId, {
      ivaId,
      vatRatePct,
      netAmount: this.round(netAmount),
      vatAmount: this.round(vatAmount),
      totalAmount: this.round(totalAmount),
      documentCount: 1,
    });
  }

  async getVentas(params: { from: Date; to: Date }): Promise<LibroIvaVentasReport> {
    const { from, to } = params;
    const invoices = await this.prisma.invoice.findMany({
      where: {
        status: InvoiceStatus.APPROVED,
        createdAt: { gte: from, lte: to },
      },
    });

    const buckets = new Map<number, LibroIvaRateRow>();
    let totalNet = 0;
    let totalVat = 0;
    let totalGross = 0;

    for (const invoice of invoices) {
      const isCredit = invoice.type.startsWith('NC_');
      const sign = isCredit ? -1 : 1;
      const net = sign * invoice.netAmount;
      const vat = sign * invoice.vatAmount;
      const gross = sign * invoice.totalAmount;

      const vatRatePct = invoice.vatAmount === 0
        ? 0
        : this.inferVatRatePct(Math.abs(invoice.netAmount), Math.abs(invoice.vatAmount));

      this.upsertBucket(buckets, vatRatePct, net, vat, gross);
      totalNet = this.round(totalNet + net);
      totalVat = this.round(totalVat + vat);
      totalGross = this.round(totalGross + gross);
    }

    const byVatRate = Array.from(buckets.values()).sort((a, b) => a.ivaId - b.ivaId);

    return {
      period: { from, to },
      totals: {
        netAmount: totalNet,
        vatAmount: totalVat,
        totalAmount: totalGross,
        documentCount: invoices.length,
      },
      byVatRate,
    };
  }

  async getCompras(params: { from: Date; to: Date }): Promise<LibroIvaComprasReport> {
    const { from, to } = params;
    const pricing = await this.settingsService.getPricingSettings();
    const defaultVatRate = (pricing?.vatDefaultPct ?? 21) / 100;

    const receipts = await this.prisma.goodsReceipt.findMany({
      where: {
        status: 'VALIDATED',
        createdAt: { gte: from, lte: to },
      },
      include: {
        lines: {
          include: {
            poLineItem: true,
          },
        },
      },
    });

    const buckets = new Map<number, LibroIvaRateRow>();
    let totalNet = 0;
    let totalVat = 0;
    let totalGross = 0;

    for (const receipt of receipts) {
      const gross = receipt.lines.reduce((sum, line) => {
        const unitCost = line.poLineItem?.unitCost ?? 0;
        return sum + unitCost * line.receivedQuantity;
      }, 0);

      if (gross <= 0) continue;

      const net = this.round(gross / (1 + defaultVatRate));
      const vat = this.round(gross - net);
      const vatRatePct = this.round(defaultVatRate * 100);

      this.upsertBucket(buckets, vatRatePct, net, vat, gross);
      totalNet = this.round(totalNet + net);
      totalVat = this.round(totalVat + vat);
      totalGross = this.round(totalGross + gross);
    }

    const byVatRate = Array.from(buckets.values()).sort((a, b) => a.ivaId - b.ivaId);

    return {
      period: { from, to },
      totals: {
        netAmount: totalNet,
        vatAmount: totalVat,
        totalAmount: totalGross,
        documentCount: receipts.length,
      },
      byVatRate,
    };
  }
}
