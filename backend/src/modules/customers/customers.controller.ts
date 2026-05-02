import { Controller, Get, Post, Body, Param, Put, Delete, Query } from '@nestjs/common';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';

@Controller('customers')
export class CustomersController {
  
  @Get()
  @RequirePermissions({ action: 'read', subject: 'Customers' })
  findAll(@Query('page') page: string, @Query('pageSize') pageSize: string) {
    return { data: [], total: 0 };
  }

  @Get(':id')
  @RequirePermissions({ action: 'read', subject: 'Customers' })
  findOne(@Param('id') id: string) {
    return {};
  }

  @Post()
  @RequirePermissions({ action: 'create', subject: 'Customers' })
  create(@Body() body: any) {
    return {};
  }

  @Put(':id')
  @RequirePermissions({ action: 'update', subject: 'Customers' })
  update(@Param('id') id: string, @Body() body: any) {
    return {};
  }

  @Delete(':id')
  @RequirePermissions({ action: 'delete', subject: 'Customers' })
  delete(@Param('id') id: string) {
    return { success: true };
  }
}
