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
  getReservations(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.inventoryService.findReservations({
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 15,
      search,
      status,
      branchId,
    });
  }

  @Get('reservations/:id')
  @RequirePermissions({ action: 'read', subject: 'Inventory' })
  getReservation(@Param('id') id: string) {
    return this.inventoryService.findReservationById(id);
  }

  @Post('reservations')
  @RequirePermissions({ action: 'manage', subject: 'Inventory' })
  createReservation(@Body() body: {
    branchId: string;
    customerId?: string;
    expiresAt: string;
    notes?: string;
    lines: { variantId: string; quantity: number }[];
  }) {
    return this.inventoryService.createManualReservation(body);
  }

  @Post('reservations/:id/consume')
  @RequirePermissions({ action: 'manage', subject: 'Inventory' })
  consumeReservation(@Param('id') id: string, @Body() body: { saleOrderId?: string }) {
    return this.inventoryService.consumeReservationById(id, body?.saleOrderId);
  }

  @Post('reservations/:id/release')
  @RequirePermissions({ action: 'manage', subject: 'Inventory' })
  releaseReservation(@Param('id') id: string) {
    return this.inventoryService.releaseReservationById(id);
  }
}
