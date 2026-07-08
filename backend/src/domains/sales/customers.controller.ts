import { Controller, Get, Post, Body, Param, Patch, Delete, Query, ParseUUIDPipe } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { BulkImportBalancesDto } from './dto/bulk-balances.dto';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../../core/rbac/guards/permissions.guard';

@Controller('customers')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @RequirePermissions({ action: 'create', subject: 'Customers' })
  create(@Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto);
  }

  @Post('bulk-import-balances')
  @RequirePermissions({ action: 'manage', subject: 'Customers' })
  bulkImportBalances(@Body() dto: BulkImportBalancesDto) {
    return this.customersService.bulkImportBalances(dto);
  }

  @Get()
  @RequirePermissions({ action: 'read', subject: 'Customers' })
  findAll(@Query() query: any) {
    return this.customersService.findAll(query);
  }

  @Get(':id/history')
  @RequirePermissions({ action: 'read', subject: 'Customers' })
  getHistory(@Param('id', ParseUUIDPipe) id: string) {
    return this.customersService.getHistory(id);
  }

  @Get(':id')
  @RequirePermissions({ action: 'read', subject: 'Customers' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.customersService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions({ action: 'update', subject: 'Customers' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: any) {
    return this.customersService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions({ action: 'delete', subject: 'Customers' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.customersService.remove(id);
  }
}
