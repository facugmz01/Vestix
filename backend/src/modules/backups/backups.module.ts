import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { BackupsController } from './backups.controller';
import { BackupsService, BACKUPS_QUEUE } from './backups.service';
import { BackupsProcessor } from './backups.processor';

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
  providers: [BackupsService, BackupsProcessor],
  exports: [BackupsService],
})
export class BackupsModule {}
