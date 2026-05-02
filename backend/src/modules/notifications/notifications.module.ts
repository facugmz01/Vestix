import { Module, Global } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { SmtpService } from './channels/smtp.service';
import { WhatsAppEvolutionService } from './channels/whatsapp-evolution.service';
import { NotificationsController } from './notifications.controller';

@Global() // Any module (Sales, Inventory, Finance) can inject NotificationsService without re-importing
@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, SmtpService, WhatsAppEvolutionService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
