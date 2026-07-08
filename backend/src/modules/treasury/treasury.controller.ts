import { Body, Controller, Post, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { TreasuryService } from './treasury.service';
import { OpenShiftDto, CloseShiftDto } from './dto/treasury.dto';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { PermissionsGuard } from '../../core/rbac/guards/permissions.guard';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';

/**
 * @deprecated Superseded by domains/finance FinanceController (`/finance/treasury/shifts`).
 * Kept for reference; not registered in AppModule.
 */
@Controller('finance/treasury/shifts')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TreasuryController {
  constructor(private readonly treasuryService: TreasuryService) {}

  @Get()
  @RequirePermissions({ action: 'read', subject: 'Finance' })
  findAllShifts(@Query() query: any) {
    return this.treasuryService.findAllShifts(query);
  }

  @Get('active')
  @RequirePermissions({ action: 'read', subject: 'Finance' })
  getActiveShift(@Request() req: any) {
    return this.treasuryService.getActiveShift(req.user.userId);
  }

  @Get(':id')
  @RequirePermissions({ action: 'read', subject: 'Finance' })
  findOneShift(@Param('id') id: string) {
    return this.treasuryService.findOneShift(id);
  }

  @Get(':id/movements')
  @RequirePermissions({ action: 'read', subject: 'Finance' })
  getShiftMovements(@Param('id') id: string) {
    return this.treasuryService.getShiftMovements(id);
  }

  @Post(':id/movements')
  @RequirePermissions({ action: 'manage', subject: 'Finance' })
  createMovement(@Param('id') id: string, @Body() payload: any, @Request() req: any) {
    return this.treasuryService.createMovement(id, payload, req.user.userId);
  }

  @Post('open')
  @RequirePermissions({ action: 'manage', subject: 'Finance' })
  openShift(@Body() dto: OpenShiftDto, @Request() req: any) {
    return this.treasuryService.openShift(dto, req.user.userId);
  }

  @Post('close')
  @RequirePermissions({ action: 'manage', subject: 'Finance' })
  closeShift(@Body() dto: CloseShiftDto, @Request() req: any) {
    return this.treasuryService.closeShift(dto, req.user.userId);
  }
}
