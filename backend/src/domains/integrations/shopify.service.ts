import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../../core/prisma/prisma.service';
import { SettingsService } from '../../modules/settings/settings.service';

@Injectable()
export class ShopifyService {
  private readonly logger = new Logger(ShopifyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService
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
      }
    });
  }

  /**
   * Sync inventory from ERP to Shopify
   */
  async syncInventory() {
    this.logger.log('Iniciando sincronización de inventario hacia Shopify...');
    const config = await this.getSettings();
    const client = this.getClient(config);

    // Simulated sync
    this.logger.log('Actualizando niveles de inventario en Shopify...');
    await new Promise(resolve => setTimeout(resolve, 800));

    this.logger.log('Sincronización de inventario finalizada.');
    return { success: true };
  }

  /**
   * Handle incoming Shopify webhooks
   */
  async handleWebhook(topic: string, payload: any) {
    this.logger.log(`[Shopify Webhook] Recibido evento: ${topic}`);
    // e.g. 'orders/create' -> map to ERP SaleOrder
    return { success: true };
  }
}
