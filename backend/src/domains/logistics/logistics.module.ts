import { Module, Global } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../../core/prisma/prisma.module';

import { InventoryService } from './inventory.service';
import { StockMovementService } from './stock-movement.service';
import { TransfersService } from './transfers/transfers.service';
import { ReservationsService } from './reservations/reservations.service';
import { ReservationExpiryJob } from './reservation-expiry.job';
import { InventoryController } from './inventory.controller';

import { BranchesService } from './branches.service';
import { BranchesController } from './branches.controller';
import { LocationsController } from './locations.controller';

import { WarehousesService } from './warehouses.service';
import { WarehousesController } from './warehouses.controller';

@Global()
@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule],
  controllers: [
    InventoryController,
    BranchesController,
    LocationsController,
    WarehousesController,
  ],
  providers: [
    InventoryService,
    StockMovementService,
    TransfersService,
    ReservationsService,
    ReservationExpiryJob,
    BranchesService,
    WarehousesService,
  ],
  exports: [
    InventoryService,
    StockMovementService,
    TransfersService,
    ReservationsService,
    BranchesService,
    WarehousesService,
  ],
})
export class LogisticsModule {}
