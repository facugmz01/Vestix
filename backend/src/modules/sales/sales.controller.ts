import { Controller, Post, Body, Get } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CheckoutOrchestrator } from './checkout.orchestrator';
import { CreateOrderDto } from './dto/create-order.dto';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';

@Controller('sales')
export class SalesController {
  constructor(
    private readonly salesService: SalesService,
    private readonly checkoutOrchestrator: CheckoutOrchestrator
  ) {}

  @Post('checkout')
  @RequirePermissions({ action: 'create', subject: 'Sales' })
  async checkout(@Body() createOrderDto: CreateOrderDto) {
    return this.checkoutOrchestrator.processCheckout(createOrderDto);
  }

  @Get('returns')
  @RequirePermissions({ action: 'read', subject: 'Sales' })
  async getReturns() {
    return { data: [], total: 0 };
  }

  @Get('orders')
  @RequirePermissions({ action: 'read', subject: 'Sales' })
  async getOrders() {
    return { data: [], total: 0 };
  }
}
