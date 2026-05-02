import { Module, Global } from '@nestjs/common';
import { IdentifiersService } from './identifiers.service';
import { IdentifiersController } from './identifiers.controller';

@Global() // Made global because both Catalog (creation) and Inventory/POS (scanning) need this logic
@Module({
  controllers: [IdentifiersController],
  providers: [IdentifiersService],
  exports: [IdentifiersService],
})
export class IdentifiersModule {}
