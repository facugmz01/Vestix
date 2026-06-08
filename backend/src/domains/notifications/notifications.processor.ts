import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { SmtpService } from './channels/smtp.service';
import { WhatsAppEvolutionService } from './channels/whatsapp-evolution.service';
import { NOTIFICATION_TEMPLATES } from './templates/notification-templates.registry';
import { NotificationChannel } from './models/notification.model';

@Processor('notifications_queue')
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(
    private readonly smtpService: SmtpService,
    private readonly whatsAppService: WhatsAppEvolutionService,
  ) {
    super();
  }

  async process(
    job: Job<{
      channel: NotificationChannel;
      templateKey: string;
      recipient: string;
      variables: Record<string, string>;
    }>,
  ) {
    const { channel, templateKey, recipient, variables } = job.data;
    this.logger.log(`[Queue] Processing job ${job.id} for ${recipient}`);

    const template = NOTIFICATION_TEMPLATES.find(
      t => t.key === templateKey && t.channel === channel,
    );

    if (!template) {
      throw new Error(`No template found for key=${templateKey}, channel=${channel}`);
    }

    const body = this.interpolate(template.body, variables);
    const subject = template.subject ? this.interpolate(template.subject, variables) : undefined;

    if (channel === NotificationChannel.EMAIL) {
      await this.smtpService.send(recipient, subject!, body);
    } else if (channel === NotificationChannel.WHATSAPP) {
      await this.whatsAppService.sendText(recipient, body);
    }

    this.logger.log(`[Queue] ✓ Job ${job.id} successfully completed`);
  }

  private interpolate(template: string, variables: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? `{{${key}}}`);
  }
}
