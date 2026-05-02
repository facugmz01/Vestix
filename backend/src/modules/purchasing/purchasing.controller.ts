import { Controller, Post, Body, Patch, Param, ParseUUIDPipe, Get, Query } from '@nestjs/common';
import { PurchasingService } from './purchasing.service';
import { CreatePurchaseOrderDto, ReceivePurchaseOrderDto } from './dto/purchasing.dto';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';

@Controller('purchasing')
export class PurchasingController {
  constructor(private readonly purchasingService: PurchasingService) {}

  @Get('orders')
  @RequirePermissions({ action: 'read', subject: 'Purchasing' })
  getOrders(@Query('page') page: string, @Query('pageSize') pageSize: string) {
    return { data: [], total: 0 };
  }

  @Post('orders')
  @RequirePermissions({ action: 'create', subject: 'Purchasing' })
  createPO(@Body() createPurchaseOrderDto: CreatePurchaseOrderDto) {
    return this.purchasingService.createPO(createPurchaseOrderDto);
  }

  @Patch('orders/:id/issue')
  @RequirePermissions({ action: 'update', subject: 'Purchasing' })
  issuePO(@Param('id', ParseUUIDPipe) id: string) {
    return this.purchasingService.issuePO(id);
  }

  @Get('receipts')
  @RequirePermissions({ action: 'read', subject: 'Purchasing' })
  getReceipts(@Query('page') page: string, @Query('pageSize') pageSize: string) {
    return { data: [], total: 0 };
  }
}
