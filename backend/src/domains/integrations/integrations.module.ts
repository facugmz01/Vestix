import { Module, Global } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { IntegrationsController } from './integrations.controller';
import { WooCommerceApiService } from './woocommerce-api.service';
import { MercadoLibreService } from './mercadolibre.service';
import { ShopifyService } from './shopify.service';

@Global()
@Module({
  controllers: [IntegrationsController],
  providers: [
    IntegrationsService,
    WooCommerceApiService,
    MercadoLibreService,
    ShopifyService,
  ],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}
