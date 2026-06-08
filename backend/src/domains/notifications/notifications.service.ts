import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  NotificationJob,
  NotificationChannel,
  NotificationStatus,
  TemplateKey,
} from './models/notification.model';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectQueue('notifications_queue') private readonly notificationsQueue: Queue,
  ) {}

  /**
   * PUBLIC API — called from any other module (Sales, Inventory, Finance).
   * Enqueues a notification job in BullMQ; actual dispatch is async by the processor.
   */
  async enqueue(payload: {
    channel: NotificationChannel;
    templateKey: TemplateKey;
    recipient: string;
    variables: Record<string, string>;
  }): Promise<NotificationJob> {
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
