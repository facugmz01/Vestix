import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RequirePermissions, RequireAnyPermissions } from '../../../core/rbac/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../../core/rbac/guards/permissions.guard';
import { LoyaltyService } from './loyalty.service';
import { RedeemLoyaltyPointsDto, AdjustLoyaltyPointsDto } from './dto/loyalty.dto';

@Controller('loyalty')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get('settings')
  @RequirePermissions({ action: 'read', subject: 'Sales' })
  getSettings() {
    return this.loyaltyService.getSettings();
  }

  @Get('accounts/:customerId')
  @RequireAnyPermissions(
    [{ action: 'read', subject: 'Sales' }],
    [{ action: 'read', subject: 'Customers' }],
  )
  getAccount(@Param('customerId', ParseUUIDPipe) customerId: string) {
    return this.loyaltyService.getAccount(customerId);
  }

  @Post('accounts/:customerId/ensure')
  @RequirePermissions({ action: 'create', subject: 'Sales' })
  ensureAccount(@Param('customerId', ParseUUIDPipe) customerId: string) {
    return this.loyaltyService.getOrCreateAccount(customerId);
  }

  @Post('redeem')
  @RequirePermissions({ action: 'update', subject: 'Sales' })
  redeem(@Body() dto: RedeemLoyaltyPointsDto) {
    return this.loyaltyService.redeemPoints(dto.customerId, dto.points, dto.reason);
  }

  @Post('adjust')
  @RequirePermissions({ action: 'manage', subject: 'Sales' })
  adjust(@Body() dto: AdjustLoyaltyPointsDto) {
    return this.loyaltyService.adjustAccount(dto.customerId, dto.points, dto.tier);
  }
}
