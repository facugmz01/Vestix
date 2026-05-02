import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
// import axios from 'axios'; // npm install axios

@Injectable()
export class WooCommerceApiService {
  private readonly logger = new Logger(WooCommerceApiService.name);

  // Configured in production via .env:
  // WC_BASE_URL=https://mystore.com/wp-json/wc/v3
  // WC_CONSUMER_KEY=ck_...
  // WC_CONSUMER_SECRET=cs_...

  private readonly baseUrl = process.env.WC_BASE_URL ?? 'https://mystore.com/wp-json/wc/v3';
  private readonly auth = {
    username: process.env.WC_CONSUMER_KEY ?? 'ck_mock',
    password: process.env.WC_CONSUMER_SECRET ?? 'cs_mock',
  };

  /**
   * OUTBOUND: Push updated stock quantity for a specific WooCommerce product variation.
   * Called when the ERP inventory ledger records a movement.
   */
  async updateProductStock(wcProductId: number, wcVariationId: number, stockQuantity: number) {
    const url = `${this.baseUrl}/products/${wcProductId}/variations/${wcVariationId}`;
    try {
      // PRODUCTION:
      // await axios.put(url, { stock_quantity: stockQuantity, manage_stock: true }, { auth: this.auth });
      this.logger.log(`[WooCommerce] ↑ Stock updated — Product ${wcProductId} / Variation ${wcVariationId}: ${stockQuantity} units`);
      return { success: true };
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
    const url = `${this.baseUrl}/products/${wcProductId}/variations/${wcVariationId}`;
    try {
      // PRODUCTION:
      // await axios.put(url, { regular_price: regularPrice }, { auth: this.auth });
      this.logger.log(`[WooCommerce] ↑ Price updated — Product ${wcProductId}: $${regularPrice}`);
      return { success: true };
    } catch (err: any) {
      throw new InternalServerErrorException(`WooCommerce price update failed: ${err.message}`);
    }
  }

  /**
   * OUTBOUND: Update the WooCommerce order status to mirror the ERP fulfillment state.
   * e.g., When ERP ships an order → WooCommerce order becomes 'completed'.
   */
  async updateOrderStatus(wcOrderId: number, status: string) {
    const url = `${this.baseUrl}/orders/${wcOrderId}`;
    try {
      // PRODUCTION:
      // await axios.put(url, { status }, { auth: this.auth });
      this.logger.log(`[WooCommerce] ↑ Order ${wcOrderId} status → ${status}`);
      return { success: true };
    } catch (err: any) {
      throw new InternalServerErrorException(`WooCommerce order update failed: ${err.message}`);
    }
  }

  /**
   * INBOUND: Fetch full order details from WooCommerce by ID.
   * Used when a webhook payload contains only the order ID.
   */
  async getOrder(wcOrderId: number) {
    const url = `${this.baseUrl}/orders/${wcOrderId}`;
    try {
      // PRODUCTION:
      // const response = await axios.get(url, { auth: this.auth });
      // return response.data;
      
      // MOCK:
      return {
        id: wcOrderId,
        status: 'processing',
        billing: { email: 'customer@example.com', phone: '5491122334455', first_name: 'John', last_name: 'Doe' },
        line_items: [
          { product_id: 101, variation_id: 202, quantity: 2, price: '20.00' }
        ],
        total: '40.00'
      };
    } catch (err: any) {
      throw new InternalServerErrorException(`WooCommerce order fetch failed: ${err.message}`);
    }
  }
}
