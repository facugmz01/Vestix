import { Controller, Get, Query } from '@nestjs/common';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';

@Controller('suppliers')
export class SuppliersController {
  
  @Get()
  @RequirePermissions({ action: 'read', subject: 'Purchasing' })
  getSuppliers(@Query('page') page: string, @Query('pageSize') pageSize: string) {
    return { data: [], total: 0 };
  }
}
