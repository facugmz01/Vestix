import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OutboxProcessorService {
  private readonly logger = new Logger(OutboxProcessorService.name);
  private isProcessing = false;

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async processOutboxEvents() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const events = await this.prisma.outboxEvent.findMany({
        where: { status: 'PENDING' },
        take: 50,
        orderBy: { createdAt: 'asc' },
      });

      if (events.length === 0) {
        this.isProcessing = false;
        return;
      }

      this.logger.log(`Processing ${events.length} outbox events...`);

      for (const event of events) {
        try {
          // Here we would typically dispatch to RabbitMQ/Kafka or BullMQ
          // For now we simulate successful dispatch to external services
          
          this.logger.debug(`Dispatching event: ${event.type} for aggregate ${event.aggregate} (${event.aggregateId})`);
          
          // Mark as processed
          await this.prisma.outboxEvent.update({
            where: { id: event.id },
            data: { 
              status: 'PROCESSED',
              processedAt: new Date(),
              attempts: { increment: 1 }
            },
          });
        } catch (error: any) {
          this.logger.error(`Failed to process event ${event.id}: ${error.message}`);
          await this.prisma.outboxEvent.update({
            where: { id: event.id },
            data: { 
              status: 'FAILED',
              lastError: error.message,
              attempts: { increment: 1 }
            },
          });
        }
      }
    } catch (error: any) {
      this.logger.error(`Outbox processing failed: ${error.message}`);
    } finally {
      this.isProcessing = false;
    }
  }
}
