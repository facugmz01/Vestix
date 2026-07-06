import { Module, Global } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CashService } from './cash/cash.service';
import { PaymentsService } from './payments.service';
import { MercadoPagoService } from './mercado-pago.service';
import { CurrentAccountsService } from './current-accounts.service';
import { FinanceController } from './finance.controller';
import { PrismaModule } from '../../core/prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [FinanceController],
  providers: [
    AccountsService,
    CashService,
    PaymentsService,
    MercadoPagoService,
    CurrentAccountsService,
  ],
  exports: [
    AccountsService,
    CashService,
    PaymentsService,
    CurrentAccountsService,
  ],
})
export class FinanceModule {}
