import { Module } from '@nestjs/common';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { ProductsService } from './services/products.service';
import { CategoriesService, BrandsService, AttributesService, PriceListService } from './services/taxonomy.service';
import { ProductsController, CategoriesController, BrandsController, VariantsController, AttributesController, PriceListController } from './controllers/catalog.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ProductsController, CategoriesController, BrandsController, VariantsController, AttributesController, PriceListController],
  providers: [ProductsService, CategoriesService, BrandsService, AttributesService, PriceListService],
  exports: [ProductsService], // Exported so Sales/Inventory can reference Products
})
export class ProductsModule {}
