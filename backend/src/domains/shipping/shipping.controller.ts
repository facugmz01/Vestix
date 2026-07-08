import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../../core/rbac/guards/permissions.guard';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';
import { ShippingService } from './shipping.service';
import { DispatchDeliveryDto } from './dto/dispatch-delivery.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { CompleteDeliveryDto } from './dto/complete-delivery.dto';

@Controller('shipping')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Get('deliveries')
  @RequirePermissions({ action: 'read', subject: 'Delivery' })
  listDeliveries(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.shippingService.listDeliveries({
      status,
      page: parseInt(page || '1'),
      pageSize: parseInt(pageSize || '20'),
    });
  }

  @Get('orders/:orderId')
  @RequirePermissions({ action: 'read', subject: 'Delivery' })
  getOrderShipping(@Param('orderId') orderId: string) {
    return this.shippingService.getShippingByOrderId(orderId);
  }

  @Post('orders/:orderId/pick')
  @RequirePermissions({ action: 'manage', subject: 'Delivery' })
  startPicking(@Param('orderId') orderId: string) {
    return this.shippingService.startPicking(orderId);
  }

  @Post('orders/:orderId/pack')
  @RequirePermissions({ action: 'manage', subject: 'Delivery' })
  markPacked(@Param('orderId') orderId: string) {
    return this.shippingService.markPacked(orderId);
  }

  @Post('orders/:orderId/dispatch')
  @RequirePermissions({ action: 'manage', subject: 'Delivery' })
  dispatch(@Param('orderId') orderId: string, @Body() dto: DispatchDeliveryDto) {
    return this.shippingService.dispatch(orderId, dto);
  }

  @Post('orders/:orderId/location')
  @RequirePermissions({ action: 'manage', subject: 'Delivery' })
  updateLocation(@Param('orderId') orderId: string, @Body() dto: UpdateLocationDto) {
    return this.shippingService.updateLocation(orderId, dto);
  }

  @Post('orders/:orderId/arrive')
  @RequirePermissions({ action: 'manage', subject: 'Delivery' })
  markArrived(@Param('orderId') orderId: string) {
    return this.shippingService.markArrived(orderId);
  }

  @Post('orders/:orderId/complete')
  @RequirePermissions({ action: 'manage', subject: 'Delivery' })
  completeDelivery(@Param('orderId') orderId: string, @Body() dto: CompleteDeliveryDto) {
    return this.shippingService.completeDelivery(orderId, dto, 'ADMIN');
  }

  @Post('orders/:orderId/complete-manual')
  @RequirePermissions({ action: 'manage', subject: 'Delivery' })
  completeManual(@Param('orderId') orderId: string, @Body() body: { notes?: string }) {
    return this.shippingService.completeDeliveryManual(orderId, body.notes);
  }
}
