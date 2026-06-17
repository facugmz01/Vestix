import { Body, Controller, Post, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { TreasuryService } from './treasury.service';
import { OpenShiftDto, CloseShiftDto } from './dto/treasury.dto';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { RolesGuard } from '../../core/rbac/roles.guard';
import { Roles } from '../../core/rbac/roles.decorator';

@Controller('finance/treasury/shifts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TreasuryController {
  constructor(private readonly treasuryService: TreasuryService) {}

  @Get()
  @Roles('Store Manager', 'Backoffice Admin', 'Cashier')
  findAllShifts(@Query() query: any) {
    return this.treasuryService.findAllShifts(query);
  }

  @Get('active')
  @Roles('Store Manager', 'Backoffice Admin', 'Cashier')
  getActiveShift(@Request() req: any) {
    return this.treasuryService.getActiveShift(req.user.sub);
  }

  @Get(':id')
  @Roles('Store Manager', 'Backoffice Admin', 'Cashier')
  findOneShift(@Param('id') id: string) {
    return this.treasuryService.findOneShift(id);
  }

  @Get(':id/movements')
  @Roles('Store Manager', 'Backoffice Admin', 'Cashier')
  getShiftMovements(@Param('id') id: string) {
    return this.treasuryService.getShiftMovements(id);
  }

  @Post(':id/movements')
  @Roles('Store Manager', 'Backoffice Admin', 'Cashier')
  createMovement(@Param('id') id: string, @Body() payload: any, @Request() req: any) {
    return this.treasuryService.createMovement(id, payload, req.user.sub);
  }

  @Post('open')
  @Roles('Store Manager', 'Backoffice Admin', 'Cashier')
  openShift(@Body() dto: OpenShiftDto, @Request() req: any) {
    return this.treasuryService.openShift(dto, req.user.sub);
  }

  @Post('close')
  @Roles('Store Manager', 'Backoffice Admin', 'Cashier')
  closeShift(@Body() dto: CloseShiftDto, @Request() req: any) {
    return this.treasuryService.closeShift(dto, req.user.sub);
  }
}
