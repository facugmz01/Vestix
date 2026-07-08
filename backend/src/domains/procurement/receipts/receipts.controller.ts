import { Controller, Post, Body, Get, Query, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GoodsReceiptService } from './goods-receipt.service';
import { RequirePermissions } from '../../../core/rbac/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../../../core/rbac/guards/permissions.guard';
import { CurrentUser } from '../../../core/rbac/decorators/current-user.decorator';

@Controller('purchasing/receipts')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
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

  @Post('draft')
  @RequirePermissions({ action: 'manage', subject: 'Purchasing' })
  draft(@Body() dto: any) {
    return this.receiptsService.draftReceipt(dto);
  }

  @Post(':id/validate')
  @RequirePermissions({ action: 'manage', subject: 'Purchasing' })
  validate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { branchId?: string; approvedByUserId?: string },
    @CurrentUser('userId') userId: string,
  ) {
    return this.receiptsService.validateReceipt(id, dto.branchId, dto.approvedByUserId || userId);
  }
}
