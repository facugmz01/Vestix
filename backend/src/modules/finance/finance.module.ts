import { Module, Global } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CashService } from './cash/cash.service';
import { FinanceController } from './finance.controller';
import { PrismaModule } from '../../core/prisma/prisma.module';

@Global() 
@Module({
  imports: [PrismaModule],
  controllers: [FinanceController],
  providers: [AccountsService, CashService],
  exports: [AccountsService, CashService],
})
export class FinanceModule {}
