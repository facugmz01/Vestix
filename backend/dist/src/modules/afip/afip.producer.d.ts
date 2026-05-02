import { Queue } from 'bullmq';
export declare class AfipProducer {
    private readonly invoiceQueue;
    constructor(invoiceQueue: Queue);
    enqueueInvoiceGeneration(orderId: string, branchId: string): Promise<void>;
}
