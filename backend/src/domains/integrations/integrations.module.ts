import { Module, Global } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { IntegrationsController } from './integrations.controller';
import { WooCommerceApiService } from './woocommerce-api.service';
import { MercadoLibreService } from './mercadolibre.service';
import { ShopifyService } from './shopify.service';
import { EcommerceOrderImportService } from './ecommerce-order-import.service';

@Global()
@Module({
  controllers: [IntegrationsController],
  providers: [
    IntegrationsService,
    WooCommerceApiService,
    MercadoLibreService,
    ShopifyService,
    EcommerceOrderImportService,
  ],
  exports: [IntegrationsService, EcommerceOrderImportService],
})
export class IntegrationsModule {}
