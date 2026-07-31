import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { BackupsController } from './backups.controller';
import { BackupsService, BACKUPS_QUEUE } from './backups.service';
import { BackupsProcessor } from './backups.processor';
import { RestoreMaintenanceService } from './restore-maintenance.service';
import { RestoreMaintenanceGuard } from './restore-maintenance.guard';

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    BullModule.registerQueue({
      name: BACKUPS_QUEUE,
      defaultJobOptions: {
        attempts: 1,
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
  ],
  controllers: [BackupsController],
  providers: [
    BackupsService,
    BackupsProcessor,
    RestoreMaintenanceService,
    RestoreMaintenanceGuard,
  ],
  exports: [BackupsService, RestoreMaintenanceService],
})
export class BackupsModule {}
