import { Queue } from 'bullmq';
export declare class AfipController {
    private readonly invoiceQueue;
    constructor(invoiceQueue: Queue);
    getFailedJobs(): Promise<{
        id: string;
        name: string;
        data: any;
        failedReason: string;
        attemptsMade: number;
        failedAt: string;
    }[]>;
    retryJob(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
