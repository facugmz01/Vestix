import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { SyncEngineService } from './sync-engine.service';
import { SyncBatch } from './models/sync-operation.model';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';

@Controller('offline')
export class OfflineController {
  constructor(private readonly syncEngine: SyncEngineService) {}

  /**
   * PRIMARY SYNC ENDPOINT
   * The POS Dexie.js client calls this when it regains connectivity.
   * Returns a per-operation status report so the POS UI can display 
   * "17 of 20 sales synced, 3 require manager attention".
   */
  @Post('sync')
  @RequirePermissions({ action: 'create', subject: 'Sync' })
  processBatch(@Body() batch: SyncBatch) {
    return this.syncEngine.processBatch(batch);
  }
}
