import { Module, Global } from '@nestjs/common';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { RedisModule } from '../../core/redis/redis.module';
import { ShippingService } from './shipping.service';
import { DeliveryValidationService } from './delivery-validation.service';
import { ShippingController } from './shipping.controller';
import { StorefrontTrackingController } from './storefront-tracking.controller';

@Global()
@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [ShippingController, StorefrontTrackingController],
  providers: [ShippingService, DeliveryValidationService],
  exports: [ShippingService, DeliveryValidationService],
})
export class ShippingModule {}
