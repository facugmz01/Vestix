import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { PermissionsGuard } from '../../core/rbac/guards/permissions.guard';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';

/**
 * @deprecated Superseded by domains/sales SalesController (`POST /sales/checkout`).
 * Not registered in AppModule.
 */
@Controller('sales')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post('checkout')
  @RequirePermissions({ action: 'create', subject: 'Sales' })
  async createSale(@Body() dto: CreateSaleDto) {
    const order = await this.salesService.createSale(dto);
    return {
      status: 'SUCCESS',
      order,
    };
  }
}
