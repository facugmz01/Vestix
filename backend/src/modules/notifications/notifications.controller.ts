import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';
import { NotificationsService } from './notifications.service';
import { NOTIFICATION_TEMPLATES } from './templates/notification-templates.registry';
import { NotificationChannel, TemplateKey } from './models/notification.model';
import { IsEnum, IsString, IsNotEmpty, IsObject, IsOptional } from 'class-validator';

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
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Returns a list of all registered notification templates in the ERP catalog.
   */
  @Get('templates')
  @RequirePermissions({ action: 'read', subject: 'Notifications' })
  getTemplates(@Query('page') page: string, @Query('pageSize') pageSize: string) {
    return {
      data: NOTIFICATION_TEMPLATES,
      total: NOTIFICATION_TEMPLATES.length,
    };
  }

  /**
   * Returns the list of active/completed/failed notification jobs in the queue.
   */
  @Get('queue')
  @RequirePermissions({ action: 'read', subject: 'Notifications' })
  getQueue() {
    const queue = this.notificationsService.getQueue();
    return {
      data: queue,
      total: queue.length,
    };
  }

  /**
   * Dispatches a manual test notification to a recipient using a specified channel and template.
   */
  @Post('test')
  @RequirePermissions({ action: 'manage', subject: 'Notifications' })
  async sendTest(@Body() body: SendTestNotificationDto) {
    const job = await this.notificationsService.enqueue({
      channel: body.channel,
      templateKey: body.templateKey,
      recipient: body.recipient,
      variables: body.variables || {},
    });

    return {
      success: true,
      message: `Test notification enqueued in the system. Job ID: ${job.id}`,
      job,
    };
  }
}
