import { Module, Global } from '@nestjs/common';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { RedisModule } from '../../core/redis/redis.module';
import { ShippingService } from './shipping.service';
import { DeliveryValidationService } from './delivery-validation.service';
import { GeocodingService } from './geocoding.service';
import { CourierService } from './courier.service';
import { ProprioCourierAdapter } from './couriers/proprio.courier';
import { AndreaniCourierAdapter } from './couriers/andreani.courier';
import { MercadoEnviosCourierAdapter } from './couriers/mercado-envios.courier';
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
  providers: [
    ShippingService,
    DeliveryValidationService,
    GeocodingService,
    CourierService,
    ProprioCourierAdapter,
    AndreaniCourierAdapter,
    MercadoEnviosCourierAdapter,
  ],
  exports: [ShippingService, DeliveryValidationService, CourierService],
})
export class ShippingModule {}
