import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { ReturnsService } from './returns/returns.service';
import { OrdersFulfillmentService } from './orders/orders-fulfillment.service';
import { CheckoutOrchestrator } from './checkout.orchestrator';
import { AfipModule } from '../afip/afip.module';

@Module({
  imports: [AfipModule],
  controllers: [SalesController],
  providers: [SalesService, ReturnsService, OrdersFulfillmentService, CheckoutOrchestrator],
  exports: [SalesService, ReturnsService, OrdersFulfillmentService, CheckoutOrchestrator]
})
export class SalesModule {}
