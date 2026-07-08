import { Controller, Post, Body, Get, Query, Param, ParseUUIDPipe, Patch, Delete, UseGuards } from '@nestjs/common';
import { PurchasingService } from './purchasing.service';
import { GoodsReceiptService } from './receipts/goods-receipt.service';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';
import { BulkImportPurchasesDto } from './dto/bulk-purchases.dto';
import { PermissionsGuard } from '../../core/rbac/guards/permissions.guard';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../../core/rbac/decorators/current-user.decorator';

@Controller('purchasing')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class PurchasingController {
  constructor(
    private readonly purchasingService: PurchasingService,
    private readonly goodsReceiptService: GoodsReceiptService,
  ) {}

  @Get('orders')
  @RequirePermissions({ action: 'read', subject: 'Purchasing' })
  findAll(@Query() query: any) {
    return this.purchasingService.findAll(query);
  }

  @Post('bulk-import')
  @RequirePermissions({ action: 'create', subject: 'Purchasing' })
  bulkImportPurchases(@Body() dto: BulkImportPurchasesDto) {
    return this.purchasingService.bulkImportPurchases(dto);
  }

  @Post('direct')
  @RequirePermissions({ action: 'create', subject: 'Purchasing' })
  processDirectPurchase(@Body() dto: any) {
    return this.purchasingService.processDirectPurchase(dto);
  }

  @Post('auto-replenish')
  @RequirePermissions({ action: 'manage', subject: 'Purchasing' })
  autoReplenish() {
    return this.purchasingService.generateReplenishmentOrders();
  }

  @Post('orders')
  @RequirePermissions({ action: 'create', subject: 'Purchasing' })
  createPO(@Body() dto: any) {
    return this.purchasingService.createPO(dto);
  }

  @Get('orders/:id')
  @RequirePermissions({ action: 'read', subject: 'Purchasing' })
  findOne(@Param('id') id: string) {
    return this.purchasingService.getPO(id);
  }

  @Patch('orders/:id')
  @RequirePermissions({ action: 'manage', subject: 'Purchasing' })
  update(@Param('id') id: string, @Body() dto: any) {
    return this.purchasingService.updatePO(id, dto);
  }

  @Delete('orders/:id')
  @RequirePermissions({ action: 'manage', subject: 'Purchasing' })
  remove(@Param('id') id: string) {
    return this.purchasingService.removePO(id);
  }

  @Post('orders/:id/issue')
  @RequirePermissions({ action: 'manage', subject: 'Purchasing' })
  issue(@Param('id') id: string) {
    return this.purchasingService.issueOrder(id);
  }

  @Post('orders/:id/receive')
  @RequirePermissions({ action: 'manage', subject: 'Purchasing' })
  receive(
    @Param('id') id: string,
    @Body() dto: { lines: { variantId: string; receivedQuantity: number }[] },
    @CurrentUser('userId') userId: string,
  ) {
    return this.goodsReceiptService.quickReceiveFromPO(id, dto.lines, userId);
  }
}

