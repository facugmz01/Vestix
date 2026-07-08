import { Body, Controller, Post, UseGuards, Get, Query, Param, Delete } from '@nestjs/common';
import { PurchasingService } from './purchasing.service';
import { CreatePurchaseOrderDto } from './dto/create-po.dto';
import { ReceiveGoodsDto } from './dto/receive-goods.dto';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { PermissionsGuard } from '../../core/rbac/guards/permissions.guard';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';

/**
 * @deprecated Superseded by domains/procurement PurchasingController.
 * Not registered in AppModule.
 */
@Controller('purchasing')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PurchasingController {
  constructor(private readonly purchasingService: PurchasingService) {}

  @Post('orders')
  @RequirePermissions({ action: 'manage', subject: 'Purchasing' })
  createPurchaseOrder(@Body() dto: CreatePurchaseOrderDto) {
    return this.purchasingService.createPurchaseOrder(dto);
  }

  @Post('receipts')
  @RequirePermissions({ action: 'update', subject: 'Purchasing' })
  receiveGoods(@Body() dto: ReceiveGoodsDto) {
    return this.purchasingService.receiveGoods(dto);
  }

  @Get('orders')
  @RequirePermissions({ action: 'read', subject: 'Purchasing' })
  findAllOrders(@Query() query: any) {
    return this.purchasingService.findAllOrders(query);
  }

  @Get('orders/:id')
  @RequirePermissions({ action: 'read', subject: 'Purchasing' })
  findOneOrder(@Param('id') id: string) {
    return this.purchasingService.findOneOrder(id);
  }

  @Post('orders/:id/issue')
  @RequirePermissions({ action: 'manage', subject: 'Purchasing' })
  issueOrder(@Param('id') id: string) {
    return this.purchasingService.prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'ISSUED' },
    });
  }

  @Post('orders/:id/receive')
  @RequirePermissions({ action: 'update', subject: 'Purchasing' })
  receiveOrder(@Param('id') id: string, @Body() dto: ReceiveGoodsDto) {
    return this.purchasingService.receiveGoods({ ...dto, purchaseOrderId: id } as any);
  }

  @Delete('orders/:id')
  @RequirePermissions({ action: 'manage', subject: 'Purchasing' })
  removeOrder(@Param('id') id: string) {
    return this.purchasingService.prisma.purchaseOrder.delete({
      where: { id },
    });
  }

  @Get('receipts')
  @RequirePermissions({ action: 'read', subject: 'Purchasing' })
  findAllReceipts(@Query() query: any) {
    return this.purchasingService.findAllReceipts(query);
  }

  @Get('receipts/:id')
  @RequirePermissions({ action: 'read', subject: 'Purchasing' })
  findOneReceipt(@Param('id') id: string) {
    return this.purchasingService.findOneReceipt(id);
  }
}
