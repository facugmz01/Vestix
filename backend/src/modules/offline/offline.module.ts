import { Module } from '@nestjs/common';
import { SyncEngineService } from './sync-engine.service';
import { ConflictResolutionService } from './conflict-resolution.service';
import { OfflineController } from './offline.controller';
import { SalesModule } from '../sales/sales.module';

@Module({
  imports: [SalesModule],
  controllers: [OfflineController],
  providers: [SyncEngineService, ConflictResolutionService],
  exports: [SyncEngineService],
})
export class OfflineModule {}
