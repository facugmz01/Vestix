import { Controller, Get, Query } from '@nestjs/common';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';

@Controller('notifications')
export class NotificationsController {
  
  @Get('templates')
  @RequirePermissions({ action: 'read', subject: 'Notifications' })
  getTemplates(@Query('page') page: string, @Query('pageSize') pageSize: string) {
    return { data: [], total: 0 };
  }
}
