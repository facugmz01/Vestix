import { Controller, Get, Query } from '@nestjs/common';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';

@Controller('cash-registers')
export class CashRegistersController {
  
  @Get()
  @RequirePermissions({ action: 'read', subject: 'Sales' })
  getCashRegisters(@Query('page') page: string, @Query('pageSize') pageSize: string) {
    return { data: [], total: 0 };
  }
}
