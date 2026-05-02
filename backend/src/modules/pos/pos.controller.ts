import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { PosService } from './pos.service';
import { ScanBarcodeDto } from './dto/scan-barcode.dto';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';

@Controller('pos')
export class PosController {
  constructor(private readonly posService: PosService) {}

  /**
   * OFFLINE SYNC: Used by the PWA/Dexie.js client to download the catalog database.
   * This ensures the POS can still resolve barcodes when the internet goes down.
   */
  @Get('sync/catalog')
  @RequirePermissions({ action: 'read', subject: 'Catalog' })
  async downloadPosCatalog() {
    // In production, returns a highly compressed, denormalized JSON array of all active barcodes, prices, and names.
    return { status: 'SYNC_READY', data: [] };
  }

  @Get('catalog/search')
  @RequirePermissions({ action: 'read', subject: 'Catalog' })
  async searchCatalog(@Query('q') q: string) {
    return this.posService.searchCatalog(q);
  }

  /**
   * Real-time barcode resolution when the POS is online.
   */
  @Post('scan')
  @RequirePermissions({ action: 'create', subject: 'Sales' })
  async scanBarcode(@Body() scanDto: ScanBarcodeDto) {
    return this.posService.resolveBarcode(scanDto.barcode);
  }

  /**
   * Streamlined Quick Sale for high-volume retail.
   */
  @Post('quick-sale')
  @RequirePermissions({ action: 'create', subject: 'Sales' })
  async quickSale(@Body() body: any) {
    // In production, branchId and warehouseId are inferred securely from the cashier's active Shift context
    return this.posService.processQuickSale({
      branchId: 'mock-branch',
      warehouseId: 'mock-warehouse',
      variantId: body.variantId,
      categoryId: body.categoryId,
      accountId: body.accountId,
    });
  }

  /**
   * Delegates cart promotion and discount calculations to the backend rules engine.
   */
  @Post('cart/calculate')
  @RequirePermissions({ action: 'read', subject: 'Sales' })
  async calculateCart(@Body() dto: any) {
    return this.posService.calculateCart(dto);
  }

  @Get('session/current')
  async getCurrentSession() {
    return null; // Return null if no session active, or a mock session
  }

  @Get('registers')
  async getRegisters() {
    return []; // Return empty array of registers
  }
}
