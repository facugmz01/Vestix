import { Module, Global } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { PricingController } from './pricing.controller';
import { PromotionsController } from './promotions.controller';
import { RulesEngineService } from './rules-engine.service';

@Global()
@Module({
  controllers: [PricingController, PromotionsController],
  providers: [PricingService, RulesEngineService],
  exports: [PricingService, RulesEngineService],
})
export class PricingModule {}
