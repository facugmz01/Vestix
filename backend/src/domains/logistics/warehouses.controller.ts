import { Controller, Get, Post, Body, Param, Patch, Delete, Query, ParseUUIDPipe } from '@nestjs/common';
import { WarehousesService } from './warehouses.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../core/rbac/guards/permissions.guard';
import { AuthGuard } from '@nestjs/passport';
import { UseGuards } from '@nestjs/common';

@Controller('warehouses')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Post()
  @RequirePermissions({ action: 'manage', subject: 'Inventory' })
  create(@Body() dto: CreateWarehouseDto) {
    return this.warehousesService.create(dto);
  }

  @Get()
  @RequirePermissions({ action: 'read', subject: 'Inventory' })
  findAll(@Query() query: any) {
    return this.warehousesService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions({ action: 'read', subject: 'Inventory' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.warehousesService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions({ action: 'manage', subject: 'Inventory' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateWarehouseDto) {
    return this.warehousesService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions({ action: 'manage', subject: 'Inventory' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.warehousesService.remove(id);
  }
}
