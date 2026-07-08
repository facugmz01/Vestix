import { Controller, Get, Post, Body, Param, Sse } from '@nestjs/common';
import { ShippingService } from './shipping.service';

@Controller('track')
export class PublicTrackingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Get(':token')
  getPublicTracking(@Param('token') token: string) {
    return this.shippingService.getPublicTracking(token);
  }

  @Sse(':token/live')
  publicTrackingLive(@Param('token') token: string) {
    return this.shippingService.subscribeTrackingByToken(token);
  }
}
