import { Controller, Sse, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../../core/rbac/guards/permissions.guard';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';
import { ShippingService } from './shipping.service';

@Controller('shipping')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class ShippingSseController {
  constructor(private readonly shippingService: ShippingService) {}

  @Sse('orders/:orderId/tracking/live')
  @RequirePermissions({ action: 'read', subject: 'Delivery' })
  trackingLive(@Param('orderId') orderId: string) {
    return this.shippingService.subscribeTracking(orderId);
  }
}
