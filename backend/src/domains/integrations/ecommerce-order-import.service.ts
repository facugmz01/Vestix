import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CheckoutOrchestrator } from '../sales/checkout.orchestrator';
import { CreateOrderDto } from '../sales/dto/create-order.dto';
import { OrderSource, PaymentMethod } from '../sales/models/order.model';

export type EcommerceImportSource = 'SHOPIFY' | 'MERCADOLIBRE' | 'WOOCOMMERCE';

export interface EcommerceImportLine {
  sku?: string;
  externalVariantId?: string;
  quantity: number;
  unitPrice?: number;
}

export interface EcommerceImportOptions {
  paymentMethod?: PaymentMethod;
  grandTotal?: number;
}

@Injectable()
export class EcommerceOrderImportService {
  private readonly logger = new Logger(EcommerceOrderImportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly checkoutOrchestrator: CheckoutOrchestrator,
  ) {}

  async importOrderLines(
    source: EcommerceImportSource,
    externalOrderId: string,
    lines: EcommerceImportLine[],
    options?: EcommerceImportOptions,
  ) {
    const paymentReference = this.buildPaymentReference(source, externalOrderId);

    const existingPayment = await this.prisma.saleOrderPayment.findFirst({
      where: { referenceId: paymentReference },
      include: { order: true },
    });
    if (existingPayment) {
      this.logger.log(
        `[EcommerceImport] Skipping ${source} order ${externalOrderId} — already imported as ${existingPayment.orderId}`,
      );
      return { status: 'ALREADY_IMPORTED' as const, order: existingPayment.order };
    }

    const branch =
      (await this.prisma.branch.findFirst({ where: { isMain: true } })) ||
      (await this.prisma.branch.findFirst());
    if (!branch) {
      throw new Error('No se encontró una sucursal en el ERP para asociar el pedido de e-commerce.');
    }

    const warehouse = await this.prisma.warehouse.findFirst({
      where: { branchId: branch.id },
    });

    const mappedLines: { variantId: string; categoryId: string; quantity: number; unitPriceOverride?: number }[] = [];

    for (const line of lines) {
      const variantId = await this.resolveLineToVariant(source, line);
      if (!variantId) {
        this.logger.error(
          `[EcommerceImport] Skipping unmapped ${source} line — order ${externalOrderId}, ` +
          `externalVariantId ${line.externalVariantId ?? 'n/a'}, sku ${line.sku ?? 'n/a'}`,
        );
        continue;
      }

      mappedLines.push({
        variantId,
        categoryId: 'ECOMMERCE',
        quantity: line.quantity,
        ...(line.unitPrice !== undefined ? { unitPriceOverride: line.unitPrice } : {}),
      });
    }

    if (mappedLines.length === 0) {
      throw new Error(`${source} order ${externalOrderId} has no mappable line items`);
    }

    const orderDto: CreateOrderDto = {
      id: crypto.randomUUID(),
      branchId: branch.id,
      warehouseId: warehouse?.id || undefined,
      source: OrderSource.ECOMMERCE,
      customerId: undefined,
      lines: mappedLines,
      paymentMethod: options?.paymentMethod ?? PaymentMethod.CREDIT_CARD,
      paymentAccountId: undefined,
      paymentReference,
      createdAtIso: new Date().toISOString(),
      ...(options?.grandTotal !== undefined ? { posGrandTotal: options.grandTotal } : {}),
    };

    const result = await this.checkoutOrchestrator.processCheckout(orderDto);
    this.logger.log(`[EcommerceImport] ✓ ${source} order ${externalOrderId} imported into ERP`);
    return { status: 'IMPORTED' as const, result };
  }

  private buildPaymentReference(source: EcommerceImportSource, externalOrderId: string): string {
    return `${source}:${externalOrderId}`;
  }

  private async resolveLineToVariant(
    source: EcommerceImportSource,
    line: EcommerceImportLine,
  ): Promise<string | null> {
    switch (source) {
      case 'SHOPIFY':
        return this.resolveShopifyLine(line);
      case 'MERCADOLIBRE':
        return this.resolveMlLine(line);
      case 'WOOCOMMERCE':
        return this.resolveWcLine(line);
      default:
        return null;
    }
  }

  private async resolveBySku(sku?: string): Promise<string | null> {
    if (!sku?.trim()) return null;
    const variant = await this.prisma.productVariant.findFirst({
      where: { sku: sku.trim() },
    });
    return variant?.id ?? null;
  }

  private async resolveShopifyLine(line: EcommerceImportLine): Promise<string | null> {
    if (line.externalVariantId) {
      const mapping = await this.prisma.shopifyVariantMapping.findFirst({
        where: { shopifyVariantId: String(line.externalVariantId) },
      });
      if (mapping) return mapping.variantId;
    }

    return this.resolveBySku(line.sku);
  }

  private async resolveMlLine(line: EcommerceImportLine): Promise<string | null> {
    if (line.externalVariantId) {
      const mapping = await this.prisma.mlVariantMapping.findFirst({
        where: { mlItemId: String(line.externalVariantId) },
      });
      if (mapping) return mapping.variantId;
    }

    return this.resolveBySku(line.sku);
  }

  private async resolveWcLine(line: EcommerceImportLine): Promise<string | null> {
    if (line.externalVariantId?.includes(':')) {
      const [productPart, variationPart] = line.externalVariantId.split(':');
      const wcProductId = Number(productPart);
      const wcVariationId = Number(variationPart);
      if (!Number.isNaN(wcProductId) && !Number.isNaN(wcVariationId)) {
        const mapping = await this.prisma.wcVariantMapping.findFirst({
          where: { wcProductId, wcVariationId },
        });
        if (mapping) return mapping.variantId;
      }
    }

    return this.resolveBySku(line.sku);
  }
}
