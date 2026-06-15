import { Controller, Post, Body, Get, Query, UseGuards, Req } from '@nestjs/common';
import { PosService } from './pos.service';
import { 
  ScanBarcodeDto, 
  QuickSaleDto, 
  CalculateCartDto, 
  OpenSessionDto, 
  CloseSessionDto 
} from './dto/pos.dtos';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';
import { CurrentUser } from '../../core/rbac/decorators/current-user.decorator';

import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../../core/rbac/guards/permissions.guard';

@Controller('pos')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class PosController {
  constructor(private readonly posService: PosService) {}

  @Get('sync/catalog')
  @RequirePermissions({ action: 'read', subject: 'Catalog' })
  async downloadPosCatalog() {
    return this.posService.getCatalogSyncData();
  }

  @Get('catalog/search')
  @RequirePermissions({ action: 'read', subject: 'Catalog' })
  async searchCatalog(@Query('q') q: string, @Query('customerId') customerId?: string) {
    return this.posService.searchCatalog(q, customerId);
  }

  @Post('scan')
  @RequirePermissions({ action: 'create', subject: 'Sales' })
  async scanBarcode(@Body() scanDto: ScanBarcodeDto) {
    return this.posService.resolveBarcode(scanDto.barcode);
  }

  @Post('quick-sale')
  @RequirePermissions({ action: 'create', subject: 'Sales' })
  async quickSale(@Body() dto: QuickSaleDto, @Req() req: any) {
    return this.posService.processQuickSale({ ...dto, userId: req.user?.userId });
  }

  @Post('cart/calculate')
  @RequirePermissions({ action: 'read', subject: 'Sales' })
  async calculateCart(@Body() dto: CalculateCartDto) {
    return this.posService.calculateCart(dto);
  }

  @Get('session/current')
  @RequirePermissions({ action: 'read', subject: 'Sales' })
  async getCurrentSession(@Query('registerId') registerId: string) {
    return this.posService.getCurrentSession(registerId);
  }

  @Get('registers')
  @RequirePermissions({ action: 'read', subject: 'Sales' })
  async getRegisters(@Query('branchId') branchId: string) {
    return this.posService.getRegisters(branchId);
  }

  @Post('session/open')
  @RequirePermissions({ action: 'update', subject: 'Sales' })
  async openSession(@Body() dto: OpenSessionDto, @CurrentUser('userId') userId: string) {
    return this.posService.openSession({ ...dto, userId });
  }

  @Post('session/close')
  @RequirePermissions({ action: 'update', subject: 'Sales' })
  async closeSession(@Body() dto: CloseSessionDto, @CurrentUser('userId') userId: string) {
    return this.posService.closeSession({ ...dto, userId });
  }
}
