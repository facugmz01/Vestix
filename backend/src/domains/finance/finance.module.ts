import { Module, Global } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CashService } from './cash/cash.service';
import { PaymentsService } from './payments.service';
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
