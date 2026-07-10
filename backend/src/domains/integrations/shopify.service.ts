import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../../core/prisma/prisma.service';
import { SettingsService } from '../../modules/settings/settings.service';

@Injectable()
export class ShopifyService {
  private readonly logger = new Logger(ShopifyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
  ) {}

  private async getSettings() {
    return this.settingsService.getIntegrationSettings();
  }

  private getClient(config: any) {
    if (!config.shopifyEnabled || !config.shopifyStoreUrl || !config.shopifyAccessToken) {
      throw new Error('Shopify no está configurado o habilitado');
    }

    return axios.create({
      baseURL: `https://${config.shopifyStoreUrl}/admin/api/2023-10`,
      headers: {
        'X-Shopify-Access-Token': config.shopifyAccessToken,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Sync inventory from ERP to Shopify.
   * Verifies API connectivity; full sync requires variant-to-Shopify inventory mapping (not yet implemented).
   */
  async syncInventory() {
    this.logger.log('Iniciando sincronización de inventario hacia Shopify...');
    const config = await this.getSettings();
    const client = this.getClient(config);

    try {
      const { data: locationsData } = await client.get('/locations.json');
      const locationCount = locationsData?.locations?.length ?? 0;
      this.logger.log(`Shopify API reachable — ${locationCount} location(s) found`);

      const activeVariants = await this.prisma.productVariant.count({
        where: { isActive: true, product: { isActive: true } },
      });

      if (activeVariants === 0) {
        return { success: true, updated: 0, message: 'No active variants to sync' };
      }

      const error =
        'Shopify inventory sync not implemented: variant-to-Shopify inventory item mapping required';
      this.logger.warn(`[Shopify] ${error}`);
      return { success: false, error };
    } catch (err: any) {
      const message = err.response?.data?.errors || err.message || 'Unknown error';
      this.logger.error(`[Shopify] Inventory sync failed: ${message}`);
      return { success: false, error: `Shopify inventory sync failed: ${message}` };
    }
  }

  /**
   * Handle incoming Shopify webhooks.
   */
  async handleWebhook(topic: string, payload: any) {
    this.logger.log(`[Shopify Webhook] Recibido evento: ${topic}`);

    if (topic === 'orders/create' || topic === 'orders/paid' || topic === 'orders/updated') {
      const shopifyOrderId = payload?.id ?? payload?.order_id;
      const lineItemCount = payload?.line_items?.length ?? 0;

      this.logger.log(
        `[Shopify Webhook] Order event "${topic}" — Shopify order ID: ${shopifyOrderId}, ` +
        `${lineItemCount} line item(s)`,
      );

      // TODO: Map Shopify line_items (variant_id / sku) to ERP ProductVariant
      // TODO: Wire mapped lines to CheckoutOrchestrator.processCheckout
      this.logger.warn(
        `[Shopify Webhook] Order mapping not implemented — order ${shopifyOrderId} logged only`,
      );

      return {
        success: false,
        received: true,
        orderMapping: 'not_implemented',
        message: 'Order webhook logged; ERP import not yet implemented',
        shopifyOrderId,
        lineItemCount,
      };
    }

    this.logger.debug(`[Shopify Webhook] Event "${topic}" acknowledged (no handler)`);
    return {
      success: true,
      received: true,
      handled: false,
      message: `Event ${topic} acknowledged`,
    };
  }
}
