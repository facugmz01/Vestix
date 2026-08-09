import { Module, Global } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { CatalogModule } from '../catalog/catalog.module';

import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { ReturnsController } from './returns/returns.controller';
import { ReturnsService } from './returns/returns.service';
import { OrdersFulfillmentService } from './orders/orders-fulfillment.service';
import { CheckoutOrchestrator } from './checkout.orchestrator';
import { SaleOrderRepository } from './repositories/sale-order.repository';

import { StorefrontController } from './storefront.controller';
import { StorefrontCouponsController } from './storefront-coupons.controller';
import { StorefrontAuthController } from './storefront-auth.controller';
import { PublicReceiptController } from './public-receipt.controller';
import { StorefrontJwtStrategy } from './storefront-jwt.strategy';
import { StorefrontCustomerIdentityService } from './storefront-customer-identity.service';
import { MercadoPagoService } from './mercadopago.service';

import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';

import { PosService } from './pos.service';
import { PosQrStoreService } from './pos-qr-store.service';
import { PosController } from './pos.controller';
import { PosWebhooksController } from './pos-webhooks.controller';
import { CashRegistersController } from './cash-registers.controller';

import { SyncEngineService } from './sync-engine.service';
import { ConflictResolutionService } from './conflict-resolution.service';
import { LoyaltyService } from './loyalty/loyalty.service';
import { LoyaltyController } from './loyalty/loyalty.controller';
import { GiftCardsService } from './gift-cards/gift-cards.service';
import { GiftCardsController } from './gift-cards/gift-cards.controller';
import { PublicGiftCardController } from './gift-cards/public-gift-card.controller';
import { OfflineController } from './offline.controller';


@Global()
@Module({
  imports: [
    CatalogModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [
    SalesController,
    ReturnsController,
    StorefrontController,
    StorefrontCouponsController,
    StorefrontAuthController,
    PublicReceiptController,
    CustomersController,
    PosController,
    PosWebhooksController,
    CashRegistersController,
    OfflineController,
    LoyaltyController,
    GiftCardsController,
    PublicGiftCardController,
  ],
  providers: [
    SalesService,
    ReturnsService,
    OrdersFulfillmentService,
    CheckoutOrchestrator,
    StorefrontJwtStrategy,
    StorefrontCustomerIdentityService,
    MercadoPagoService,
    CustomersService,
    PosService,
    PosQrStoreService,
    SyncEngineService,
    ConflictResolutionService,
    SaleOrderRepository,
    LoyaltyService,
    GiftCardsService,
  ],
  exports: [
    SalesService,
    ReturnsService,
    OrdersFulfillmentService,
    CheckoutOrchestrator,
    CustomersService,
    PosService,
    SyncEngineService,
    SaleOrderRepository,
    MercadoPagoService,
    LoyaltyService,
    GiftCardsService,
    StorefrontCustomerIdentityService,
  ],
})
export class SalesModule {}
