import { Module } from '@nestjs/common';
import { PurchasingService } from './purchasing.service';
import { PurchasingController } from './purchasing.controller';
import { ReceiptsController } from './receipts/receipts.controller';
import { GoodsReceiptService } from './receipts/goods-receipt.service';
import { PrismaModule } from '../../core/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PurchasingController, ReceiptsController],
  providers: [PurchasingService, GoodsReceiptService],
  exports: [PurchasingService, GoodsReceiptService]
})
export class PurchasingModule {}
