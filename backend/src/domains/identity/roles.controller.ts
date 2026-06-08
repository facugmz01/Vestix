import { Controller, Get, Query } from '@nestjs/common';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';

@Controller('roles')
export class RolesController {
  
  @Get()
  @RequirePermissions({ action: 'read', subject: 'System' })
  getRoles(@Query('page') page: string, @Query('pageSize') pageSize: string) {
    return { data: [], total: 0 };
  }
}
