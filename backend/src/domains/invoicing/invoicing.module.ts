import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { InvoicingService } from './invoicing.service';
import { AfipService } from './afip.service';
import { AfipProducer } from './afip.producer';
import { AfipProcessor } from './afip.processor';
import { AfipController } from './afip.controller';
import { PrismaModule } from '../../core/prisma/prisma.module';

@Global()
@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: 'afip_invoices',
      defaultJobOptions: {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 30000, // 30s → 60s → 120s → 240s → 480s
        },
        removeOnComplete: true, // Keep Redis clean
        removeOnFail: false,    // Keep failed jobs for manual review in Bull Board
      },
    }),
  ],
  controllers: [AfipController],
  providers: [InvoicingService, AfipService, AfipProducer, AfipProcessor],
  exports: [InvoicingService, AfipProducer],
})
export class InvoicingModule {}
