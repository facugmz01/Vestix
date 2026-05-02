import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { MercadoPagoService } from './mercado-pago.service';
import { SalesModule } from '../sales/sales.module';
import { FinanceModule } from '../finance/finance.module';

@Module({
  imports: [SalesModule, FinanceModule],
  providers: [PaymentsService, MercadoPagoService],
  exports: [PaymentsService]
})
export class PaymentsModule {}
