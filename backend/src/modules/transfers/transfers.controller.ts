import { Body, Controller, Param, Post, Get, Query, UseGuards, Request } from '@nestjs/common';
import { TransfersService } from './transfers.service';
import { CreateTransferDto, ReceiveTransferDto } from './dto/transfer.dto';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { PermissionsGuard } from '../../core/rbac/guards/permissions.guard';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';

/**
 * @deprecated Superseded by domains/logistics InventoryController (`/inventory/transfers`).
 * Kept for reference; not registered in AppModule.
 */
@Controller('inventory/transfers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Get()
  @RequirePermissions({ action: 'read', subject: 'Inventory' })
  findAll(@Query() query: any) {
    return this.transfersService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions({ action: 'read', subject: 'Inventory' })
  findOne(@Param('id') id: string) {
    return this.transfersService.findOne(id);
  }

  @Post()
  @RequirePermissions({ action: 'manage', subject: 'Inventory' })
  createTransfer(@Body() dto: CreateTransferDto, @Request() req: any) {
    return this.transfersService.createTransfer(dto, req.user.userId);
  }

  @Post(':id/dispatch')
  @RequirePermissions({ action: 'manage', subject: 'Inventory' })
  dispatchTransfer(@Param('id') id: string) {
    return this.transfersService.dispatchTransfer(id);
  }

  @Post(':id/receive')
  @RequirePermissions({ action: 'manage', subject: 'Inventory' })
  receiveTransfer(@Param('id') id: string, @Body() dto: ReceiveTransferDto) {
    return this.transfersService.receiveTransfer(id, dto);
  }

  @Post(':id/cancel')
  @RequirePermissions({ action: 'manage', subject: 'Inventory' })
  cancelTransfer(@Param('id') id: string) {
    return this.transfersService.prisma.stockTransfer.update({
      where: { id },
      data: { status: 'CANCELLED' } as any,
    });
  }
}
