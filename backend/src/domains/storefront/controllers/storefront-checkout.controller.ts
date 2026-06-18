import { Controller, Post, Body, Req } from '@nestjs/common';
import { StorefrontCheckoutService, CheckoutDto } from '../services/storefront-checkout.service';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';

@Controller('storefront/checkout')
export class StorefrontCheckoutController {
  constructor(
    private readonly checkoutService: StorefrontCheckoutService,
    private readonly jwtService: JwtService
  ) {}

  @Post()
  async processCheckout(@Req() req: Request, @Body() dto: CheckoutDto) {
    let customerId = null;
    try {
      const token = req.cookies?.['storefront_token'] || req.headers.authorization?.split(' ')[1];
      if (token) {
        const payload = await this.jwtService.verifyAsync(token, {
          secret: process.env.JWT_SECRET || 'super_secret_dev_key',
        });
        if (payload.type === 'CUSTOMER') {
          customerId = payload.sub;
        }
      }
    } catch (e) {
      // Ignore token errors, treat as guest
    }
    
    return this.checkoutService.processCheckout(customerId, dto);
  }
}
