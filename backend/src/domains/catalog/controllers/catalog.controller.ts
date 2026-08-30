import { Controller, Get, Post, Body, Patch, Param, ParseUUIDPipe, Query, Delete, UseGuards, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ProductsService } from '../services/products.service';
import { MediaService } from '../services/media.service';
import { PriceHistoryService } from '../services/price-history.service';
import { CategoriesService, BrandsService, AttributesService, PriceListService } from '../services/taxonomy.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { CreateBrandDto } from '../dto/create-brand.dto';
import { CreateAttributeDto } from '../dto/create-attribute.dto';
import { CreatePriceListDto } from '../dto/create-price-list.dto';
import { UpdatePriceListDto } from '../dto/update-price-list.dto';
import { BulkValidateDto, BulkImportDto } from '../dto/bulk-product.dto';
import { BulkUpdatePricesDto } from '../dto/bulk-update-prices.dto';
import { RequirePermissions } from '../../../core/rbac/decorators/require-permissions.decorator';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../../../core/rbac/guards/permissions.guard';
import { PricingService } from '../pricing.service';

@Controller('categories')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
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

  @Patch(':id')
  @RequirePermissions({ action: 'update', subject: 'Catalog' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: any) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions({ action: 'delete', subject: 'Catalog' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.delete(id);
  }
}

@Controller('brands')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
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

  @Patch(':id')
  @RequirePermissions({ action: 'update', subject: 'Catalog' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: any) {
    return this.brandsService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions({ action: 'delete', subject: 'Catalog' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.brandsService.delete(id);
  }
}

@Controller('products')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly mediaService: MediaService,
    private readonly priceHistoryService: PriceHistoryService,
  ) {}

  @Post()
  @RequirePermissions({ action: 'create', subject: 'Catalog' })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Post('bulk-validate')
  @RequirePermissions({ action: 'create', subject: 'Catalog' })
  bulkValidate(@Body() dto: BulkValidateDto) {
    return this.productsService.bulkValidate(dto);
  }

  @Post('bulk-import')
  @RequirePermissions({ action: 'create', subject: 'Catalog' })
  bulkImport(@Body() dto: BulkImportDto) {
    return this.productsService.bulkImport(dto);
  }

  @Post('bulk-update-prices')
  @RequirePermissions({ action: 'update', subject: 'Catalog' })
  bulkUpdatePrices(@Body() dto: BulkUpdatePricesDto) {
    return this.productsService.bulkUpdatePrices(dto);
  }

  @Post('clear')
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  clearCatalog() {
    return this.productsService.clearCatalog();
  }

  @Post(':id/duplicate')
  @RequirePermissions({ action: 'create', subject: 'Catalog' })
  duplicate(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.duplicate(id);
  }

  @Get(':id/publish-readiness')
  @RequirePermissions({ action: 'read', subject: 'Catalog' })
  publishReadiness(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.getPublishReadiness(id);
  }

  @Post('migrate-base64-images')
  @RequirePermissions({ action: 'manage', subject: 'Settings' })
  migrateBase64Images() {
    return this.mediaService.migrateBase64Images();
  }

  @Post('bulk-publish-all')
  @RequirePermissions({ action: 'update', subject: 'Catalog' })
  publishAll() {
    return this.productsService.publishAll();
  }

  @Get()
  @RequirePermissions({ action: 'read', subject: 'Catalog' })
  findAll(@Query() query: any) {
    return this.productsService.findAll(query);
  }

  @Get('price-check')
  @RequirePermissions({ action: 'read', subject: 'Catalog' })
  priceCheck(
    @Query('code') code: string,
    @Query('q') q?: string,
    @Query('branchId') branchId?: string,
    @Query('priceListId') priceListId?: string,
    @Query('customerId') customerId?: string,
  ) {
    const raw = code || q || '';
    return this.productsService.priceCheck(raw, { branchId, priceListId, customerId });
  }

  @Get(':id/price-history')
  @RequirePermissions({ action: 'read', subject: 'Catalog' })
  getPriceHistory(@Param('id', ParseUUIDPipe) id: string) {
    return this.priceHistoryService.getByProduct(id);
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

  @Post(':id/images')
  @RequirePermissions({ action: 'update', subject: 'Catalog' })
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/products',
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `product-${unique}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          return cb(new BadRequestException('Only image files are allowed') as any, false);
        }
        cb(null, true);
      },
    }),
  )
  uploadProductImage(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.mediaService.addProductImage(id, file);
  }

  @Delete(':id/images')
  @RequirePermissions({ action: 'update', subject: 'Catalog' })
  deleteProductImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('url') url: string,
  ) {
    return this.mediaService.removeProductImage(id, url);
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
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class VariantsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @RequirePermissions({ action: 'read', subject: 'Catalog' })
  findAll(@Query('search') search?: string) {
    return this.productsService.findAllVariants(search);
  }

  @Get(':id')
  @RequirePermissions({ action: 'read', subject: 'Catalog' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findOneVariant(id);
  }

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
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
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

  @Patch(':id')
  @RequirePermissions({ action: 'update', subject: 'Catalog' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() data: any) {
    return this.attributesService.update(id, data);
  }

  @Delete(':id')
  @RequirePermissions({ action: 'delete', subject: 'Catalog' })
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.attributesService.delete(id);
  }
}

@Controller('price-lists')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class PriceListController {
  constructor(
    private readonly priceListService: PriceListService,
    private readonly pricingService: PricingService,
  ) {}

  @Get()
  @RequirePermissions({ action: 'read', subject: 'Catalog' })
  findAll(@Query() query: any) {
    return this.priceListService.findAllPaged(query);
  }

  @Get(':id')
  @RequirePermissions({ action: 'read', subject: 'Catalog' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.priceListService.findOne(id);
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

  @Get(':priceListId/items')
  @RequirePermissions({ action: 'read', subject: 'Catalog' })
  getItems(
    @Param('priceListId', ParseUUIDPipe) priceListId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const ps = pageSize ? parseInt(pageSize, 10) : 20;
    return this.priceListService.findItems(priceListId, p, ps);
  }

  @Patch(':priceListId/items/:variantId')
  @RequirePermissions({ action: 'update', subject: 'Catalog' })
  updateItemPrice(
    @Param('priceListId', ParseUUIDPipe) priceListId: string,
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Body('overridePrice') overridePrice: number,
  ) {
    return this.pricingService.setVariantPrice(priceListId, variantId, overridePrice);
  }

  @Post(':priceListId/assign-customers')
  @RequirePermissions({ action: 'update', subject: 'Catalog' })
  assignCustomers(
    @Param('priceListId', ParseUUIDPipe) priceListId: string,
    @Body('customerIds') customerIds: string[],
  ) {
    return this.priceListService.assignToCustomers(priceListId, customerIds);
  }
}
