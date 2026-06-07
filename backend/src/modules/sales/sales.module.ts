import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { ReturnsController } from './returns/returns.controller';
import { ReturnsService } from './returns/returns.service';
import { OrdersFulfillmentService } from './orders/orders-fulfillment.service';
import { CheckoutOrchestrator } from './checkout.orchestrator';
import { AfipModule } from '../afip/afip.module';

import { StorefrontController } from './storefront.controller';
import { StorefrontAuthController } from './storefront-auth.controller';
import { StorefrontJwtStrategy } from './storefront-jwt.strategy';
import { MercadoPagoService } from './mercadopago.service';

@Module({
  imports: [
    AfipModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'fallback_secret_for_dev_only',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [
    SalesController,
    ReturnsController,
    StorefrontController,
    StorefrontAuthController,
  ],
  providers: [
    SalesService,
    ReturnsService,
    OrdersFulfillmentService,
    CheckoutOrchestrator,
    StorefrontJwtStrategy,
    MercadoPagoService,
  ],
  exports: [SalesService, ReturnsService, OrdersFulfillmentService, CheckoutOrchestrator],
})
export class SalesModule {}
