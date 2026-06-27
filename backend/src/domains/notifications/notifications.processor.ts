import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { SmtpService } from './channels/smtp.service';
import { WhatsAppEvolutionService } from './channels/whatsapp-evolution.service';
import { SmsGatewayService } from './channels/sms-gateway.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { NotificationChannel } from './models/notification.model';

interface NotificationJobData {
  channel:     string;
  templateKey: string;
  recipient:   string;
  variables:   Record<string, string>;
  logId?:      string; // NotificationLog.id — present when dispatched via enqueue()
}

@Processor('notifications_queue')
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(
    private readonly smtpService: SmtpService,
    private readonly whatsAppService: WhatsAppEvolutionService,
    private readonly smsService: SmsGatewayService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<NotificationJobData>) {
    const { channel, templateKey, recipient, variables, logId } = job.data;
    this.logger.log(`[Queue] Processing job ${job.id} — ${channel}/${templateKey} → ${recipient}`);

    // Fetch template body from DB
    const template = await this.prisma.notificationTemplate.findUnique({
      where: { event_channel: { event: templateKey, channel } },
    });

    if (!template) {
      const error = `No template found in DB for key=${templateKey}, channel=${channel}`;
      await this.failLog(logId, error);
      throw new Error(error);
    }

    const body    = this.interpolate(template.body, variables);
    const subject = template.subject ? this.interpolate(template.subject, variables) : undefined;

    try {
      if (channel === NotificationChannel.EMAIL) {
        await this.smtpService.send(recipient, subject || 'Notificación', body);
      } else if (channel === NotificationChannel.WHATSAPP) {
        await this.whatsAppService.sendText(recipient, body);
      } else if (channel === NotificationChannel.SMS) {
        await this.smsService.sendSms(recipient, body);
      } else {
        this.logger.warn(`[Queue] Channel "${channel}" has no dispatcher. Skipping send.`);
      }

      // Mark log as SENT
      if (logId) {
        await this.prisma.notificationLog.update({
          where: { id: logId },
          data:  { status: 'SENT', sentAt: new Date() },
        }).catch(e => this.logger.warn(`Could not update log ${logId}: ${e.message}`));
      }

      this.logger.log(`[Queue] ✓ Job ${job.id} completed successfully`);
    } catch (err: any) {
      await this.failLog(logId, err.message);
      throw err; // rethrow so BullMQ marks the job as failed and retries
    }
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private async failLog(logId: string | undefined, errorMessage: string) {
    if (!logId) return;
    await this.prisma.notificationLog.update({
      where: { id: logId },
      data:  { status: 'FAILED', errorMessage },
    }).catch(e => this.logger.warn(`Could not fail log ${logId}: ${e.message}`));
  }

  private interpolate(template: string, variables: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? `{{${key}}}`);
  }
}
