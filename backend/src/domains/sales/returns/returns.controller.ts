import { Controller, Post, Body, Get, Query, Param } from '@nestjs/common';
import { ReturnsService } from './returns.service';
import { CreateReturnDto } from './dto/create-return.dto';
import { RequirePermissions } from '../../../core/rbac/decorators/require-permissions.decorator';

@Controller('sales/returns')
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
    // For now, processReturn already approves and processes stock/money.
    // This could be used for a two-step approval process in the future.
    return { status: 'ALREADY_APPROVED' };
  }
}
