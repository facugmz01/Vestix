import { Module } from '@nestjs/common';
import { WarehousesService } from './warehouses.service';
import { WarehousesController } from './warehouses.controller';
import { LocationsController } from './locations.controller';

@Module({
  controllers: [WarehousesController, LocationsController],
  // imports: [BranchesModule], // Requires dependency on Branches for validation
  providers: [WarehousesService],
  exports: [WarehousesService], // Exported heavily for the Inventory Module to use
})
export class WarehousesModule {}
