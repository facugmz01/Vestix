import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { StorefrontCheckoutController } from './controllers/storefront-checkout.controller';
import { StorefrontCheckoutService } from './services/storefront-checkout.service';
import { CustomerAuthGuard } from './guards/customer-auth.guard';
import { CatalogModule } from '../catalog/catalog.module';

@Module({
  imports: [
    CatalogModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'super_secret_dev_key',
      signOptions: { expiresIn: '7d' },
    })
  ],
  controllers: [
    StorefrontCheckoutController
  ],
  providers: [
    StorefrontCheckoutService,
    CustomerAuthGuard
  ],
  exports: [
    StorefrontCheckoutService
  ]
})
export class StorefrontModule {}
