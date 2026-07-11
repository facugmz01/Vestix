import { Module } from '@nestjs/common';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { ProductsService } from './services/products.service';
import { PromotionsService } from './services/promotions.service';
import { MediaService } from './services/media.service';
import { PriceHistoryService } from './services/price-history.service';
import { CategoriesService, BrandsService, AttributesService, PriceListService } from './services/taxonomy.service';
import {
  ProductsController,
  CategoriesController,
  BrandsController,
  VariantsController,
  AttributesController,
  PriceListController,
} from './controllers/catalog.controller';
import { PricingService } from './pricing.service';
import { PromotionsController } from './promotions.controller';
import { RulesEngineService } from './rules-engine.service';
import { CatalogService } from './catalog.service';
import { CatalogController } from './catalog.controller';
import { IdentifiersService } from './identifiers.service';
import { IdentifiersController } from './identifiers.controller';
import { CatalogFacade } from './catalog.facade';
import { LabelTemplatesService } from './labels/label-templates.service';
import { LabelsRenderService } from './labels/labels-render.service';
import { LabelTemplatesController } from './labels/label-templates.controller';
import { LabelsController } from './labels/labels.controller';
import { CollectionsController } from './controllers/collections.controller';
import { CollectionsService } from './services/collections.service';

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
    LabelTemplatesController,
    LabelsController,
    CollectionsController,
  ],
  providers: [
    ProductsService,
    PromotionsService,
    MediaService,
    PriceHistoryService,
    CategoriesService,
    BrandsService,
    AttributesService,
    PriceListService,
    PricingService,
    RulesEngineService,
    CatalogService,
    IdentifiersService,
    CatalogFacade,
    LabelTemplatesService,
    LabelsRenderService,
    LabelsZplService,
    CollectionsService,
  ],
  exports: [
    ProductsService,
    PromotionsService,
    CategoriesService,
    BrandsService,
    AttributesService,
    PriceListService,
    PricingService,
    RulesEngineService,
    CatalogService,
    IdentifiersService,
    PriceHistoryService,
    CatalogFacade,
  ],
})
export class CatalogModule {}
