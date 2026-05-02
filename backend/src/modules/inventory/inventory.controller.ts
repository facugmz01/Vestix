import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';

@Controller('inventory')
export class InventoryController {
  
  @Get('stock')
  @RequirePermissions({ action: 'read', subject: 'Inventory' })
  getStockLevels(@Query('page') page: string, @Query('pageSize') pageSize: string) {
    return { data: [], total: 0 };
  }

  @Get('movements')
  @RequirePermissions({ action: 'read', subject: 'Inventory' })
  getMovements(@Query('page') page: string, @Query('pageSize') pageSize: string) {
    return { data: [], total: 0 };
  }

  @Get('movements/all')
  @RequirePermissions({ action: 'read', subject: 'Inventory' })
  getAllMovements(@Query('page') page: string, @Query('pageSize') pageSize: string) {
    return { data: [], total: 0 };
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
