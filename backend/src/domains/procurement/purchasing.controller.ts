import { Controller, Post, Body, Get, Query, Param, ParseUUIDPipe, Patch, Delete } from '@nestjs/common';
import { PurchasingService } from './purchasing.service';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';
import { BulkImportPurchasesDto } from './dto/bulk-purchases.dto';

@Controller('purchasing')
export class PurchasingController {
  constructor(private readonly purchasingService: PurchasingService) {}

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
}

