import { Controller, Get, Query } from '@nestjs/common';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';

@Controller('promotions')
export class PromotionsController {
  
  @Get()
  @RequirePermissions({ action: 'read', subject: 'Pricing' })
  getPromotions(@Query('page') page: string, @Query('pageSize') pageSize: string) {
    return { data: [], total: 0 };
  }

  @Get('conflicts')
  @RequirePermissions({ action: 'read', subject: 'Pricing' })
  getConflicts() {
    return { data: [], total: 0 };
  }
}
