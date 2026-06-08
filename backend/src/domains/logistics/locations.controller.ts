import { Controller, Get, Query } from '@nestjs/common';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';

@Controller('locations')
export class LocationsController {
  
  @Get()
  @RequirePermissions({ action: 'read', subject: 'Inventory' })
  getLocations(@Query('page') page: string, @Query('pageSize') pageSize: string) {
    return { data: [], total: 0 };
  }
}
