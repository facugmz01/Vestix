import { Controller, Get, Query } from '@nestjs/common';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../core/rbac/guards/permissions.guard';
import { AuthGuard } from '@nestjs/passport';
import { UseGuards } from '@nestjs/common';

@Controller('locations')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class LocationsController {
  
  @Get()
  @RequirePermissions({ action: 'read', subject: 'Inventory' })
  getLocations(@Query('page') page: string, @Query('pageSize') pageSize: string) {
    return { data: [], total: 0 };
  }
}
