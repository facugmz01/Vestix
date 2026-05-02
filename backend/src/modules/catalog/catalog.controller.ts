import { Controller, Get, Query, Param } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CatalogFilterDto } from './dto/catalog-filter.dto';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  /**
   * PUBLIC ENDPOINT: Zero authentication required.
   * Hit by the Next.js storefront for SEO and customer browsing.
   */
  @Get('public')
  async getPublicCatalog(@Query() filters: CatalogFilterDto) {
    return this.catalogService.getPublicCatalog(filters);
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
