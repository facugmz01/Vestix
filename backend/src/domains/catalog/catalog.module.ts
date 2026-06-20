import { Module, Global } from '@nestjs/common';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { ProductsService } from './services/products.service';
import { CategoriesService, BrandsService, AttributesService, PriceListService } from './services/taxonomy.service';
import {
  ProductsController,
  CategoriesController,
  BrandsController,
  VariantsController,
  AttributesController,
  PriceListController,
  PublicCatalogController,
  PricingLegacyController,
} from './controllers/catalog.controller';
import { PricingService } from './pricing.service';
import { PromotionsController } from './promotions.controller';
import { RulesEngineService } from './rules-engine.service';
import { CatalogService } from './catalog.service';
import { CatalogController } from './catalog.controller';
import { IdentifiersService } from './identifiers.service';
import { IdentifiersController } from './identifiers.controller';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [
    ProductsController,
    CategoriesController,
    BrandsController,
    VariantsController,
    AttributesController,
    PriceListController,
    PromotionsController,
    CatalogController,
    IdentifiersController,
    PublicCatalogController,
    PricingLegacyController,
  ],
  providers: [
    ProductsService,
    CategoriesService,
    BrandsService,
    AttributesService,
    PriceListService,
    PricingService,
    RulesEngineService,
    CatalogService,
    IdentifiersService,
  ],
  exports: [
    ProductsService,
    CategoriesService,
    BrandsService,
    AttributesService,
    PriceListService,
    PricingService,
    RulesEngineService,
    CatalogService,
    IdentifiersService,
  ],
})
export class CatalogModule {}
