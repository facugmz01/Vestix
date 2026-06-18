import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { StorefrontAuthController } from './controllers/storefront-auth.controller';
import { StorefrontCheckoutController } from './controllers/storefront-checkout.controller';
import { StorefrontAuthService } from './services/storefront-auth.service';
import { StorefrontCheckoutService } from './services/storefront-checkout.service';
import { CustomerAuthGuard } from './guards/customer-auth.guard';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'super_secret_dev_key',
      signOptions: { expiresIn: '7d' },
    })
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
