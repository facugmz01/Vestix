import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { WooCommerceApiService } from './woocommerce-api.service';
import { CheckoutOrchestrator } from '../sales/checkout.orchestrator';
import { OrderSource, PaymentMethod } from '../sales/models/order.model';
import { PrismaService } from '../../core/prisma/prisma.service';
import { SettingsService } from '../../modules/settings/settings.service';

const MAX_ATTEMPTS = 5;
const BASE_DELAY_MS = 2000; // 2s base for exponential backoff

export interface WebhookLogsFilters {
  page?: number;
  pageSize?: number;
  success?: boolean;
  direction?: string;
}

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);
  private readonly configPath = path.join(__dirname, 'integrations-config.json');

  constructor(
    private readonly wcApi: WooCommerceApiService,
    private readonly checkoutOrchestrator: CheckoutOrchestrator,
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
  ) {}

  // ─── CONFIGURATION MANAGEMENT ──────────────────────────────────────────────

  private async readConfigs() {
    const intSettings = await this.settingsService.getIntegrationSettings();
    const arcaSettings = await this.settingsService.getArcaSettings();
    
    return {
      mercadopago: {
        isActive: intSettings.mercadopagoEnabled,
        publicKey: intSettings.mpPublicKey,
        accessToken: intSettings.mpAccessToken,
        webhookSecret: intSettings.mpWebhookSecret,
      },
      woocommerce: {
        isActive: intSettings.woocommerceEnabled,
        storeUrl: intSettings.wooStoreUrl,
        consumerKey: intSettings.wooConsumerKey,
        consumerSecret: intSettings.wooConsumerSecret,
      },
      afip: {
        isActive: arcaSettings.enabled,
        cuit: arcaSettings.iibb, // Usually CUIT and IIBB are related or we store CUIT in general settings
        environment: arcaSettings.environment,
      },
      mercadolibre: {
        isActive: intSettings.mercadolibreEnabled,
        appId: intSettings.mlAppId,
        secretKey: intSettings.mlSecretKey,
      },
      shopify: {
        isActive: intSettings.shopifyEnabled,
        storeUrl: intSettings.shopifyStoreUrl,
        accessToken: intSettings.shopifyAccessToken,
      }
    };
  }

  async getAllIntegrations() {
    const configs = await this.readConfigs();
    const providers = ['MERCADOPAGO', 'WOOCOMMERCE', 'AFIP', 'MERCADOLIBRE', 'SHOPIFY'];
    
    return providers.map(prov => {
      const provLower = prov.toLowerCase();
      const provConfig = (configs as any)[provLower] || {};
      const isActive = provConfig.isActive ?? false;

      let status = 'PENDING_CONFIG';
      if (prov === 'MERCADOPAGO') {
        if (provConfig.accessToken && provConfig.publicKey) {
          status = isActive ? 'ACTIVE' : 'INACTIVE';
        }
      } else if (prov === 'WOOCOMMERCE') {
        if (provConfig.storeUrl && provConfig.consumerKey && provConfig.consumerSecret) {
          status = isActive ? 'ACTIVE' : 'INACTIVE';
        }
      } else if (prov === 'MERCADOLIBRE') {
        if (provConfig.appId && provConfig.secretKey) {
          status = isActive ? 'ACTIVE' : 'INACTIVE';
        }
      } else if (prov === 'SHOPIFY') {
        if (provConfig.storeUrl && provConfig.accessToken) {
          status = isActive ? 'ACTIVE' : 'INACTIVE';
        }
      } else if (prov === 'AFIP') {
        if (provConfig.cuit) {
          status = isActive ? 'ACTIVE' : 'INACTIVE';
        }
      }

      let name = prov;
      if (prov === 'WOOCOMMERCE') name = 'WooCommerce';
      if (prov === 'MERCADOLIBRE') name = 'Mercado Libre';
      if (prov === 'SHOPIFY') name = 'Shopify';
      if (prov === 'MERCADOPAGO') name = 'Mercado Pago';

      return {
        id: provLower,
        name,
        provider: prov,
        status,
        lastSyncAt: provConfig.lastSyncAt ? new Date(provConfig.lastSyncAt).toISOString() : null,
        webhookUrl: prov === 'WOOCOMMERCE' ? `${process.env.BACKEND_URL || 'http://localhost:3000'}/integrations/woocommerce/webhook` : null,
        config: provConfig,
      };
    });
  }

  async getIntegration(id: string) {
    const integrations = await this.getAllIntegrations();
    const found = integrations.find(i => i.id === id.toLowerCase());
    if (!found) {
      throw new BadRequestException('Integración no encontrada');
    }
    return found;
  }

  // Notice: saveConfig and toggleActive should now ideally go through SettingsService
  // For backwards compatibility with the Integrations page, we'll patch SystemSettings here.
  async saveConfig(id: string, config: Record<string, string>) {
    const currentInt = await this.settingsService.getIntegrationSettings();

    let updatedInt = { ...currentInt } as any;

    if (id === 'mercadopago') {
      updatedInt.mpPublicKey = config.publicKey;
      updatedInt.mpAccessToken = config.accessToken;
      updatedInt.mpWebhookSecret = config.webhookSecret;
    } else if (id === 'mercadolibre') {
      updatedInt.mlAppId = config.clientId;
      updatedInt.mlSecretKey = config.clientSecret;
    } else if (id === 'woocommerce') {
      updatedInt.wooStoreUrl = config.storeUrl;
      updatedInt.wooConsumerKey = config.consumerKey;
      updatedInt.wooConsumerSecret = config.consumerSecret;
    } else if (id === 'shopify') {
      updatedInt.shopifyStoreUrl = config.shopDomain;
      updatedInt.shopifyAccessToken = config.accessToken;
    }

    await this.settingsService.updateSection('integrations', updatedInt, 'system');

    return { success: true };
  }

  async toggleActive(id: string, isActive: boolean) {
    const currentInt = await this.settingsService.getIntegrationSettings();

    let updatedInt = { ...currentInt } as any;

    if (id === 'mercadopago') updatedInt.mercadopagoEnabled = isActive;
    else if (id === 'mercadolibre') updatedInt.mercadolibreEnabled = isActive;
    else if (id === 'woocommerce') updatedInt.woocommerceEnabled = isActive;
    else if (id === 'shopify') updatedInt.shopifyEnabled = isActive;

    await this.settingsService.updateSection('integrations', updatedInt, 'system');

    return { success: true };
  }

  async testConnection(id: string) {
    if (id.toLowerCase() === 'woocommerce') {
      try {
        const baseUrl = this.wcApi['getBaseUrl']();
        const auth = this.wcApi['getAuth']();
        await axios.get(`${baseUrl}/products`, { auth, params: { per_page: 1 }, timeout: 5000 });
        return { success: true, message: 'Conexión exitosa' };
      } catch (err: any) {
        return { success: false, message: `Fallo de conexión: ${err.message}` };
      }
    }
    if (id.toLowerCase() === 'afip') {
      return { success: true, message: 'Conexión simulada con AFIP homologación exitosa' };
    }
    return { success: false, message: 'Proveedor no soportado para test' };
  }

  async triggerSync(id: string) {
    if (id.toLowerCase() === 'woocommerce') {
      this.logger.log(`Full synchronization triggered for WooCommerce`);
      return { message: 'Sincronización iniciada (Log en consola)' };
    }
    return { message: 'Sincronización no soportada' };
  }

  // ─── LOGS MANAGEMENT (FOR ADMIN UI) ────────────────────────────────────────

  async getLogs(provider: string, filters: WebhookLogsFilters) {
    const page = filters.page ? Number(filters.page) : 1;
    const pageSize = filters.pageSize ? Number(filters.pageSize) : 10;
    const skip = (page - 1) * pageSize;

    const where: any = {
      provider: provider.toUpperCase(),
    };

    if (filters.direction) {
      where.direction = filters.direction;
    }
    if (filters.success !== undefined) {
      where.status = filters.success ? 'SUCCESS' : 'FAILED';
    }

    const [data, total] = await Promise.all([
      this.prisma.integrationLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.integrationLog.count({ where }),
    ]);

    const mappedData = data.map(log => ({
      id: log.id,
      integrationId: provider.toLowerCase(),
      direction: log.direction as 'INBOUND' | 'OUTBOUND',
      event: log.action,
      statusCode: log.status === 'SUCCESS' ? 200 : (log.status === 'FAILED' ? 500 : undefined),
      responseTime: undefined,
      success: log.status === 'SUCCESS',
      payload: log.payload ? JSON.stringify(log.payload) : undefined,
      errorMessage: log.error || undefined,
      createdAt: log.createdAt.toISOString(),
    }));

    return {
      data: mappedData,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async retryLog(provider: string, logId: string) {
    const log = await this.prisma.integrationLog.findUnique({
      where: { id: logId }
    });

    if (!log) {
      throw new BadRequestException('Log no encontrado');
    }

    const updatedLog = await this.prisma.integrationLog.update({
      where: { id: logId },
      data: {
        status: 'PENDING',
        attempts: 0,
        error: null,
      }
    });

    setImmediate(() => this.processJob(logId));

    return {
      id: updatedLog.id,
      integrationId: provider.toLowerCase(),
      direction: updatedLog.direction as 'INBOUND' | 'OUTBOUND',
      event: updatedLog.action,
      statusCode: undefined,
      responseTime: undefined,
      success: false,
      createdAt: updatedLog.createdAt.toISOString(),
    };
  }

  // ─── INBOUND: Receive webhooks FROM WooCommerce ──────────────────────────────

  async handleInboundWebhook(event: string, payload: Record<string, any>, wcSignature: string, rawBody: Buffer) {
    const expectedSig = crypto
      .createHmac('sha256', process.env.WC_WEBHOOK_SECRET ?? 'mock-secret')
      .update(rawBody)
      .digest('base64');

    if (expectedSig !== wcSignature) {
      this.logger.error('[Webhook] ✗ Invalid signature — possible spoofed request');
      throw new BadRequestException('Invalid webhook signature');
    }

    const job = await this.prisma.integrationLog.create({
      data: {
        provider: 'WOOCOMMERCE',
        direction: 'INBOUND',
        action: event,
        status: 'PENDING',
        payload: payload as any,
        attempts: 0,
      },
    });

    setImmediate(() => this.processJob(job.id));
    return { received: true, jobId: job.id };
  }

  // ─── OUTBOUND: Push updates TO WooCommerce from ERP events ───────────────────

  async syncStockToWooCommerce(variantId: string, newQuantity: number) {
    const mapping = await this.prisma.wcVariantMapping.findUnique({
      where: { variantId },
    });
    if (!mapping) return;

    const job = await this.prisma.integrationLog.create({
      data: {
        provider: 'WOOCOMMERCE',
        direction: 'OUTBOUND',
        action: 'STOCK_UPDATE',
        status: 'PENDING',
        payload: { variantId, newQuantity, ...mapping } as any,
        attempts: 0,
      },
    });

    setImmediate(() => this.processJob(job.id));
  }

  async syncPriceToWooCommerce(variantId: string, newPrice: number) {
    const mapping = await this.prisma.wcVariantMapping.findUnique({
      where: { variantId },
    });
    if (!mapping) return;

    const job = await this.prisma.integrationLog.create({
      data: {
        provider: 'WOOCOMMERCE',
        direction: 'OUTBOUND',
        action: 'PRICE_UPDATE',
        status: 'PENDING',
        payload: { variantId, newPrice, ...mapping } as any,
        attempts: 0,
      },
    });

    setImmediate(() => this.processJob(job.id));
  }


  // ─── JOB PROCESSOR ───────────────────────────────────────────────────────────

  async processJob(jobId: string) {
    const job = await this.prisma.integrationLog.findUnique({ where: { id: jobId } });
    if (!job) return;

    await this.prisma.integrationLog.update({
      where: { id: jobId },
      data: {
        status: 'PROCESSING',
        attempts: { increment: 1 },
      },
    });

    try {
      if (job.direction === 'INBOUND') {
        await this.processInboundJob(job);
      } else {
        await this.processOutboundJob(job);
      }

      await this.prisma.integrationLog.update({
        where: { id: jobId },
        data: {
          status: 'SUCCESS',
          response: { success: true } as any,
        },
      });
      this.logger.log(`[Sync] ✓ Job ${job.id} (${job.action}) completed`);

    } catch (err: any) {
      const currentAttempts = job.attempts + 1;
      const errorMessage = err.message || 'Unknown error';

      if (currentAttempts < MAX_ATTEMPTS) {
        const delayMs = Math.pow(2, currentAttempts) * BASE_DELAY_MS;
        await this.prisma.integrationLog.update({
          where: { id: jobId },
          data: {
            status: 'RETRYING',
            error: errorMessage,
          },
        });
        this.logger.warn(`[Retry] Job ${job.id} failed (attempt ${currentAttempts}/${MAX_ATTEMPTS}). Retrying in ${delayMs}ms`);
        setTimeout(() => this.processJob(jobId), delayMs);
      } else {
        await this.prisma.integrationLog.update({
          where: { id: jobId },
          data: {
            status: 'FAILED',
            error: errorMessage,
          },
        });
        this.logger.error(`[Sync] ✗ Job ${job.id} permanently FAILED: ${errorMessage}`);
      }
    }
  }

  // ─── INBOUND HANDLERS ────────────────────────────────────────────────────────

  private async processInboundJob(job: any) {
    if (job.action === 'woocommerce_new_order' || job.action === 'order.created') {
      const payload = job.payload as Record<string, any>;
      const wcOrder = await this.wcApi.getOrder(payload.id);

      const branch = await this.prisma.branch.findFirst({ where: { isMain: true } }) || await this.prisma.branch.findFirst();
      if (!branch) {
        throw new Error('No se encontró una sucursal en el ERP para asociar el pedido de WooCommerce.');
      }
      const warehouse = await this.prisma.warehouse.findFirst({ where: { branchId: branch.id } });

      const erpOrderDto = {
        id: crypto.randomUUID(),
        branchId: branch.id,
        warehouseId: warehouse?.id || null,
        source: OrderSource.ECOMMERCE,
        customerId: undefined,
        lines: wcOrder.line_items.map((item: any) => ({
          variantId: `wc-variation-${item.variation_id}`,
          categoryId: 'ECOMMERCE',
          quantity: item.quantity,
        })),
        paymentMethod: PaymentMethod.CREDIT_CARD,
        paymentAccountId: undefined,
        createdAtIso: new Date().toISOString(),
      };

      await this.checkoutOrchestrator.processCheckout(erpOrderDto as any);
      this.logger.log(`[Inbound] ✓ WooCommerce Order ${payload.id} imported into ERP`);
    }
  }

  // ─── OUTBOUND HANDLERS ───────────────────────────────────────────────────────

  private async processOutboundJob(job: any) {
    const payload = job.payload as Record<string, any>;
    const { wcProductId, wcVariationId } = payload;

    if (job.action === 'STOCK_UPDATE') {
      await this.wcApi.updateProductStock(wcProductId, wcVariationId, payload.newQuantity);
    }

    if (job.action === 'PRICE_UPDATE') {
      await this.wcApi.updateProductPrice(wcProductId, wcVariationId, payload.newPrice.toFixed(2));
    }
  }

  // ─── WOOCOMMERCE VARIANT MAPPINGS ──────────────────────────────────────────

  async getWcMappings() {
    return this.prisma.wcVariantMapping.findMany({
      include: {
        variant: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async saveWcMapping(variantId: string, wcProductId: number, wcVariationId: number) {
    return this.prisma.wcVariantMapping.upsert({
      where: { variantId },
      create: {
        variantId,
        wcProductId,
        wcVariationId,
      },
      update: {
        wcProductId,
        wcVariationId,
      },
    });
  }

  async deleteWcMapping(variantId: string) {
    return this.prisma.wcVariantMapping.delete({
      where: { variantId },
    });
  }
}
