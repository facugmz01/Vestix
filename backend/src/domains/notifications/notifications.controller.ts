import { Controller, Get, Post, Body, Query, Param, Patch } from '@nestjs/common';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';
import { NotificationsService } from './notifications.service';
import { WhatsAppEvolutionService } from './channels/whatsapp-evolution.service';
import { NOTIFICATION_TEMPLATES } from './templates/notification-templates.registry';
import { NotificationChannel, TemplateKey } from './models/notification.model';
import { IsEnum, IsString, IsNotEmpty, IsObject, IsOptional, IsBoolean } from 'class-validator';

export class CreateTemplateDto {
  @IsString() @IsNotEmpty() name: string;
  @IsEnum(TemplateKey) event: TemplateKey;
  @IsEnum(NotificationChannel) channel: NotificationChannel;
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

export class SendTestNotificationDto {
  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @IsEnum(TemplateKey)
  templateKey: TemplateKey;

  @IsString()
  @IsNotEmpty()
  recipient: string;

  @IsObject()
  @IsOptional()
  variables?: Record<string, string>;
}

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly whatsappService: WhatsAppEvolutionService
  ) {}

  /**
   * Returns a list of all registered notification templates in the ERP catalog.
   */
  @Get('templates')
  @RequirePermissions({ action: 'read', subject: 'Settings' })
  async getTemplates(@Query('page') page: string, @Query('pageSize') pageSize: string) {
    const p = parseInt(page) || 1;
    const ps = parseInt(pageSize) || 10;
    const { data, total } = await this.notificationsService.getTemplates(p, ps);
    return { data, total };
  }

  @Post('templates')
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  async createTemplate(@Body() data: CreateTemplateDto) {
    return this.notificationsService.createTemplate(data);
  }

  @Patch('templates/:id')
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  async updateTemplate(@Param('id') id: string, @Body() data: UpdateTemplateDto) {
    return this.notificationsService.updateTemplate(id, data);
  }

  /**
   * Returns the list of active/completed/failed notification jobs in the queue.
   */
  @Get('queue')
  @RequirePermissions({ action: 'read', subject: 'Settings' })
  async getQueue() {
    const queue = await this.notificationsService.getQueue();
    return {
      data: queue,
      total: queue.length,
    };
  }

  /**
   * Dispatches a manual test notification to a recipient using a specified channel and template.
   */
  @Post('test')
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  async sendTest(@Body() body: SendTestNotificationDto) {
    const job = await this.notificationsService.enqueue({
      channel: body.channel,
      templateKey: body.templateKey,
      recipient: body.recipient,
      variables: body.variables || {},
    });

    return {
      success: true,
      message: `Test notification enqueued in the system. Job ID: ${job?.id || 'skipped'}`,
      job,
    };
  }

  @Get('whatsapp/status')
  @RequirePermissions({ action: 'manage', subject: 'Integrations' })
  getWhatsAppStatus() {
    return this.whatsappService.getStatus();
  }
}
