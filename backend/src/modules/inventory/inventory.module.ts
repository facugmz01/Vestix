import { Module, Global } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { InventoryService } from './inventory.service';
import { StockMovementService } from './stock-movement.service';
import { TransfersService } from './transfers/transfers.service';
import { ReservationsService } from './reservations/reservations.service';
import { ReservationExpiryJob } from './reservation-expiry.job';
import { InventoryController } from './inventory.controller';
import { PrismaModule } from '../../core/prisma/prisma.module';

@Global() 
@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule],
  controllers: [InventoryController],
  providers: [InventoryService, StockMovementService, TransfersService, ReservationsService, ReservationExpiryJob],
  exports: [InventoryService, StockMovementService, TransfersService, ReservationsService],
})
export class InventoryModule {}

