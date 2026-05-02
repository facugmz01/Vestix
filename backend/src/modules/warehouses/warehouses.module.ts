import { Module } from '@nestjs/common';
import { WarehousesService } from './warehouses.service';
import { WarehousesController } from './warehouses.controller';
import { LocationsController } from './locations.controller';
import { PrismaModule } from '../../core/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WarehousesController, LocationsController],
  providers: [WarehousesService],
  exports: [WarehousesService],
})
export class WarehousesModule {}
