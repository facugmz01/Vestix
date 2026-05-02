import { Controller, Get, Post, Body, Patch, Param, ParseUUIDPipe, Query, Delete } from '@nestjs/common';
import { ProductsService } from '../services/products.service';
import { CategoriesService, BrandsService, AttributesService, PriceListService } from '../services/taxonomy.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { CreateBrandDto } from '../dto/create-brand.dto';
import { CreateAttributeDto } from '../dto/create-attribute.dto';
import { CreatePriceListDto } from '../dto/create-price-list.dto';
import { UpdatePriceListDto } from '../dto/update-price-list.dto';
import { RequirePermissions } from '../../../core/rbac/decorators/require-permissions.decorator';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @RequirePermissions({ action: 'create', subject: 'Catalog' })
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @RequirePermissions({ action: 'read', subject: 'Catalog' })
  findAll() {
    return this.categoriesService.findAll();
  }
}

@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Post()
  @RequirePermissions({ action: 'create', subject: 'Catalog' })
  create(@Body() createBrandDto: CreateBrandDto) {
    return this.brandsService.create(createBrandDto);
  }

  @Get()
  @RequirePermissions({ action: 'read', subject: 'Catalog' })
  findAll() {
    return this.brandsService.findAll();
  }
}

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @RequirePermissions({ action: 'create', subject: 'Catalog' })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  @RequirePermissions({ action: 'read', subject: 'Catalog' })
  findAll(@Query() query: any) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions({ action: 'read', subject: 'Catalog' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findOne(id);
  }

  @Get(':id/variants')
  @RequirePermissions({ action: 'read', subject: 'Catalog' })
  findVariants(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findVariants(id);
  }

  @Post(':id/variants')
  @RequirePermissions({ action: 'create', subject: 'Catalog' })
  createVariant(@Param('id', ParseUUIDPipe) id: string, @Body() data: any) {
    return this.productsService.createVariant(id, data);
  }

  @Post(':id/variants/generate')
  @RequirePermissions({ action: 'create', subject: 'Catalog' })
  generateCombinations(@Param('id', ParseUUIDPipe) id: string, @Body() dto: any) {
    return this.productsService.generateCombinations(id, dto);
  }

  @Patch(':id')
  @RequirePermissions({ action: 'update', subject: 'Catalog' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @RequirePermissions({ action: 'delete', subject: 'Catalog' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.remove(id);
  }
}

@Controller('variants')
export class VariantsController {
  constructor(private readonly productsService: ProductsService) {}

  @Patch(':id')
  @RequirePermissions({ action: 'update', subject: 'Catalog' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() data: any) {
    return this.productsService.updateVariant(id, data);
  }

  @Delete(':id')
  @RequirePermissions({ action: 'delete', subject: 'Catalog' })
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.deleteVariant(id);
  }
}

@Controller('attributes')
export class AttributesController {
  constructor(private readonly attributesService: AttributesService) {}

  @Get()
  @RequirePermissions({ action: 'read', subject: 'Catalog' })
  findAll() {
    return this.attributesService.findAll();
  }

  @Post()
  @RequirePermissions({ action: 'create', subject: 'Catalog' })
  create(@Body() data: CreateAttributeDto) {
    return this.attributesService.create(data);
  }

  @Delete(':id')
  @RequirePermissions({ action: 'delete', subject: 'Catalog' })
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.attributesService.delete(id);
  }
}

@Controller('pricing')
export class PriceListController {
  constructor(private readonly priceListService: PriceListService) {}

  @Get()
  @RequirePermissions({ action: 'read', subject: 'Catalog' })
  findAll() {
    return this.priceListService.findAll();
  }

  @Post()
  @RequirePermissions({ action: 'create', subject: 'Catalog' })
  create(@Body() data: CreatePriceListDto) {
    return this.priceListService.create(data);
  }

  @Patch(':id')
  @RequirePermissions({ action: 'update', subject: 'Catalog' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() data: UpdatePriceListDto) {
    return this.priceListService.update(id, data);
  }

  @Delete(':id')
  @RequirePermissions({ action: 'delete', subject: 'Catalog' })
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.priceListService.delete(id);
  }
}
