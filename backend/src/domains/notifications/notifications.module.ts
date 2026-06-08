import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsService } from './notifications.service';
import { SmtpService } from './channels/smtp.service';
import { WhatsAppEvolutionService } from './channels/whatsapp-evolution.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsProcessor } from './notifications.processor';

@Global()
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'notifications_queue',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000, // 5s → 25s → 125s
        },
        removeOnComplete: true, // Keep Redis clean
        removeOnFail: false,
      },
    }),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    SmtpService,
    WhatsAppEvolutionService,
    NotificationsProcessor,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
