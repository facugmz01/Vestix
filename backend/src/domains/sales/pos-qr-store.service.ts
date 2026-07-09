import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../core/redis/redis.service';

export type PosQrPaymentStatus = 'PENDING' | 'APPROVED' | 'EXPIRED' | 'REJECTED';

export interface StoredPosQrOrder {
  orderId: string;
  amount: number;
  title: string;
  qrData: string;
  status: PosQrPaymentStatus;
  createdAt: number;
  mpOrderId?: string;
}

@Injectable()
export class PosQrStoreService {
  private readonly logger = new Logger(PosQrStoreService.name);
  private readonly memoryFallback = new Map<string, StoredPosQrOrder>();
  private static readonly TTL_SECONDS = 15 * 60;
  private static readonly KEY_PREFIX = 'pos:qr:';

  constructor(private readonly redisService: RedisService) {}

  private key(orderId: string) {
    return `${PosQrStoreService.KEY_PREFIX}${orderId}`;
  }

  async save(order: StoredPosQrOrder): Promise<void> {
    try {
      const client = this.redisService.getClient();
      await client.setex(this.key(order.orderId), PosQrStoreService.TTL_SECONDS, JSON.stringify(order));
      return;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'unknown';
      this.logger.warn(`Redis QR store unavailable, using memory fallback: ${message}`);
    }
    this.memoryFallback.set(order.orderId, order);
  }

  async get(orderId: string): Promise<StoredPosQrOrder | null> {
    try {
      const client = this.redisService.getClient();
      const raw = await client.get(this.key(orderId));
      if (raw) return JSON.parse(raw) as StoredPosQrOrder;
    } catch {
      // fall through to memory
    }
    return this.memoryFallback.get(orderId) ?? null;
  }

  async updateStatus(orderId: string, status: PosQrPaymentStatus): Promise<StoredPosQrOrder | null> {
    const order = await this.get(orderId);
    if (!order) return null;
    order.status = status;
    await this.save(order);
    return order;
  }

  async purgeExpired(): Promise<void> {
    const now = Date.now();
    const ttlMs = PosQrStoreService.TTL_SECONDS * 1000;
    for (const [id, order] of this.memoryFallback.entries()) {
      if (now - order.createdAt > ttlMs) {
        this.memoryFallback.delete(id);
      }
    }
  }
}
