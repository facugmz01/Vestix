import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
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
}
