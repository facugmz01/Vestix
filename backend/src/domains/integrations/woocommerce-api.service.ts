import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';
import { SettingsService } from '../../modules/settings/settings.service';

@Injectable()
export class WooCommerceApiService {
  private readonly logger = new Logger(WooCommerceApiService.name);

  constructor(private readonly settingsService: SettingsService) {}

  private async getConfig() {
    const settings = await this.settingsService.getIntegrationSettings();

    const storeUrl = settings.wooStoreUrl?.trim() || process.env.WC_BASE_URL?.trim();
    const consumerKey = settings.wooConsumerKey?.trim() || process.env.WC_CONSUMER_KEY?.trim();
    const consumerSecret = settings.wooConsumerSecret?.trim() || process.env.WC_CONSUMER_SECRET?.trim();

    if (!storeUrl || !consumerKey || !consumerSecret) {
      throw new InternalServerErrorException(
        'WooCommerce credentials not configured. Set store URL, consumer key and secret in Admin → Integraciones.',
      );
    }

    return { storeUrl, consumerKey, consumerSecret };
  }

  private async getBaseUrl(): Promise<string> {
    const config = await this.getConfig();
    let url = config.storeUrl;
    if (!url.endsWith('/wp-json/wc/v3')) {
      url = `${url.replace(/\/$/, '')}/wp-json/wc/v3`;
    }
    return url;
  }

  private async getAuth() {
    const config = await this.getConfig();
    return {
      username: config.consumerKey,
      password: config.consumerSecret,
    };
  }

  /**
   * OUTBOUND: Push updated stock quantity for a specific WooCommerce product variation.
   * Called when the ERP inventory ledger records a movement.
   */
  async updateProductStock(wcProductId: number, wcVariationId: number, stockQuantity: number) {
    const url = `${await this.getBaseUrl()}/products/${wcProductId}/variations/${wcVariationId}`;
    try {
      this.logger.log(`[WooCommerce] ↑ Stock update request — Product ${wcProductId} / Variation ${wcVariationId}: ${stockQuantity} units`);

      const response = await axios.put(
        url,
        { stock_quantity: stockQuantity, manage_stock: true },
        { auth: await this.getAuth(), timeout: 10000 },
      );

      this.logger.log(`[WooCommerce] ✓ Stock updated successfully`);
      return response.data;
    } catch (err: any) {
      this.logger.error(`[WooCommerce] ✗ Failed to update stock: ${err.message}`);
      throw new InternalServerErrorException(`WooCommerce stock update failed: ${err.message}`);
    }
  }

  /**
   * OUTBOUND: Push a new price to a WooCommerce product variation.
   * Triggered when the ERP Pricing Engine runs a bulk price update.
   */
  async updateProductPrice(wcProductId: number, wcVariationId: number, regularPrice: string) {
    const url = `${await this.getBaseUrl()}/products/${wcProductId}/variations/${wcVariationId}`;
    try {
      this.logger.log(`[WooCommerce] ↑ Price update request — Product ${wcProductId}: $${regularPrice}`);

      const response = await axios.put(
        url,
        { regular_price: regularPrice },
        { auth: await this.getAuth(), timeout: 10000 },
      );

      this.logger.log(`[WooCommerce] ✓ Price updated successfully`);
      return response.data;
    } catch (err: any) {
      this.logger.error(`[WooCommerce] ✗ Failed to update price: ${err.message}`);
      throw new InternalServerErrorException(`WooCommerce price update failed: ${err.message}`);
    }
  }

  /**
   * OUTBOUND: Update the WooCommerce order status to mirror the ERP fulfillment state.
   * e.g., When ERP ships an order → WooCommerce order becomes 'completed'.
   */
  async updateOrderStatus(wcOrderId: number, status: string) {
    const url = `${await this.getBaseUrl()}/orders/${wcOrderId}`;
    try {
      this.logger.log(`[WooCommerce] ↑ Order status update request — Order ${wcOrderId} → ${status}`);

      const response = await axios.put(
        url,
        { status },
        { auth: await this.getAuth(), timeout: 10000 },
      );

      this.logger.log(`[WooCommerce] ✓ Order status updated successfully`);
      return response.data;
    } catch (err: any) {
      this.logger.error(`[WooCommerce] ✗ Failed to update order status: ${err.message}`);
      throw new InternalServerErrorException(`WooCommerce order update failed: ${err.message}`);
    }
  }

  /**
   * INBOUND: Fetch full order details from WooCommerce by ID.
   * Used when a webhook payload contains only the order ID.
   */
  async getOrder(wcOrderId: number) {
    const url = `${await this.getBaseUrl()}/orders/${wcOrderId}`;
    try {
      this.logger.log(`[WooCommerce] ↓ Fetching order details for Order ${wcOrderId}`);

      const response = await axios.get(url, { auth: await this.getAuth(), timeout: 10000 });

      return response.data;
    } catch (err: any) {
      this.logger.error(`[WooCommerce] ✗ Failed to fetch order details: ${err.message}`);
      throw new InternalServerErrorException(`WooCommerce order fetch failed: ${err.message}`);
    }
  }
}
