import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { SyncJob, SyncDirection, SyncJobStatus, WooCommerceEvent } from './models/sync-job.model';
import { WooCommerceApiService } from './woocommerce-api.service';
import { CheckoutOrchestrator } from '../sales/checkout.orchestrator';
import { OrderSource, PaymentMethod } from '../sales/models/order.model';

const MAX_ATTEMPTS = 5;
const BASE_DELAY_MS = 2000; // 2s base for exponential backoff

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);
  private jobs: SyncJob[] = [];

  constructor(
    private readonly wcApi: WooCommerceApiService,
    private readonly checkoutOrchestrator: CheckoutOrchestrator,
  ) {}

  // ─── INBOUND: Receive webhooks FROM WooCommerce ──────────────────────────────

  /**
   * WEBHOOK HANDLER: Called by the IntegrationsController when WooCommerce pings us.
   * We verify the signature, enqueue a job, and respond immediately (< 200ms)
   * so WooCommerce never times out and marks the webhook as failed.
   */
  async handleInboundWebhook(event: string, payload: Record<string, any>, wcSignature: string, rawBody: Buffer) {
    // 1. Cryptographic Signature Verification (HMAC-SHA256)
    // WooCommerce sends 'X-WC-Webhook-Signature' header — must match our secret.
    const expectedSig = crypto
      .createHmac('sha256', process.env.WC_WEBHOOK_SECRET ?? 'mock-secret')
      .update(rawBody)
      .digest('base64');

    if (expectedSig !== wcSignature) {
      this.logger.error('[Webhook] ✗ Invalid signature — possible spoofed request');
      throw new BadRequestException('Invalid webhook signature');
    }

    const job = this.enqueueJob(SyncDirection.INBOUND, event, payload, payload.id?.toString());
    setImmediate(() => this.processJob(job.id));
    return { received: true, jobId: job.id };
  }

  // ─── OUTBOUND: Push updates TO WooCommerce from ERP events ───────────────────

  /**
   * STOCK SYNC: Called by InventoryService after any ledger movement.
   * Maps the ERP variantId to the WooCommerce product/variation ID pair
   * and pushes the updated quantity.
   */
  async syncStockToWooCommerce(variantId: string, newQuantity: number) {
    // In production, this mapping lives in a DB table: variant_id <-> wc_product_id + wc_variation_id
    const mapping = this.getMockWcMapping(variantId);
    if (!mapping) return; // Variant not synced to WooCommerce (e.g., in-store-only SKU)

    const job = this.enqueueJob(SyncDirection.OUTBOUND, 'STOCK_UPDATE', {
      variantId, newQuantity, ...mapping
    });

    setImmediate(() => this.processJob(job.id));
  }

  /**
   * PRICE SYNC: Called by PricingService after a bulk update.
   */
  async syncPriceToWooCommerce(variantId: string, newPrice: number) {
    const mapping = this.getMockWcMapping(variantId);
    if (!mapping) return;

    const job = this.enqueueJob(SyncDirection.OUTBOUND, 'PRICE_UPDATE', {
      variantId, newPrice, ...mapping
    });

    setImmediate(() => this.processJob(job.id));
  }

  // ─── JOB PROCESSOR ───────────────────────────────────────────────────────────

  async processJob(jobId: string) {
    const job = this.jobs.find(j => j.id === jobId);
    if (!job) return;

    job.status = SyncJobStatus.PROCESSING;
    job.attempts += 1;
    job.updatedAt = new Date();

    try {
      if (job.direction === SyncDirection.INBOUND) {
        await this.processInboundJob(job);
      } else {
        await this.processOutboundJob(job);
      }

      job.status = SyncJobStatus.COMPLETED;
      job.updatedAt = new Date();
      this.logger.log(`[Sync] ✓ Job ${job.id} (${job.event}) completed`);

    } catch (err: any) {
      job.lastError = err.message;
      job.updatedAt = new Date();

      if (job.attempts < MAX_ATTEMPTS) {
        const delayMs = Math.pow(2, job.attempts) * BASE_DELAY_MS;
        job.status = SyncJobStatus.RETRYING;
        this.logger.warn(`[Retry] Job ${job.id} failed (attempt ${job.attempts}/${MAX_ATTEMPTS}). Retrying in ${delayMs}ms`);
        setTimeout(() => this.processJob(jobId), delayMs);
      } else {
        job.status = SyncJobStatus.FAILED;
        this.logger.error(`[Sync] ✗ Job ${job.id} permanently FAILED: ${err.message}`);
      }
    }
  }

  // ─── INBOUND HANDLERS ────────────────────────────────────────────────────────

  private async processInboundJob(job: SyncJob) {
    if (job.event === WooCommerceEvent.ORDER_CREATED) {
      const wcOrder = await this.wcApi.getOrder(job.payload.id);

      // Translate WooCommerce order structure into our ERP's CreateOrderDto
      const erpOrderDto = {
        id: crypto.randomUUID(),
        branchId: 'E-COMMERCE-BRANCH',
        warehouseId: 'E-COMMERCE-WAREHOUSE',
        source: OrderSource.ECOMMERCE,
        customerId: undefined,
        lines: wcOrder.line_items.map((item: any) => ({
          variantId: `wc-variation-${item.variation_id}`,
          categoryId: 'ECOMMERCE',
          quantity: item.quantity,
        })),
        paymentMethod: PaymentMethod.CREDIT_CARD,
        paymentAccountId: 'VIRTUAL-MP-ACCOUNT-ID',
        createdAtIso: new Date().toISOString(),
      };

      await this.checkoutOrchestrator.processCheckout(erpOrderDto);
      this.logger.log(`[Inbound] ✓ WooCommerce Order ${job.payload.id} imported into ERP`);
    }
  }

  // ─── OUTBOUND HANDLERS ───────────────────────────────────────────────────────

  private async processOutboundJob(job: SyncJob) {
    const { wcProductId, wcVariationId } = job.payload;

    if (job.event === 'STOCK_UPDATE') {
      await this.wcApi.updateProductStock(wcProductId, wcVariationId, job.payload.newQuantity);
    }

    if (job.event === 'PRICE_UPDATE') {
      await this.wcApi.updateProductPrice(wcProductId, wcVariationId, job.payload.newPrice.toFixed(2));
    }
  }

  // ─── UTILITIES ───────────────────────────────────────────────────────────────

  private enqueueJob(direction: SyncDirection, event: string, payload: Record<string, any>, externalId?: string): SyncJob {
    const job: SyncJob = {
      id: crypto.randomUUID(),
      direction,
      event,
      payload,
      status: SyncJobStatus.QUEUED,
      attempts: 0,
      externalId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.jobs.push(job);
    return job;
  }

  /** Maps an internal ERP variantId to its WooCommerce product/variation ID pair. */
  private getMockWcMapping(variantId: string) {
    // In production, query: prisma.wcVariantMapping.findUnique({ where: { variantId } })
    const mappings: Record<string, { wcProductId: number; wcVariationId: number }> = {
      'mock-variant-id-123': { wcProductId: 101, wcVariationId: 202 },
    };
    return mappings[variantId] ?? null;
  }
}
