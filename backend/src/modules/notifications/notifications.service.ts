import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  NotificationJob,
  NotificationChannel,
  NotificationStatus,
  TemplateKey,
} from './models/notification.model';
import { NOTIFICATION_TEMPLATES } from './templates/notification-templates.registry';
import { SmtpService } from './channels/smtp.service';
import { WhatsAppEvolutionService } from './channels/whatsapp-evolution.service';
import * as crypto from 'crypto';

const MAX_ATTEMPTS = 3;

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  // In-memory queue. In production, replace with BullMQ + Redis for persistence and retries.
  private queue: NotificationJob[] = [];

  constructor(
    private readonly smtpService: SmtpService,
    private readonly whatsAppService: WhatsAppEvolutionService,
  ) {}

  /**
   * PUBLIC API — called from any other module (Sales, Inventory, Finance).
   * Enqueues a notification job; actual dispatch is async.
   */
  async enqueue(payload: {
    channel: NotificationChannel;
    templateKey: TemplateKey;
    recipient: string;
    variables: Record<string, string>;
  }) {
    const job: NotificationJob = {
      id: crypto.randomUUID(),
      channel: payload.channel,
      templateKey: payload.templateKey,
      recipient: payload.recipient,
      variables: payload.variables || {},
      status: NotificationStatus.QUEUED,
      attempts: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.queue.push(job);
    this.logger.log(`[Queue] Enqueued ${payload.channel} notification (${payload.templateKey}) → ${payload.recipient}`);

    // Fire-and-forget: dispatch immediately without blocking the caller
    setImmediate(() => this.dispatch(job.id));

    return job;
  }

  /**
   * DISPATCH ENGINE — resolves template, interpolates variables, routes to correct channel.
   */
  async dispatch(jobId: string) {
    const job = this.queue.find(j => j.id === jobId);
    if (!job) throw new NotFoundException('Notification job not found');

    // Find matching template for channel
    const template = NOTIFICATION_TEMPLATES.find(
      t => t.key === job.templateKey && t.channel === job.channel,
    );
    if (!template) {
      job.status = NotificationStatus.FAILED;
      job.lastError = `No template found for key=${job.templateKey}, channel=${job.channel}`;
      job.updatedAt = new Date();
      this.logger.error(`[Dispatch] ${job.lastError}`);
      return;
    }

    // Interpolate template variables safely
    const vars = job.variables || {};
    const body = this.interpolate(template.body, vars);
    const subject = template.subject ? this.interpolate(template.subject, vars) : undefined;

    job.status = NotificationStatus.SENDING;
    job.attempts += 1;
    job.updatedAt = new Date();

    try {
      if (job.channel === NotificationChannel.EMAIL) {
        await this.smtpService.send(job.recipient, subject!, body);
      } else if (job.channel === NotificationChannel.WHATSAPP) {
        await this.whatsAppService.sendText(job.recipient, body);
      }

      job.status = NotificationStatus.SENT;
      job.updatedAt = new Date();
      this.logger.log(`[Dispatch] ✓ Sent ${job.channel} job ${job.id}`);
    } catch (err: any) {
      job.lastError = err.message;
      job.updatedAt = new Date();

      if (job.attempts < MAX_ATTEMPTS) {
        // Exponential backoff: 5s, 25s, 125s
        const delayMs = Math.pow(5, job.attempts) * 1000;
        job.status = NotificationStatus.RETRYING;
        this.logger.warn(`[Retry] Job ${job.id} failed (attempt ${job.attempts}). Retrying in ${delayMs}ms...`);
        setTimeout(() => this.dispatch(jobId), delayMs);
      } else {
        job.status = NotificationStatus.FAILED;
        this.logger.error(`[Dispatch] ✗ Job ${job.id} permanently FAILED after ${MAX_ATTEMPTS} attempts.`);
      }
    }
  }

  /**
   * Returns the entire in-memory queue of notification jobs.
   * Useful for administrative UI and API monitoring.
   */
  getQueue(): NotificationJob[] {
    return this.queue;
  }

  // --- CONVENIENCE HELPERS (used across the ERP) ---

  async notifyOrderConfirmed(recipient: string, channel: NotificationChannel, vars: { customerName: string; orderId: string; total: string }) {
    return this.enqueue({ channel, templateKey: TemplateKey.ORDER_CONFIRMED, recipient, variables: vars });
  }

  async notifyOrderShipped(recipient: string, channel: NotificationChannel, vars: { customerName: string; orderId: string; courierName: string; trackingNumber: string }) {
    return this.enqueue({ channel, templateKey: TemplateKey.ORDER_SHIPPED, recipient, variables: vars });
  }

  async notifyLowStock(managerEmail: string, vars: { productName: string; sku: string; quantity: string; branchName: string }) {
    return this.enqueue({ channel: NotificationChannel.EMAIL, templateKey: TemplateKey.LOW_STOCK_ALERT, recipient: managerEmail, variables: vars });
  }

  async notifyShiftDiscrepancy(managerEmail: string, vars: { branchName: string; cashierName: string; registerName: string; difference: string; expected: string; actual: string }) {
    return this.enqueue({ channel: NotificationChannel.EMAIL, templateKey: TemplateKey.SHIFT_CLOSING_DISCREPANCY, recipient: managerEmail, variables: vars });
  }

  // --- INTERNAL UTILITY ---
  private interpolate(template: string, variables: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? `{{${key}}}`);
  }
}
