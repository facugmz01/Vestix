import { Controller, Post, Body, Get, Query, Param, ParseUUIDPipe } from '@nestjs/common';
import { GoodsReceiptService } from './goods-receipt.service';
import { RequirePermissions } from '../../../core/rbac/decorators/require-permissions.decorator';

@Controller('purchasing/receipts')
export class ReceiptsController {
  constructor(private readonly receiptsService: GoodsReceiptService) {}

  @Get()
  @RequirePermissions({ action: 'read', subject: 'Purchasing' })
  findAll(@Query() query: any) {
    return this.receiptsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions({ action: 'read', subject: 'Purchasing' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.receiptsService.findOne(id);
  }

  @Post()
  @RequirePermissions({ action: 'manage', subject: 'Purchasing' })
  draft(@Body() dto: any) {
    return this.receiptsService.draftReceipt(dto);
  }

  @Post(':id/validate')
  @RequirePermissions({ action: 'manage', subject: 'Purchasing' })
  validate(@Param('id', ParseUUIDPipe) id: string, @Body() dto: { branchId: string, approvedByUserId?: string }) {
    return this.receiptsService.validateReceipt(id, dto.branchId, dto.approvedByUserId);
  }
}
