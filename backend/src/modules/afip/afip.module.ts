import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AfipProducer } from './afip.producer';
import { AfipProcessor } from './afip.processor';
import { AfipController } from './afip.controller';
import { PrismaModule } from '../../core/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    // Redis connection — reads REDIS_HOST/REDIS_PORT from env, falls back to localhost for dev
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
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
  providers: [AfipProducer, AfipProcessor],
  exports: [AfipProducer],
})
export class AfipModule {}
