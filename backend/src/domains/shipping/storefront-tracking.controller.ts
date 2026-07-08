import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
  Sse,
} from '@nestjs/common';
import { Request } from 'express';
import { StorefrontAuthGuard } from '../sales/storefront-auth.guard';
import { ShippingService } from './shipping.service';
import { CompleteDeliveryDto } from './dto/complete-delivery.dto';

@Controller('storefront')
export class StorefrontTrackingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Get('my-orders/:id/tracking')
  @UseGuards(StorefrontAuthGuard)
  getTracking(@Param('id') id: string, @Req() req: Request) {
    const customerId = (req as any).user.customerId;
    return this.shippingService.getTrackingForCustomer(id, customerId);
  }

  @Sse('my-orders/:id/tracking/live')
  @UseGuards(StorefrontAuthGuard)
  trackingLive(@Param('id') id: string) {
    return this.shippingService.subscribeTracking(id);
  }

  @Post('my-orders/:id/confirm-delivery')
  @UseGuards(StorefrontAuthGuard)
  async confirmDelivery(
    @Param('id') id: string,
    @Body() dto: CompleteDeliveryDto,
    @Req() req: Request,
  ) {
    const customerId = (req as any).user.customerId;
    await this.shippingService.getTrackingForCustomer(id, customerId);
    return this.shippingService.completeDelivery(id, dto, 'CUSTOMER');
  }
}
