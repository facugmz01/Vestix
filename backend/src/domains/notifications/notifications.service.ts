import { Injectable, Logger, NotFoundException, OnModuleInit, BadRequestException } from '@nestjs/common';
import { SettingsService } from '../../modules/settings/settings.service';
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
import {
  TEMPLATE_VARIABLES,
  interpolateTemplate,
} from './templates/template-variables.registry';

// ─── Filter DTOs ────────────────────────────────────────────────────────────

export interface GetTemplatesFilters {
  page?: number;
  pageSize?: number;
  channel?: string;
  isActive?: boolean;
}

export interface GetLogsFilters {
  page?: number;
  pageSize?: number;
  status?: string;
  channel?: string;
  event?: string;
  search?: string;
}

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectQueue('notifications_queue') private readonly notificationsQueue: Queue,
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
  ) {}

  private async isChannelEnabled(channel: NotificationChannel): Promise<boolean> {
    const settings = await this.settingsService.getNotificationSettings();
    switch (channel) {
      case NotificationChannel.EMAIL:    return settings.emailEnabled !== false;
      case NotificationChannel.WHATSAPP: return settings.whatsappEnabled !== false;
      case NotificationChannel.SMS:      return settings.smsEnabled !== false;
      case NotificationChannel.PUSH:     return settings.pushEnabled === true;
      default:                           return true;
    }
  }

  async onModuleInit() {
    const count = await this.prisma.notificationTemplate.count();
    if (count === 0) {
      this.logger.log('Seeding initial notification templates...');
    } else {
      this.logger.log('Ensuring notification templates are up to date...');
    }

    for (const tpl of NOTIFICATION_TEMPLATES) {
      await this.prisma.notificationTemplate.upsert({
        where: { event_channel: { event: tpl.key, channel: tpl.channel } },
        update: {},
        create: {
          name: `Plantilla ${tpl.key} (${tpl.channel})`,
          event: tpl.key,
          channel: tpl.channel,
          subject: tpl.subject,
          body: tpl.body,
          isActive: true,
        },
      });
    }

    if (count === 0) {
      this.logger.log('Notification templates seeded successfully.');
    }
  }

  // ─── TEMPLATE CRUD ─────────────────────────────────────────────────────────

  async getTemplates(filters: GetTemplatesFilters = {}) {
    const { page = 1, pageSize = 10, channel, isActive } = filters;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (channel)              where.channel  = channel;
    if (isActive !== undefined) where.isActive = isActive;

    const [data, total] = await Promise.all([
      this.prisma.notificationTemplate.findMany({
        where, skip, take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notificationTemplate.count({ where }),
    ]);
    return { data, total, page, pageSize };
  }

  async getTemplate(id: string) {
    const tpl = await this.prisma.notificationTemplate.findUnique({ where: { id } });
    if (!tpl) throw new NotFoundException(`Template ${id} not found`);
    return tpl;
  }

  async createTemplate(data: any) {
    return this.prisma.notificationTemplate.create({ data });
  }

  async updateTemplate(id: string, data: any) {
    const existing = await this.prisma.notificationTemplate.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Template ${id} not found`);
    return this.prisma.notificationTemplate.update({ where: { id }, data });
  }

  async toggleTemplate(id: string, isActive: boolean) {
    const existing = await this.prisma.notificationTemplate.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Template ${id} not found`);
    return this.prisma.notificationTemplate.update({ where: { id }, data: { isActive } });
  }

  // ─── LOGS ──────────────────────────────────────────────────────────────────

  async getLogs(filters: GetLogsFilters = {}) {
    const { page = 1, pageSize = 15, status, channel, event, search } = filters;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (status)  where.status  = status;
    if (channel) where.channel = channel;
    if (event)   where.event   = event;
    if (search) {
      where.recipient = { contains: search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.notificationLog.findMany({
        where, skip, take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notificationLog.count({ where }),
    ]);
    return { data, total, page, pageSize };
  }

  async getStats() {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [byStatus, byChannel, last24h, failedRecent, activeTemplates, totalTemplates] =
      await Promise.all([
        this.prisma.notificationLog.groupBy({
          by: ['status'],
          _count: { _all: true },
        }),
        this.prisma.notificationLog.groupBy({
          by: ['channel'],
          _count: { _all: true },
        }),
        this.prisma.notificationLog.count({ where: { createdAt: { gte: since24h } } }),
        this.prisma.notificationLog.findMany({
          where: { status: 'FAILED' },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true, event: true, channel: true, recipient: true,
            errorMessage: true, createdAt: true,
          },
        }),
        this.prisma.notificationTemplate.count({ where: { isActive: true } }),
        this.prisma.notificationTemplate.count(),
      ]);

    const statusCounts = Object.fromEntries(
      byStatus.map(r => [r.status, r._count._all]),
    );
    const channelCounts = Object.fromEntries(
      byChannel.map(r => [r.channel, r._count._all]),
    );

    const queue = await this.getQueue();
    const queuePending = queue.filter(j =>
      ['QUEUED', 'SENDING', 'RETRYING'].includes(j.status),
    ).length;

    return {
      totals: {
        sent:     statusCounts.SENT ?? 0,
        delivered: statusCounts.DELIVERED ?? 0,
        failed:   statusCounts.FAILED ?? 0,
        pending:  statusCounts.PENDING ?? 0,
        bounced:  statusCounts.BOUNCED ?? 0,
        last24h,
      },
      byChannel: channelCounts,
      queuePending,
      templates: { active: activeTemplates, total: totalTemplates },
      recentFailures: failedRecent,
    };
  }

  getTemplateVariables() {
    return TEMPLATE_VARIABLES;
  }

  async previewTemplate(payload: {
    event: string;
    channel: string;
    body: string;
    subject?: string;
    variables?: Record<string, string>;
  }) {
    const vars = payload.variables ?? {};
    return {
      subject: payload.subject
        ? interpolateTemplate(payload.subject, vars)
        : undefined,
      body: interpolateTemplate(payload.body, vars),
    };
  }

  async retryLog(logId: string) {
    const log = await this.prisma.notificationLog.findUnique({ where: { id: logId } });
    if (!log) throw new NotFoundException(`Log ${logId} not found`);
    if (log.status !== 'FAILED') {
      throw new BadRequestException('Solo se pueden reintentar notificaciones fallidas');
    }

    const variables = (log.variables as Record<string, string>) ?? {};
    const job = await this.enqueue({
      channel:     log.channel as NotificationChannel,
      templateKey: log.event as TemplateKey,
      recipient:   log.recipient,
      variables,
      referenceId: log.referenceId ?? undefined,
    });

    if (!job) {
      throw new BadRequestException(
        'No se pudo reencolar. Verificá que el canal y la plantilla estén activos.',
      );
    }

    return { success: true, message: 'Notificación reencolada', job };
  }

  /**
   * Marks the most recent SENT WhatsApp log for a phone as DELIVERED.
   * Called from Evolution API webhook callbacks.
   */
  async markWhatsAppDelivered(phone: string) {
    const normalized = phone.replace(/\D/g, '');
    const log = await this.prisma.notificationLog.findFirst({
      where: {
        channel: 'WHATSAPP',
        status: 'SENT',
        OR: [
          { recipient: normalized },
          { recipient: { endsWith: normalized.slice(-10) } },
        ],
      },
      orderBy: { sentAt: 'desc' },
    });

    if (!log) {
      return { updated: false, message: 'No matching SENT log found' };
    }

    await this.prisma.notificationLog.update({
      where: { id: log.id },
      data: { status: 'DELIVERED' },
    });

    return { updated: true, logId: log.id };
  }

  // ─── QUEUE / ENQUEUE ───────────────────────────────────────────────────────

  /**
   * PUBLIC API — called from any other module (Sales, Inventory, Finance).
   * Enqueues a notification job in BullMQ; actual dispatch is async via the processor.
   * Also creates a PENDING NotificationLog entry for tracking.
   */
  async enqueue(payload: {
    channel: NotificationChannel;
    templateKey: TemplateKey;
    recipient: string;
    variables: Record<string, string>;
    referenceId?: string;
  }): Promise<NotificationJob | null> {
    // Check if active template exists
    const template = await this.prisma.notificationTemplate.findUnique({
      where: {
        event_channel: {
          event: payload.templateKey,
          channel: payload.channel,
        },
      },
    });

    if (!template) {
      this.logger.warn(
        `No template found for ${payload.templateKey} on ${payload.channel}. Skipping.`,
      );
      return null;
    }

    if (!template.isActive) {
      this.logger.log(
        `Template ${payload.templateKey} on ${payload.channel} is inactive. Skipping.`,
      );
      return null;
    }

    if (!(await this.isChannelEnabled(payload.channel))) {
      this.logger.log(
        `Channel ${payload.channel} is disabled in settings. Skipping ${payload.templateKey}.`,
      );
      return null;
    }

    // Create a PENDING log entry before pushing to queue
    const log = await this.prisma.notificationLog.create({
      data: {
        templateId:  template.id,
        event:       payload.templateKey,
        channel:     payload.channel,
        recipient:   payload.recipient,
        referenceId: payload.referenceId ?? null,
        variables:   payload.variables ?? {},
        status:      'PENDING',
      },
    });

    const job = await this.notificationsQueue.add('send_notification', {
      channel:     payload.channel,
      templateKey: payload.templateKey,
      recipient:   payload.recipient,
      variables:   payload.variables ?? {},
      logId:       log.id,   // pass log ID so the processor can update status
    });

    this.logger.log(
      `[Queue] Enqueued ${payload.channel}/${payload.templateKey} → ${payload.recipient} (Job: ${job.id}, Log: ${log.id})`,
    );

    return {
      id:          job.id || '',
      channel:     payload.channel,
      templateKey: payload.templateKey,
      recipient:   payload.recipient,
      variables:   payload.variables ?? {},
      status:      NotificationStatus.QUEUED,
      attempts:    0,
      createdAt:   new Date(),
      updatedAt:   new Date(),
    };
  }

  /**
   * Returns BullMQ queue jobs for the admin monitoring view.
   */
  async getQueue(): Promise<NotificationJob[]> {
    const jobs = await this.notificationsQueue.getJobs([
      'active', 'waiting', 'completed', 'failed', 'delayed', 'paused',
    ]);

    const sorted = jobs.sort((a, b) => b.timestamp - a.timestamp);

    return sorted.map(job => {
      let status = NotificationStatus.QUEUED;
      if (job.failedReason)  status = NotificationStatus.FAILED;
      else if (job.finishedOn)  status = NotificationStatus.SENT;
      else if (job.processedOn) status = NotificationStatus.SENDING;

      return {
        id:          job.id || '',
        channel:     job.data.channel,
        templateKey: job.data.templateKey,
        recipient:   job.data.recipient,
        variables:   job.data.variables,
        status,
        attempts:    job.attemptsMade,
        lastError:   job.failedReason || undefined,
        createdAt:   new Date(job.timestamp),
        updatedAt:   new Date(job.finishedOn || job.processedOn || job.timestamp),
      };
    });
  }

  // ─── CONVENIENCE HELPERS ──────────────────────────────────────────────────

  async notifyOrderConfirmed(
    recipient: string,
    channel: NotificationChannel,
    vars: { customerName: string; orderId: string; total: string },
    referenceId?: string,
  ) {
    return this.enqueue({
      channel,
      templateKey: TemplateKey.SALE_CONFIRMED,
      recipient,
      variables: vars,
      referenceId,
    });
  }

  async notifyOrderShipped(
    recipient: string,
    channel: NotificationChannel,
    vars: { customerName: string; orderId: string; courierName: string; trackingNumber: string; trackingUrl?: string },
    referenceId?: string,
  ) {
    return this.enqueue({
      channel,
      templateKey: TemplateKey.ORDER_SHIPPED,
      recipient,
      variables: vars,
      referenceId,
    });
  }

  async notifyLowStock(
    managerEmail: string,
    vars: { productName: string; sku: string; quantity: string; branchName: string },
  ) {
    return this.enqueue({
      channel:     NotificationChannel.EMAIL,
      templateKey: TemplateKey.LOW_STOCK_ALERT,
      recipient:   managerEmail,
      variables:   vars,
    });
  }

  async notifyShiftDiscrepancy(
    managerEmail: string,
    vars: {
      branchName: string; cashierName: string; registerName: string;
      difference: string; expected: string; actual: string;
    },
  ) {
    return this.enqueue({
      channel:     NotificationChannel.EMAIL,
      templateKey: TemplateKey.SHIFT_CLOSING_DISCREPANCY,
      recipient:   managerEmail,
      variables:   vars,
    });
  }
}
