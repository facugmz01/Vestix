import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';

@Controller('price-lists')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Get()
  @RequirePermissions({ action: 'read', subject: 'Pricing' })
  findAll(@Query('page') page: string, @Query('pageSize') pageSize: string) {
    return this.pricingService.findAll();
  }

  @Get(':id')
  @RequirePermissions({ action: 'read', subject: 'Pricing' })
  findOne(@Param('id') id: string) {
    return this.pricingService.findOne(id);
  }

  @Post()
  @RequirePermissions({ action: 'create', subject: 'Pricing' })
  createPriceList(@Body() dto: any) {
    return this.pricingService.createPriceList(dto);
  }

  @Patch(':id/items/:variantId')
  @RequirePermissions({ action: 'update', subject: 'Pricing' })
  setVariantPrice(
    @Param('id') priceListId: string, 
    @Param('variantId') variantId: string, 
    @Body('overridePrice') overridePrice: number
  ) {
    return this.pricingService.setVariantPrice(priceListId, variantId, overridePrice);
  }
}
