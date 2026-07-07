import {
  Controller, Get, Post, Body, Query, Param,
  Patch, ParseIntPipe, DefaultValuePipe, Req, Headers, HttpCode, HttpStatus, UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';
import { NotificationsService } from './notifications.service';
import { WhatsAppEvolutionService } from './channels/whatsapp-evolution.service';
import { StaffInboxService } from './staff-inbox.service';
import { NotificationChannel, TemplateKey } from './models/notification.model';
import {
  IsEnum, IsString, IsNotEmpty, IsObject,
  IsOptional, IsBoolean,
} from 'class-validator';

// ─── DTOs ────────────────────────────────────────────────────────────────────

export class CreateTemplateDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() event: string;
  @IsString() @IsNotEmpty() channel: string;
  @IsString() @IsOptional() subject?: string;
  @IsString() @IsNotEmpty() body: string;
  @IsBoolean() @IsOptional() isActive?: boolean;
}

export class UpdateTemplateDto {
  @IsString() @IsOptional() name?: string;
  @IsString() @IsOptional() subject?: string;
  @IsString() @IsOptional() body?: string;
  @IsBoolean() @IsOptional() isActive?: boolean;
}

export class ToggleTemplateDto {
  @IsBoolean() isActive: boolean;
}

export class SendTestNotificationDto {
  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @IsString()
  @IsNotEmpty()
  templateKey: string;

  @IsString()
  @IsNotEmpty()
  recipient: string;

  @IsObject()
  @IsOptional()
  variables?: Record<string, string>;
}

export class PreviewTemplateDto {
  @IsString() @IsNotEmpty() event: string;
  @IsString() @IsNotEmpty() channel: string;
  @IsString() @IsNotEmpty() body: string;
  @IsString() @IsOptional() subject?: string;
  @IsObject() @IsOptional() variables?: Record<string, string>;
}

// ─── Controller ──────────────────────────────────────────────────────────────

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly whatsappService: WhatsAppEvolutionService,
    private readonly staffInbox: StaffInboxService,
  ) {}

  // ── Templates ──────────────────────────────────────────────────────────────

  /**
   * GET /notifications/templates
   * Returns paginated list of templates with optional filters.
   */
  @Get('templates')
  @RequirePermissions({ action: 'read', subject: 'Settings' })
  async getTemplates(
    @Query('page',     new DefaultValuePipe(1),  ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize: number,
    @Query('channel')  channel?: string,
    @Query('isActive') isActiveRaw?: string,
  ) {
    const isActive = isActiveRaw === 'true'  ? true
                   : isActiveRaw === 'false' ? false
                   : undefined;
    return this.notificationsService.getTemplates({ page, pageSize, channel, isActive });
  }

  /**
   * GET /notifications/templates/:id
   * Returns a single template for editing.
   */
  @Get('templates/:id')
  @RequirePermissions({ action: 'read', subject: 'Settings' })
  async getTemplate(@Param('id') id: string) {
    return this.notificationsService.getTemplate(id);
  }

  /**
   * POST /notifications/templates
   */
  @Post('templates')
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  async createTemplate(@Body() data: CreateTemplateDto) {
    return this.notificationsService.createTemplate(data);
  }

  /**
   * PATCH /notifications/templates/:id
   * Updates name/subject/body of a template.
   */
  @Patch('templates/:id')
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  async updateTemplate(@Param('id') id: string, @Body() data: UpdateTemplateDto) {
    return this.notificationsService.updateTemplate(id, data);
  }

  /**
   * PATCH /notifications/templates/:id/toggle
   * Activates or deactivates a template.
   */
  @Patch('templates/:id/toggle')
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  async toggleTemplate(@Param('id') id: string, @Body() dto: ToggleTemplateDto) {
    return this.notificationsService.toggleTemplate(id, dto.isActive);
  }

  // ── Logs ───────────────────────────────────────────────────────────────────

  @Get('logs')
  @RequirePermissions({ action: 'read', subject: 'Settings' })
  async getLogs(
    @Query('page',     new DefaultValuePipe(1),  ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(15), ParseIntPipe) pageSize: number,
    @Query('status')   status?: string,
    @Query('channel')  channel?: string,
    @Query('event')    event?: string,
    @Query('search')   search?: string,
  ) {
    return this.notificationsService.getLogs({ page, pageSize, status, channel, event, search });
  }

  @Get('stats')
  @RequirePermissions({ action: 'read', subject: 'Settings' })
  getStats() {
    return this.notificationsService.getStats();
  }

  @Get('template-variables')
  @RequirePermissions({ action: 'read', subject: 'Settings' })
  getTemplateVariables() {
    return this.notificationsService.getTemplateVariables();
  }

  @Post('preview')
  @RequirePermissions({ action: 'read', subject: 'Settings' })
  previewTemplate(@Body() body: PreviewTemplateDto) {
    return this.notificationsService.previewTemplate(body);
  }

  @Post('logs/:id/retry')
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  retryLog(@Param('id') id: string) {
    return this.notificationsService.retryLog(id);
  }

  // ── Queue (BullMQ) ─────────────────────────────────────────────────────────

  /**
   * GET /notifications/queue
   * Returns the in-memory BullMQ queue state (admin monitoring).
   */
  @Get('queue')
  @RequirePermissions({ action: 'read', subject: 'Settings' })
  async getQueue() {
    const queue = await this.notificationsService.getQueue();
    return { data: queue, total: queue.length };
  }

  // ── Test dispatch ──────────────────────────────────────────────────────────

  /**
   * POST /notifications/test
   * Manually dispatches a test notification via the queue.
   */
  @Post('test')
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  async sendTest(@Body() body: SendTestNotificationDto) {
    const job = await this.notificationsService.enqueue({
      channel:     body.channel,
      templateKey: body.templateKey as TemplateKey,
      recipient:   body.recipient,
      variables:   body.variables ?? {},
    });

    return {
      success: true,
      message: `Test notification enqueued. Job ID: ${job?.id ?? 'skipped'}`,
      job,
    };
  }

  // ── WhatsApp ───────────────────────────────────────────────────────────────

  /**
   * GET /notifications/whatsapp/status
   * Returns the Evolution API connection state.
   */
  @Get('whatsapp/status')
  @RequirePermissions({ action: 'manage', subject: 'Integrations' })
  getWhatsAppStatus() {
    return this.whatsappService.getStatus();
  }

  /**
   * POST /notifications/whatsapp/webhook
   * Evolution API delivery callbacks — marks recent SENT logs as DELIVERED.
   */
  @Post('whatsapp/webhook')
  @HttpCode(HttpStatus.OK)
  async whatsAppWebhook(
    @Body() body: any,
    @Headers('apikey') apiKey?: string,
  ) {
    const secret = process.env.EVOLUTION_WEBHOOK_SECRET;
    if (secret && apiKey !== secret) {
      throw new UnauthorizedException('Invalid webhook secret');
    }

    const phone = this.extractPhoneFromWebhook(body);
    const isDelivered = this.isDeliveryEvent(body);

    if (phone && isDelivered) {
      return this.notificationsService.markWhatsAppDelivered(phone);
    }

    return { received: true, updated: false };
  }

  // ── Staff inbox ────────────────────────────────────────────────────────────

  @Get('inbox')
  @RequirePermissions({ action: 'read', subject: 'Settings' })
  getInbox(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    return this.staffInbox.findAll({
      page,
      pageSize,
      unreadOnly: unreadOnly === 'true',
    });
  }

  @Patch('inbox/:id/read')
  @RequirePermissions({ action: 'read', subject: 'Settings' })
  markInboxRead(@Param('id') id: string) {
    return this.staffInbox.markRead(id);
  }

  @Post('inbox/read-all')
  @RequirePermissions({ action: 'read', subject: 'Settings' })
  markAllInboxRead() {
    return this.staffInbox.markAllRead();
  }

  private extractPhoneFromWebhook(body: any): string | null {
    const candidates = [
      body?.recipient,
      body?.number,
      body?.data?.key?.remoteJid,
      body?.data?.remoteJid,
    ];
    for (const raw of candidates) {
      if (!raw || typeof raw !== 'string') continue;
      const digits = raw.replace(/\D/g, '');
      if (digits.length >= 8) return digits;
    }
    return null;
  }

  private isDeliveryEvent(body: any): boolean {
    const status = (
      body?.status ||
      body?.data?.status ||
      body?.data?.update?.status ||
      body?.ack ||
      ''
    ).toString().toUpperCase();

    const event = (body?.event || '').toString().toLowerCase();

    return (
      status.includes('DELIVER') ||
      status === 'READ' ||
      status === '4' ||
      event.includes('messages.update') ||
      event.includes('delivery')
    );
  }
}
