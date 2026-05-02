import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class AfipProducer {
  constructor(
    @InjectQueue('afip_invoices') private readonly invoiceQueue: Queue,
  ) {}

  /**
   * Fires the job into Redis and immediately returns.
   * Completely decouples the POS from external API latency.
   */
  async enqueueInvoiceGeneration(orderId: string, branchId: string) {
    await this.invoiceQueue.add('generate_invoice', { orderId, branchId }, {
      jobId: `invoice_${orderId}`, // Idempotency key: prevents double-queueing
    });
  }
}
