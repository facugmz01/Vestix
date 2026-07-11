import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { IntegrationsService } from '../../domains/integrations/integrations.service';

@Injectable()
export class OutboxProcessorService {
  private readonly logger = new Logger(OutboxProcessorService.name);
  private isProcessing = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly integrationsService: IntegrationsService,
  ) {}

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
        return;
      }

      this.logger.log(`Processing ${events.length} outbox events...`);

      for (const event of events) {
        try {
          const handled = await this.dispatchEvent(event);

          if (!handled) {
            this.logger.debug(
              `Outbox event ${event.id} (${event.type}) has no handler — remains PENDING`,
            );
            continue;
          }

          await this.prisma.outboxEvent.update({
            where: { id: event.id },
            data: {
              status: 'PROCESSED',
              processedAt: new Date(),
              attempts: { increment: 1 },
            },
          });
        } catch (error: any) {
          this.logger.error(`Failed to process event ${event.id}: ${error.message}`);
          await this.prisma.outboxEvent.update({
            where: { id: event.id },
            data: {
              status: 'FAILED',
              lastError: error.message,
              attempts: { increment: 1 },
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

  /**
   * Dispatches a single outbox event to internal handlers.
   * Returns true when the handler ran (event may be marked PROCESSED); false when no handler exists.
   */
  private async dispatchEvent(event: {
    id: string;
    type: string;
    aggregate: string;
    aggregateId: string;
    payload: unknown;
  }): Promise<boolean> {
    const payload = (event.payload ?? {}) as Record<string, unknown>;

    switch (event.type) {
      case 'STOCK_MOVEMENT_RECORDED': {
        const variantId = payload.variantId as string | undefined;
        if (!variantId) {
          this.logger.warn(`STOCK_MOVEMENT_RECORDED event ${event.id} missing variantId`);
          return true;
        }

        const stockLevels = await this.prisma.stockLevel.findMany({
          where: { variantId },
        });
        const available = stockLevels.reduce((sum, sl) => sum + sl.availableQuantity, 0);

        await this.integrationsService.syncStockToWooCommerce(variantId, available);
        await this.integrationsService.syncStockToShopify(variantId, available);
        this.logger.debug(
          `STOCK_MOVEMENT_RECORDED: queued WC stock sync for variant ${variantId} (${available} units)`,
        );
        return true;
      }

      case 'ORDER_CREATED':
      case 'ORDER_CONFIRMED':
        // Notifications and finance are handled inline at checkout — no external dispatch here.
        this.logger.debug(
          `Outbox event ${event.type} for ${event.aggregateId} handled internally (no external dispatch)`,
        );
        return true;

      default:
        return false;
    }
  }
}
