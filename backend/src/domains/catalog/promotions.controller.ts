import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../../core/rbac/guards/permissions.guard';

@Controller('promotions')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
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
