import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseUUIDPipe } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { BulkImportBalancesDto } from '../sales/dto/bulk-balances.dto';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';

@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @RequirePermissions({ action: 'manage', subject: 'Purchasing' })
  create(@Body() dto: CreateSupplierDto) {
    return this.suppliersService.createSupplier(dto);
  }

  @Post('bulk-import-balances')
  @RequirePermissions({ action: 'manage', subject: 'Purchasing' })
  bulkImportBalances(@Body() dto: BulkImportBalancesDto) {
    return this.suppliersService.bulkImportBalances(dto);
  }

  @Get()
  @RequirePermissions({ action: 'read', subject: 'Purchasing' })
  findAll(@Query() query: any) {
    return this.suppliersService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions({ action: 'read', subject: 'Purchasing' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.suppliersService.getSupplier(id);
  }

  @Patch(':id')
  @RequirePermissions({ action: 'manage', subject: 'Purchasing' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: any) {
    return this.suppliersService.updateSupplier(id, dto);
  }

  @Delete(':id')
  @RequirePermissions({ action: 'manage', subject: 'Purchasing' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.suppliersService.deleteSupplier(id);
  }
}
