import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { StorefrontAuthController } from './controllers/storefront-auth.controller';
import { StorefrontCheckoutController } from './controllers/storefront-checkout.controller';
import { StorefrontAuthService } from './services/storefront-auth.service';
import { StorefrontCheckoutService } from './services/storefront-checkout.service';
import { CustomerAuthGuard } from './guards/customer-auth.guard';

@Module({
  imports: [
    // Although JwtModule is registered globally in IdentityModule, it doesn't hurt 
    // to register it here, but we can rely on the global one for verifyAsync since 
    // we use the same secret. The Service uses it directly.
  ],
  controllers: [
    StorefrontAuthController,
    StorefrontCheckoutController
  ],
  providers: [
    StorefrontAuthService,
    StorefrontCheckoutService,
    CustomerAuthGuard
  ],
  exports: [
    StorefrontAuthService,
    StorefrontCheckoutService
  ]
})
export class StorefrontModule {}
