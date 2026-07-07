import {
  Controller, Get, Post, Body, Query, Param,
  Patch, ParseBoolPipe, ParseIntPipe,
  DefaultValuePipe, Optional,
} from '@nestjs/common';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';
import { NotificationsService } from './notifications.service';
import { WhatsAppEvolutionService } from './channels/whatsapp-evolution.service';
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
}
