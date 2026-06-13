import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  NotificationJob,
  NotificationChannel,
  NotificationStatus,
  TemplateKey,
} from './models/notification.model';
import { PrismaService } from '../../core/prisma/prisma.service';
import { NOTIFICATION_TEMPLATES } from './templates/notification-templates.registry';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectQueue('notifications_queue') private readonly notificationsQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    // Seed default templates if the table is empty
    const count = await this.prisma.notificationTemplate.count();
    if (count === 0) {
      this.logger.log('Seeding initial notification templates...');
      for (const tpl of NOTIFICATION_TEMPLATES) {
        await this.prisma.notificationTemplate.upsert({
          where: {
            event_channel: {
              event: tpl.key,
              channel: tpl.channel,
            }
          },
          update: {},
          create: {
            name: `Plantilla ${tpl.key} (${tpl.channel})`,
            event: tpl.key,
            channel: tpl.channel,
            subject: tpl.subject,
            body: tpl.body,
            isActive: true,
          }
        });
      }
      this.logger.log('Notification templates seeded successfully.');
    }
  }

  // --- TEMPLATE CRUD ---

  async getTemplates(page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;
    const [data, total] = await Promise.all([
      this.prisma.notificationTemplate.findMany({ skip, take: pageSize }),
      this.prisma.notificationTemplate.count(),
    ]);
    return { data, total };
  }

  async createTemplate(data: any) {
    return this.prisma.notificationTemplate.create({ data });
  }

  async updateTemplate(id: string, data: any) {
    return this.prisma.notificationTemplate.update({ where: { id }, data });
  }

  /**
   * PUBLIC API — called from any other module (Sales, Inventory, Finance).
   * Enqueues a notification job in BullMQ; actual dispatch is async by the processor.
   */
  async enqueue(payload: {
    channel: NotificationChannel;
    templateKey: TemplateKey;
    recipient: string;
    variables: Record<string, string>;
  }): Promise<NotificationJob | null> {
    // First, check if the template is active in the database
    const template = await this.prisma.notificationTemplate.findUnique({
      where: {
        event_channel: {
          event: payload.templateKey,
          channel: payload.channel,
        }
      }
    });

    if (!template) {
      this.logger.warn(`No template found for ${payload.templateKey} on ${payload.channel}. Skipping notification.`);
      return null; // Silent skip if no template exists
    }

    if (!template.isActive) {
      this.logger.log(`Template ${payload.templateKey} on ${payload.channel} is inactive. Skipping notification.`);
      return null;
    }

    const job = await this.notificationsQueue.add('send_notification', {
      channel: payload.channel,
      templateKey: payload.templateKey,
      recipient: payload.recipient,
      variables: payload.variables || {},
    });

    this.logger.log(
      `[Queue] Enqueued ${payload.channel} notification (${payload.templateKey}) → ${payload.recipient} via BullMQ (Job ID: ${job.id})`
    );

    return {
      id: job.id || '',
      channel: payload.channel,
      templateKey: payload.templateKey,
      recipient: payload.recipient,
      variables: payload.variables || {},
      status: NotificationStatus.QUEUED,
      attempts: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Returns the entire queue of notification jobs from Redis.
   * Useful for administrative UI and API monitoring.
   */
  async getQueue(): Promise<NotificationJob[]> {
    const jobs = await this.notificationsQueue.getJobs([
      'active',
      'waiting',
      'completed',
      'failed',
      'delayed',
      'paused',
    ]);
    
    // Sort chronologically (most recent first)
    const sortedJobs = jobs.sort((a, b) => b.timestamp - a.timestamp);

    return sortedJobs.map(job => {
      let status = NotificationStatus.QUEUED;
      if (job.failedReason) {
        status = NotificationStatus.FAILED;
      } else if (job.finishedOn) {
        status = NotificationStatus.SENT;
      } else if (job.processedOn) {
        status = NotificationStatus.SENDING;
      }

      return {
        id: job.id || '',
        channel: job.data.channel,
        templateKey: job.data.templateKey,
        recipient: job.data.recipient,
        variables: job.data.variables,
        status,
        attempts: job.attemptsMade,
        lastError: job.failedReason || undefined,
        createdAt: new Date(job.timestamp),
        updatedAt: new Date(job.finishedOn || job.processedOn || job.timestamp),
      };
    });
  }

  // --- CONVENIENCE HELPERS (used across the ERP) ---

  async notifyOrderConfirmed(
    recipient: string,
    channel: NotificationChannel,
    vars: { customerName: string; orderId: string; total: string }
  ) {
    return this.enqueue({ channel, templateKey: TemplateKey.ORDER_CONFIRMED, recipient, variables: vars });
  }

  async notifyOrderShipped(
    recipient: string,
    channel: NotificationChannel,
    vars: { customerName: string; orderId: string; courierName: string; trackingNumber: string }
  ) {
    return this.enqueue({ channel, templateKey: TemplateKey.ORDER_SHIPPED, recipient, variables: vars });
  }

  async notifyLowStock(
    managerEmail: string,
    vars: { productName: string; sku: string; quantity: string; branchName: string }
  ) {
    return this.enqueue({ channel: NotificationChannel.EMAIL, templateKey: TemplateKey.LOW_STOCK_ALERT, recipient: managerEmail, variables: vars });
  }

  async notifyShiftDiscrepancy(
    managerEmail: string,
    vars: { branchName: string; cashierName: string; registerName: string; difference: string; expected: string; actual: string }
  ) {
    return this.enqueue({ channel: NotificationChannel.EMAIL, templateKey: TemplateKey.SHIFT_CLOSING_DISCREPANCY, recipient: managerEmail, variables: vars });
  }
}
