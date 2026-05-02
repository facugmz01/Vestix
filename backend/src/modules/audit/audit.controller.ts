import { Controller, Get, Query } from '@nestjs/common';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';

@Controller('audit')
export class AuditController {
  
  @Get('logs')
  @RequirePermissions({ action: 'read', subject: 'System' })
  getLogs(@Query('page') page: string, @Query('pageSize') pageSize: string) {
    return { data: [], total: 0 };
  }
}
