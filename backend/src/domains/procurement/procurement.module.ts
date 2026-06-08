import { Module, Global } from '@nestjs/common';
import { PurchasingService } from './purchasing.service';
import { PurchasingController } from './purchasing.controller';
import { ReceiptsController } from './receipts/receipts.controller';
import { GoodsReceiptService } from './receipts/goods-receipt.service';
import { SuppliersService } from './suppliers.service';
import { SuppliersController } from './suppliers.controller';
import { PrismaModule } from '../../core/prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [
    PurchasingController,
    ReceiptsController,
    SuppliersController,
  ],
  providers: [
    PurchasingService,
    GoodsReceiptService,
    SuppliersService,
  ],
  exports: [
    PurchasingService,
    GoodsReceiptService,
    SuppliersService,
  ],
})
export class ProcurementModule {}
