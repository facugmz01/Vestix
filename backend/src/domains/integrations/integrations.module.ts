import { Module, Global } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { IntegrationsController } from './integrations.controller';
import { WooCommerceApiService } from './woocommerce-api.service';

@Global()
@Module({
  controllers: [IntegrationsController],
  providers: [IntegrationsService, WooCommerceApiService],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}
