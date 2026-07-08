import { Module, Global } from '@nestjs/common';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { RedisModule } from '../../core/redis/redis.module';
import { ShippingService } from './shipping.service';
import { DeliveryValidationService } from './delivery-validation.service';
import { GeocodingService } from './geocoding.service';
import { ShippingController } from './shipping.controller';
import { ShippingSseController } from './shipping-sse.controller';
import { StorefrontTrackingController } from './storefront-tracking.controller';
import { PublicTrackingController } from './public-tracking.controller';
import { DriverController } from './driver.controller';

@Global()
@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [
    ShippingController,
    ShippingSseController,
    StorefrontTrackingController,
    PublicTrackingController,
    DriverController,
  ],
  providers: [ShippingService, DeliveryValidationService, GeocodingService],
  exports: [ShippingService, DeliveryValidationService],
})
export class ShippingModule {}
