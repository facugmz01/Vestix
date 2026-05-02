import { Controller, Post, Body, Get, Query, Param, ParseUUIDPipe } from '@nestjs/common';
import { PurchasingService } from './purchasing.service';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';

@Controller('purchasing')
export class PurchasingController {
  constructor(private readonly purchasingService: PurchasingService) {}

  @Get('orders')
  @RequirePermissions({ action: 'read', subject: 'Purchasing' })
  findAll(@Query() query: any) {
    return this.purchasingService.findAll(query);
  }

  @Post('direct')
  @RequirePermissions({ action: 'create', subject: 'Purchasing' })
  processDirectPurchase(@Body() dto: any) {
    return this.purchasingService.processDirectPurchase(dto);
  }

  @Post('orders')
  @RequirePermissions({ action: 'create', subject: 'Purchasing' })
  createPO(@Body() dto: any) {
    return this.purchasingService.createPO(dto);
  }
}
