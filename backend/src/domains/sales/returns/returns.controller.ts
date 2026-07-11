import { Controller, Post, Body, Get, Query, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReturnsService } from './returns.service';
import { CreateReturnDto } from './dto/create-return.dto';
import { RequirePermissions } from '../../../core/rbac/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../../core/rbac/guards/permissions.guard';

@Controller('sales/returns')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Post()
  @RequirePermissions({ action: 'create', subject: 'Sales' })
  async createReturn(@Body() dto: CreateReturnDto) {
    return this.returnsService.processReturn(dto);
  }

  @Get()
  @RequirePermissions({ action: 'read', subject: 'Sales' })
  async getReturns(@Query() query: any) {
    return this.returnsService.getReturns(query);
  }

  @Get(':id')
  @RequirePermissions({ action: 'read', subject: 'Sales' })
  async getReturn(@Param('id') id: string) {
    return this.returnsService.getReturnById(id);
  }

  @Post(':id/approve')
  @RequirePermissions({ action: 'update', subject: 'Sales' })
  async approveReturn(@Param('id') id: string) {
    return this.returnsService.approveReturn(id);
  }

  @Post(':id/reject')
  @RequirePermissions({ action: 'update', subject: 'Sales' })
  async rejectReturn(@Param('id') id: string) {
    return this.returnsService.rejectReturn(id);
  }
}
