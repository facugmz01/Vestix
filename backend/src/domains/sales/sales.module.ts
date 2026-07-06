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
import { StorefrontAuthController } from './storefront-auth.controller';
import { StorefrontJwtStrategy } from './storefront-jwt.strategy';
import { MercadoPagoService } from './mercadopago.service';

import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';

import { PosService } from './pos.service';
import { PosController } from './pos.controller';
import { CashRegistersController } from './cash-registers.controller';

import { SyncEngineService } from './sync-engine.service';
import { ConflictResolutionService } from './conflict-resolution.service';
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
    StorefrontAuthController,
    CustomersController,
    PosController,
    CashRegistersController,
    OfflineController,
  ],
  providers: [
    SalesService,
    ReturnsService,
    OrdersFulfillmentService,
    CheckoutOrchestrator,
    StorefrontJwtStrategy,
    MercadoPagoService,
    CustomersService,
    PosService,
    SyncEngineService,
    ConflictResolutionService,
    SaleOrderRepository,
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
  ],
})
export class SalesModule {}
