import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { AddBarcodeDto } from './dto/add-barcode.dto';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { RolesGuard } from '../../core/rbac/roles.guard';
import { Roles } from '../../core/rbac/roles.decorator';

@Controller('catalog')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Post('products')
  @Roles('Store Manager', 'E-Commerce Manager')
  createProduct(@Body() dto: CreateProductDto) {
    return this.catalogService.createProduct(dto);
  }

  @Post('products/:id/variants')
  @Roles('Store Manager', 'E-Commerce Manager')
  addVariant(@Param('id') id: string, @Body() dto: CreateVariantDto) {
    return this.catalogService.addVariantToProduct(id, dto);
  }

  @Post('variants/:id/barcodes')
  @Roles('Store Manager', 'E-Commerce Manager')
  addBarcode(@Param('id') id: string, @Body() dto: AddBarcodeDto) {
    return this.catalogService.addBarcodeToVariant(id, dto);
  }

  @Get('pos-sync')
  @Roles('Cashier', 'Store Manager')
  getPosSyncData() {
    return this.catalogService.findAllForPos();
  }
}
