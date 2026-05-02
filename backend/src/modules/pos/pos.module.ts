import { Module } from '@nestjs/common';
import { PosService } from './pos.service';
import { PosController } from './pos.controller';
import { CashRegistersController } from './cash-registers.controller';
import { SalesModule } from '../sales/sales.module';
import { PrismaModule } from '../../core/prisma/prisma.module';

@Module({
  imports: [SalesModule, PrismaModule],
  controllers: [PosController, CashRegistersController],
  providers: [PosService],
})
export class PosModule {}
