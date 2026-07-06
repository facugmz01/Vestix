import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CatalogFilterDto } from './dto/catalog-filter.dto';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';
import { ParseBooleanQueryPipe } from '../../core/pipes/parse-boolean-query.pipe';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('public')
  async getPublicCatalog(
    @Query() filters: CatalogFilterDto,
    @Query('inStockOnly', ParseBooleanQueryPipe) inStockOnly?: boolean,
  ) {
    return this.catalogService.getPublicCatalog({ ...filters, inStockOnly: inStockOnly ?? filters.inStockOnly });
  }

  @Get('categories/public')
  async getPublicCategories() {
    return this.catalogService.getPublicCategories();
  }

  @Get('brands/public')
  async getPublicBrands() {
    return this.catalogService.getPublicBrands();
  }

  @Get('public/:id')
  async getPublicProduct(@Param('id') id: string, @Query('preview') preview?: string) {
    return this.catalogService.getPublicProduct(id, preview === 'true');
  }

  @Post('reprice-usd')
  @RequirePermissions({ action: 'manage', subject: 'Settings' }) // or 'Catalog' depending on exact roles
  async repriceUsd(@Body() dto: { type: 'Oficial' | 'Blue' }) {
    return this.catalogService.repriceUsd(dto.type);
  }

  /**
   * PROTECTED ENDPOINT: Internal hardware API.
   * Hit exclusively by physical POS terminals syncing their offline databases.
   */
  @Get('pos-sync/:branchId')
  @RequirePermissions({ action: 'read', subject: 'Catalog' })
  async getPosSyncCatalog(@Param('branchId') branchId: string) {
    return this.catalogService.getPosSyncCatalog(branchId);
  }
}
