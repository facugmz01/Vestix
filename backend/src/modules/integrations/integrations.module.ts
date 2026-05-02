import { Module } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { IntegrationsController } from './integrations.controller';
import { WooCommerceApiService } from './woocommerce-api.service';
import { SalesModule } from '../sales/sales.module';

@Module({
  imports: [SalesModule],
  controllers: [IntegrationsController],
  providers: [IntegrationsService, WooCommerceApiService],
  exports: [IntegrationsService], // Exported so InventoryService and PricingService can call syncStock/syncPrice
})
export class IntegrationsModule {}
