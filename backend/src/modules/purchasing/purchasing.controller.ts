import { Body, Controller, Post, UseGuards, Get, Query, Param, Delete } from '@nestjs/common';
import { PurchasingService } from './purchasing.service';
import { CreatePurchaseOrderDto } from './dto/create-po.dto';
import { ReceiveGoodsDto } from './dto/receive-goods.dto';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { RolesGuard } from '../../core/rbac/roles.guard';
import { Roles } from '../../core/rbac/roles.decorator';

@Controller('purchasing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PurchasingController {
  constructor(private readonly purchasingService: PurchasingService) {}

  @Post('orders')
  @Roles('Store Manager', 'Backoffice Admin')
  createPurchaseOrder(@Body() dto: CreatePurchaseOrderDto) {
    return this.purchasingService.createPurchaseOrder(dto);
  }

  @Post('receipts')
  @Roles('Store Manager', 'Backoffice Admin', 'Inventory Clerk')
  receiveGoods(@Body() dto: ReceiveGoodsDto) {
    return this.purchasingService.receiveGoods(dto);
  }

  @Get('orders')
  @Roles('Store Manager', 'Backoffice Admin', 'Inventory Clerk')
  findAllOrders(@Query() query: any) {
    return this.purchasingService.findAllOrders(query);
  }

  @Get('orders/:id')
  @Roles('Store Manager', 'Backoffice Admin', 'Inventory Clerk')
  findOneOrder(@Param('id') id: string) {
    return this.purchasingService.findOneOrder(id);
  }

  @Post('orders/:id/issue')
  @Roles('Store Manager', 'Backoffice Admin')
  issueOrder(@Param('id') id: string) {
    return this.purchasingService.prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'ISSUED' },
    });
  }

  @Post('orders/:id/receive')
  @Roles('Store Manager', 'Backoffice Admin', 'Inventory Clerk')
  receiveOrder(@Param('id') id: string, @Body() dto: ReceiveGoodsDto) {
    // Adapter mapping to receiveGoods
    return this.purchasingService.receiveGoods({ ...dto, purchaseOrderId: id } as any);
  }

  @Delete('orders/:id')
  @Roles('Store Manager', 'Backoffice Admin')
  removeOrder(@Param('id') id: string) {
    return this.purchasingService.prisma.purchaseOrder.delete({
      where: { id },
    });
  }

  @Get('receipts')
  @Roles('Store Manager', 'Backoffice Admin', 'Inventory Clerk')
  findAllReceipts(@Query() query: any) {
    return this.purchasingService.findAllReceipts(query);
  }

  @Get('receipts/:id')
  @Roles('Store Manager', 'Backoffice Admin', 'Inventory Clerk')
  findOneReceipt(@Param('id') id: string) {
    return this.purchasingService.findOneReceipt(id);
  }
}
