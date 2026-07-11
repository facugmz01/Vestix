import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../../core/prisma/prisma.service';
import { SettingsService } from '../../modules/settings/settings.service';
import { EcommerceOrderImportService } from './ecommerce-order-import.service';
import { PaymentMethod } from '../sales/models/order.model';

const ML_API = 'https://api.mercadolibre.com';

@Injectable()
export class MercadoLibreService {
  private readonly logger = new Logger(MercadoLibreService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
    private readonly ecommerceOrderImport: EcommerceOrderImportService,
  ) {}

  private async getSettings() {
    return this.settingsService.getIntegrationSettings();
  }

  private async getAccessToken(): Promise<string | null> {
    const config = await this.getSettings() as any;
    if (config.mlAccessToken) return config.mlAccessToken;

    if (!config.mercadolibreEnabled || !config.mlAppId || !config.mlSecretKey) {
      return null;
    }

    try {
      const { data } = await axios.post(`${ML_API}/oauth/token`, null, {
        params: {
          grant_type: 'client_credentials',
          client_id: config.mlAppId,
          client_secret: config.mlSecretKey,
        },
      });
      return data.access_token ?? null;
    } catch (err: any) {
      this.logger.warn(`ML client_credentials failed: ${err.message}. Configure mlAccessToken for seller sync.`);
      return null;
    }
  }

  async authenticate() {
    const token = await this.getAccessToken();
    if (!token) throw new BadRequestException('Mercado Libre no está configurado o falta token de acceso');
    return token;
  }

  async testConnection() {
    try {
      const token = await this.authenticate();
      const { data } = await axios.get(`${ML_API}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { success: true, message: `Conectado como ${data.nickname || data.id}` };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  }

  /**
   * Push catalog variants to Mercado Libre (create or update listings).
   */
  async syncProducts() {
    const config = await this.getSettings() as any;
    if (!config.mercadolibreEnabled) {
      throw new BadRequestException('Mercado Libre no está habilitado');
    }

    const token = await this.getAccessToken();
    const variants = await this.prisma.productVariant.findMany({
      where: { isActive: true, product: { isPublished: true, isActive: true } },
      include: {
        product: { include: { category: true, brand: true } },
        mlMapping: true,
      },
      take: 200,
    });

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const variant of variants) {
      const title = [variant.product.name, variant.size, variant.color].filter(Boolean).join(' - ');
      const payload = {
        title,
        category_id: 'MLA3530',
        price: variant.basePrice,
        currency_id: 'ARS',
        available_quantity: 1,
        buying_mode: 'buy_it_now',
        listing_type_id: 'gold_special',
        condition: 'new',
        pictures: Array.isArray(variant.product.images)
          ? (variant.product.images as string[])
              .filter((img: string) => !img.startsWith('data:'))
              .slice(0, 10)
              .map((source: string) => ({ source }))
          : [],
      };

      try {
        if (variant.mlMapping?.mlItemId && token) {
          await axios.put(`${ML_API}/items/${variant.mlMapping.mlItemId}`, {
            price: payload.price,
            available_quantity: payload.available_quantity,
          }, { headers: { Authorization: `Bearer ${token}` } });
          await this.prisma.mlVariantMapping.update({
            where: { variantId: variant.id },
            data: { lastSyncAt: new Date() },
          });
          updated++;
        } else if (token && config.mlUserId) {
          const { data } = await axios.post(`${ML_API}/items`, payload, {
            headers: { Authorization: `Bearer ${token}` },
          });
          await this.prisma.mlVariantMapping.upsert({
            where: { variantId: variant.id },
            create: {
              variantId: variant.id,
              mlItemId: String(data.id),
              lastSyncAt: new Date(),
            },
            update: {
              mlItemId: String(data.id),
              lastSyncAt: new Date(),
            },
          });
          created++;
        } else {
          skipped++;
        }
      } catch (err: any) {
        this.logger.error(`ML sync failed for variant ${variant.sku}: ${err.message}`);
        await this.prisma.integrationLog.create({
          data: {
            provider: 'MERCADOLIBRE',
            direction: 'OUTBOUND',
            action: 'CATALOG_SYNC',
            status: 'FAILED',
            payload: { variantId: variant.id, sku: variant.sku },
            error: err.response?.data?.message || err.message,
          },
        });
      }
    }

    await this.settingsService.updateSection('integrations', {
      ...config,
      lastMlSyncAt: new Date().toISOString(),
    }, 'system');

    return {
      success: true,
      created,
      updated,
      skipped,
      total: variants.length,
      mode: token ? 'live' : 'dry-run',
    };
  }

  /**
   * Sync stock and prices from ERP to mapped ML listings.
   */
  async syncStockAndPrices() {
    const token = await this.getAccessToken();
    if (!token) throw new BadRequestException('Token ML no disponible');

    const mappings = await this.prisma.mlVariantMapping.findMany({
      include: { variant: { include: { product: true } } },
    });

    let updated = 0;
    for (const mapping of mappings) {
      const stockLevels = await this.prisma.stockLevel.findMany({
        where: { variantId: mapping.variantId },
      });
      const available = stockLevels.reduce((s, sl) => s + sl.availableQuantity, 0);

      await axios.put(`${ML_API}/items/${mapping.mlItemId}`, {
        price: mapping.variant.basePrice,
        available_quantity: Math.max(0, available),
      }, { headers: { Authorization: `Bearer ${token}` } });

      await this.prisma.mlVariantMapping.update({
        where: { id: mapping.id },
        data: { lastSyncAt: new Date() },
      });
      updated++;
    }

    return { success: true, updated };
  }

  async handleWebhook(topic: string, resource: string, payload?: any) {
    this.logger.log(`[ML Webhook] ${topic} → ${resource}`);

    const isOrderEvent = topic === 'orders_v2' || resource?.includes('/orders/');

    const job = await this.prisma.integrationLog.create({
      data: {
        provider: 'MERCADOLIBRE',
        direction: 'INBOUND',
        action: isOrderEvent ? 'ML_ORDER_WEBHOOK' : (topic || 'WEBHOOK'),
        status: 'PENDING',
        payload: payload ?? { resource, topic },
        attempts: 0,
      },
    });

    if (isOrderEvent) {
      this.logger.log(`[ML Webhook] Order event enqueued for processing — job ${job.id}`);
      setImmediate(() => this.processOrderWebhook(job.id));
    } else if (topic === 'items' || resource?.includes('/items/')) {
      this.logger.log(`[ML Webhook] Item update received: ${resource}`);
      void this.prisma.integrationLog.update({
        where: { id: job.id },
        data: { status: 'SUCCESS', response: { acknowledged: true } as any },
      });
    } else {
      void this.prisma.integrationLog.update({
        where: { id: job.id },
        data: { status: 'SUCCESS', response: { acknowledged: true } as any },
      });
    }

    return { received: true, jobId: job.id };
  }

  /**
   * Processes inbound ML order webhooks (async, enqueued from handleWebhook).
   */
  private async processOrderWebhook(jobId: string) {
    const job = await this.prisma.integrationLog.findUnique({ where: { id: jobId } });
    if (!job) return;

    await this.prisma.integrationLog.update({
      where: { id: jobId },
      data: { status: 'PROCESSING', attempts: { increment: 1 } },
    });

    try {
      const payload = (job.payload ?? {}) as Record<string, any>;
      const resource = payload.resource || '';
      const orderIdMatch = String(resource).match(/\/orders\/(\d+)/);
      const mlOrderId = orderIdMatch?.[1] || payload.id;

      this.logger.log(`[ML Order Webhook] Processing order ${mlOrderId} (job ${jobId})`);

      const token = await this.getAccessToken();
      if (!token) {
        throw new Error('Token ML no disponible para importar pedido');
      }

      const orderUrl = this.resolveMlOrderUrl(resource, mlOrderId);
      const { data: mlOrder } = await axios.get(orderUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const lines = (mlOrder.order_items ?? []).map((item: any) => ({
        sku: item.item?.seller_sku || item.item?.seller_custom_field || undefined,
        externalVariantId: item.item?.id != null ? String(item.item.id) : undefined,
        quantity: Number(item.quantity) || 1,
        unitPrice: item.unit_price != null ? Number(item.unit_price) : undefined,
      }));

      const importResult = await this.ecommerceOrderImport.importOrderLines(
        'MERCADOLIBRE',
        String(mlOrder.id ?? mlOrderId),
        lines,
        {
          paymentMethod: PaymentMethod.CREDIT_CARD,
          grandTotal: mlOrder.total_amount != null ? Number(mlOrder.total_amount) : undefined,
        },
      );

      await this.prisma.integrationLog.update({
        where: { id: jobId },
        data: {
          status: 'SUCCESS',
          response: {
            mlOrderId: String(mlOrder.id ?? mlOrderId),
            importStatus: importResult.status,
            message:
              importResult.status === 'ALREADY_IMPORTED'
                ? 'Order already imported'
                : 'Order imported into ERP',
          } as any,
        },
      });
    } catch (err: any) {
      const errorMessage = err.message || 'Unknown error';
      this.logger.error(`[ML Order Webhook] Job ${jobId} failed: ${errorMessage}`);
      await this.prisma.integrationLog.update({
        where: { id: jobId },
        data: { status: 'FAILED', error: errorMessage },
      });
    }
  }

  private resolveMlOrderUrl(resource: string, mlOrderId: string): string {
    if (resource?.startsWith('http')) return resource;
    if (resource?.startsWith('/')) return `${ML_API}${resource}`;
    return `${ML_API}/orders/${mlOrderId}`;
  }

  async getMappings() {
    return this.prisma.mlVariantMapping.findMany({
      include: {
        variant: {
          include: { product: { select: { name: true, baseSku: true } } },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async saveMapping(variantId: string, mlItemId: string, mlVariationId?: string) {
    return this.prisma.mlVariantMapping.upsert({
      where: { variantId },
      create: { variantId, mlItemId, mlVariationId },
      update: { mlItemId, mlVariationId },
    });
  }

  async deleteMapping(variantId: string) {
    await this.prisma.mlVariantMapping.delete({ where: { variantId } });
    return { success: true };
  }
}
