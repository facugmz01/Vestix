import { Module } from '@nestjs/common';
import { PosService } from './pos.service';
import { PosController } from './pos.controller';
import { CashRegistersController } from './cash-registers.controller';
import { SalesModule } from '../sales/sales.module';

@Module({
  imports: [SalesModule], // Explicitly imports SalesModule to wrap the quick-sale checkout logic
  controllers: [PosController, CashRegistersController],
  providers: [PosService],
})
export class PosModule {}
