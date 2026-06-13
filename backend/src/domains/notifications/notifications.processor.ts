import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { SmtpService } from './channels/smtp.service';
import { WhatsAppOpenWaService } from './channels/whatsapp-openwa.service';
import { SmsGatewayService } from './channels/sms-gateway.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { NotificationChannel } from './models/notification.model';

@Processor('notifications_queue')
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(
    private readonly smtpService: SmtpService,
    private readonly whatsAppService: WhatsAppOpenWaService,
    private readonly smsService: SmsGatewayService,
    private readonly prisma: PrismaService,
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

    // DB fetch for active template
    const template = await this.prisma.notificationTemplate.findUnique({
      where: {
        event_channel: { event: templateKey, channel },
      }
    });

    if (!template) {
      throw new Error(`No template found in DB for key=${templateKey}, channel=${channel}`);
    }

    const body = this.interpolate(template.body, variables);
    const subject = template.subject ? this.interpolate(template.subject, variables) : undefined;

    if (channel === 'EMAIL' as NotificationChannel) {
      await this.smtpService.send(recipient, subject || 'Notificación', body);
    } else if (channel === 'WHATSAPP' as NotificationChannel) {
      await this.whatsAppService.sendText(recipient, body);
    } else if (channel === 'SMS' as any) {
      await this.smsService.sendSms(recipient, body);
    }

    this.logger.log(`[Queue] ✓ Job ${job.id} successfully completed`);
  }

  private interpolate(template: string, variables: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? `{{${key}}}`);
  }
}
