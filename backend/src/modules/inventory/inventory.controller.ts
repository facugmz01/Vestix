import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';
import { InventoryService } from './inventory.service';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('stock')
  @RequirePermissions({ action: 'read', subject: 'Inventory' })
  getStockLevels(@Query() query: any) {
    return this.inventoryService.findAllStock(query);
  }

  @Post('stock/adjust')
  @RequirePermissions({ action: 'manage', subject: 'Inventory' })
  adjustStock(@Body() dto: any) {
    return this.inventoryService.adjustStock(dto);
  }

  @Get('movements')
  @RequirePermissions({ action: 'read', subject: 'Inventory' })
  async getMovements(@Query() query: any) {
    const res = await this.inventoryService.findAllMovements(query);
    return res.data;
  }

  @Get('movements/all')
  @RequirePermissions({ action: 'read', subject: 'Inventory' })
  getAllMovements(@Query() query: any) {
    return this.inventoryService.findAllMovements(query);
  }

  @Get('transfers')
  @RequirePermissions({ action: 'read', subject: 'Inventory' })
  getTransfers(@Query('page') page: string, @Query('pageSize') pageSize: string) {
    return { data: [], total: 0 };
  }

  @Get('reservations')
  @RequirePermissions({ action: 'read', subject: 'Inventory' })
  getReservations(@Query('page') page: string, @Query('pageSize') pageSize: string) {
    return { data: [], total: 0 };
  }
}
