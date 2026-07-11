import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../../core/prisma/prisma.service';
import { SettingsService } from '../../modules/settings/settings.service';
import { EcommerceOrderImportService } from './ecommerce-order-import.service';
import { PaymentMethod } from '../sales/models/order.model';

@Injectable()
export class ShopifyService {
  private readonly logger = new Logger(ShopifyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
    private readonly ecommerceOrderImport: EcommerceOrderImportService,
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
   * Sync inventory from ERP to Shopify for all mapped variants.
   */
  async syncInventory() {
    this.logger.log('Iniciando sincronización de inventario hacia Shopify...');
    const config = await this.getSettings();
    const client = this.getClient(config);

    try {
      const { data: locationsData } = await client.get('/locations.json');
      const shopifyLocationId = locationsData?.locations?.[0]?.id;
      if (!shopifyLocationId) {
        return { success: false, error: 'Shopify store has no inventory locations configured' };
      }

      const mappings = await this.prisma.shopifyVariantMapping.findMany({
        include: { variant: true },
      });

      if (mappings.length === 0) {
        return {
          success: false,
          error: 'No hay variantes mapeadas a Shopify. Configure ShopifyVariantMapping primero.',
          updated: 0,
        };
      }

      let updated = 0;
      const errors: string[] = [];

      for (const mapping of mappings) {
        try {
          const stockLevels = await this.prisma.stockLevel.findMany({
            where: { variantId: mapping.variantId },
          });
          const available = stockLevels.reduce((sum, sl) => sum + sl.availableQuantity, 0);

          let inventoryItemId = mapping.inventoryItemId;
          if (!inventoryItemId) {
            const { data: variantData } = await client.get(
              `/variants/${mapping.shopifyVariantId}.json`,
            );
            inventoryItemId = variantData?.variant?.inventory_item_id?.toString();
            if (inventoryItemId) {
              await this.prisma.shopifyVariantMapping.update({
                where: { id: mapping.id },
                data: { inventoryItemId, lastSyncAt: new Date() },
              });
            }
          }

          if (!inventoryItemId) {
            errors.push(`Variant ${mapping.variant.sku}: missing Shopify inventory_item_id`);
            continue;
          }

          await client.post('/inventory_levels/set.json', {
            location_id: shopifyLocationId,
            inventory_item_id: Number(inventoryItemId),
            available: Math.max(0, available),
          });

          await this.prisma.shopifyVariantMapping.update({
            where: { id: mapping.id },
            data: { lastSyncAt: new Date() },
          });
          updated++;
        } catch (err: any) {
          errors.push(`Variant ${mapping.variant.sku}: ${err.message}`);
        }
      }

      return {
        success: errors.length === 0,
        updated,
        total: mappings.length,
        errors: errors.length ? errors : undefined,
        message: `Sincronizados ${updated}/${mappings.length} variantes`,
      };
    } catch (err: any) {
      const message = err.response?.data?.errors || err.message || 'Unknown error';
      this.logger.error(`[Shopify] Inventory sync failed: ${message}`);
      return { success: false, error: `Shopify inventory sync failed: ${message}` };
    }
  }

  async syncStockForVariant(variantId: string, available: number) {
    const mapping = await this.prisma.shopifyVariantMapping.findUnique({
      where: { variantId },
      include: { variant: true },
    });
    if (!mapping) return { skipped: true };

    const config = await this.getSettings();
    const client = this.getClient(config);
    const { data: locationsData } = await client.get('/locations.json');
    const shopifyLocationId = locationsData?.locations?.[0]?.id;
    if (!shopifyLocationId) {
      throw new Error('Shopify store has no inventory locations');
    }

    let inventoryItemId = mapping.inventoryItemId;
    if (!inventoryItemId) {
      const { data: variantData } = await client.get(`/variants/${mapping.shopifyVariantId}.json`);
      inventoryItemId = variantData?.variant?.inventory_item_id?.toString();
      if (inventoryItemId) {
        await this.prisma.shopifyVariantMapping.update({
          where: { id: mapping.id },
          data: { inventoryItemId },
        });
      }
    }
    if (!inventoryItemId) {
      throw new Error(`Missing inventory_item_id for variant ${mapping.variant.sku}`);
    }

    await client.post('/inventory_levels/set.json', {
      location_id: shopifyLocationId,
      inventory_item_id: Number(inventoryItemId),
      available: Math.max(0, available),
    });

    await this.prisma.shopifyVariantMapping.update({
      where: { id: mapping.id },
      data: { lastSyncAt: new Date() },
    });

    return { success: true, variantId, available };
  }

  /**
   * Handle incoming Shopify webhooks.
   */
  async handleWebhook(topic: string, payload: any) {
    this.logger.log(`[Shopify Webhook] Recibido evento: ${topic}`);

    if (topic === 'orders/create' || topic === 'orders/paid') {
      const shopifyOrderId = String(payload?.id ?? payload?.order_id ?? '');
      const lineItems = payload?.line_items ?? [];
      const lineItemCount = lineItems.length;

      this.logger.log(
        `[Shopify Webhook] Order event "${topic}" — Shopify order ID: ${shopifyOrderId}, ` +
        `${lineItemCount} line item(s)`,
      );

      if (!shopifyOrderId) {
        return {
          success: false,
          received: true,
          message: 'Missing Shopify order ID in webhook payload',
        };
      }

      const lines = lineItems.map((item: any) => ({
        sku: item.sku || undefined,
        externalVariantId: item.variant_id != null ? String(item.variant_id) : undefined,
        quantity: Number(item.quantity) || 1,
        unitPrice: item.price != null ? Number(item.price) : undefined,
      }));

      const importResult = await this.ecommerceOrderImport.importOrderLines(
        'SHOPIFY',
        shopifyOrderId,
        lines,
        {
          paymentMethod: PaymentMethod.CREDIT_CARD,
          grandTotal: payload?.total_price != null ? Number(payload.total_price) : undefined,
        },
      );

      return {
        success: true,
        received: true,
        shopifyOrderId,
        lineItemCount,
        importStatus: importResult.status,
        message:
          importResult.status === 'ALREADY_IMPORTED'
            ? `Shopify order ${shopifyOrderId} already imported`
            : `Shopify order ${shopifyOrderId} imported into ERP`,
      };
    }

    if (topic === 'orders/updated') {
      const shopifyOrderId = payload?.id ?? payload?.order_id;
      this.logger.debug(
        `[Shopify Webhook] Order updated event acknowledged — order ${shopifyOrderId}`,
      );
      return {
        success: true,
        received: true,
        handled: false,
        shopifyOrderId,
        message: 'Order update acknowledged; import runs on create/paid only',
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
