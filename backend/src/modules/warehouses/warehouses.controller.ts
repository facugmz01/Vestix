import { Controller, Get, Post, Body, Param, Put, Delete, Query } from '@nestjs/common';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';

@Controller('warehouses')
export class WarehousesController {
  
  @Get()
  @RequirePermissions({ action: 'read', subject: 'Branch' })
  findAll(@Query('branchId') branchId?: string) {
    return { data: [], total: 0 };
  }

  @Get(':id')
  @RequirePermissions({ action: 'read', subject: 'Branch' })
  findOne(@Param('id') id: string) {
    return {};
  }
}
