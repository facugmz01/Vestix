import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { RolesGuard } from '../../core/rbac/roles.guard';
import { Roles } from '../../core/rbac/roles.decorator';

@Controller('sales')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post('checkout')
  @Roles('Cashier', 'Store Manager')
  async createSale(@Body() dto: CreateSaleDto) {
    const order = await this.salesService.createSale(dto);
    return {
      status: 'SUCCESS',
      order,
    };
  }
}
