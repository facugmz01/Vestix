import { Module } from '@nestjs/common';
import { PurchasingService } from './purchasing.service';
import { PurchasingController } from './purchasing.controller';
import { GoodsReceiptService } from './receipts/goods-receipt.service';

@Module({
  controllers: [PurchasingController],
  providers: [PurchasingService, GoodsReceiptService],
  exports: [PurchasingService, GoodsReceiptService]
})
export class PurchasingModule {}
