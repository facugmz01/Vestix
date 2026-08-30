import { Module, Global } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CashService } from './cash/cash.service';
import { PaymentsService } from './payments.service';
import { CurrentAccountsService } from './current-accounts.service';
import { FinanceDocumentsService } from './finance-documents.service';
import { CostingService } from './costing.service';
import { AccountAdjustmentsService } from './account-adjustments.service';
import { ExpensesService } from './expenses/expenses.service';
import { ExpenseCategoriesService } from './expenses/expense-categories.service';
import { FinanceController } from './finance.controller';
import { ExpensesController } from './expenses/expenses.controller';
import { PrismaModule } from '../../core/prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [FinanceController, ExpensesController],
  providers: [
    AccountsService,
    CashService,
    PaymentsService,
    CurrentAccountsService,
    FinanceDocumentsService,
    CostingService,
    AccountAdjustmentsService,
    ExpensesService,
    ExpenseCategoriesService,
  ],
  exports: [
    AccountsService,
    CashService,
    PaymentsService,
    CurrentAccountsService,
    FinanceDocumentsService,
    CostingService,
    AccountAdjustmentsService,
    ExpensesService,
    ExpenseCategoriesService,
  ],
})
export class FinanceModule {}
