import { Module } from '@nestjs/common';
import { PurchasingService } from './purchasing.service';
import { PurchasingController } from './purchasing.controller';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [PrismaModule, InventoryModule],
  providers: [PurchasingService],
  controllers: [PurchasingController]
})
export class PurchasingModule {}
