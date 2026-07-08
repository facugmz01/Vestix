import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
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

  @Post('my-orders/:id/confirm-delivery')
  @UseGuards(StorefrontAuthGuard)
  confirmDelivery(
    @Param('id') id: string,
    @Body() dto: CompleteDeliveryDto,
    @Req() req: Request,
  ) {
    const customerId = (req as any).user.customerId;
    // Ownership check via getTrackingForCustomer
    return this.shippingService.getTrackingForCustomer(id, customerId).then(() =>
      this.shippingService.completeDelivery(id, dto, 'CUSTOMER'),
    );
  }
}
