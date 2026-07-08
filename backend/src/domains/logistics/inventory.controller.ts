import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';
import { InventoryService } from './inventory.service';
import { TransfersService } from './transfers/transfers.service';
import { PermissionsGuard } from '../../core/rbac/guards/permissions.guard';
import { AuthGuard } from '@nestjs/passport';
import { AdjustStockDto } from './dto/adjust-stock.dto';

@Controller('inventory')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly transfersService: TransfersService,
  ) {}

  @Get('stock')
  @RequirePermissions({ action: 'read', subject: 'Inventory' })
  getStockLevels(@Query() query: any) {
    return this.inventoryService.findAllStock(query);
  }

  @Get('stock/variant/:variantId')
  @RequirePermissions({ action: 'read', subject: 'Inventory' })
  getStockByVariant(@Param('variantId') variantId: string) {
    return this.inventoryService.getStockByVariant(variantId);
  }

  @Post('stock/adjust')
  @RequirePermissions({ action: 'manage', subject: 'Inventory' })
  adjustStock(@Body() body: AdjustStockDto) {
    return this.inventoryService.adjustStock(body);
  }

  @Post('audit')
  @RequirePermissions({ action: 'manage', subject: 'Inventory' })
  processStockAudit(@Body() body: { warehouseId: string; items: { variantId: string; batchId?: string; countedQuantity: number }[] }) {
    return this.inventoryService.processStockAudit(body);
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

  @Get('movements/:id')
  @RequirePermissions({ action: 'read', subject: 'Inventory' })
  getMovementDetail(@Param('id') id: string) {
    return this.inventoryService.findMovementById(id);
  }

  @Get('transfers')
  @RequirePermissions({ action: 'read', subject: 'Inventory' })
  getTransfers(@Query() query: any) {
    return this.transfersService.findAll(query);
  }

  @Get('transfers/:id')
  @RequirePermissions({ action: 'read', subject: 'Inventory' })
  getTransfer(@Param('id') id: string) {
    return this.transfersService.findOne(id);
  }

  @Post('transfers')
  @RequirePermissions({ action: 'manage', subject: 'Inventory' })
  createTransfer(@Body() body: any) {
    return this.transfersService.createTransfer(body);
  }

  @Post('transfers/:id/dispatch')
  @RequirePermissions({ action: 'manage', subject: 'Inventory' })
  dispatchTransfer(@Param('id') id: string, @Body() body: any) {
    return this.transfersService.dispatchTransfer(id, body);
  }

  @Post('transfers/:id/receive')
  @RequirePermissions({ action: 'manage', subject: 'Inventory' })
  receiveTransfer(@Param('id') id: string, @Body() body: any) {
    return this.transfersService.receiveTransfer(id, body);
  }

  @Post('transfers/:id/cancel')
  @RequirePermissions({ action: 'manage', subject: 'Inventory' })
  cancelTransfer(@Param('id') id: string) {
    return this.transfersService.cancelTransfer(id);
  }

  @Get('reservations')
  @RequirePermissions({ action: 'read', subject: 'Inventory' })
  getReservations(@Query('page') page: string, @Query('pageSize') pageSize: string) {
    return { data: [], total: 0 };
  }
}
