import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../core/prisma/prisma.service';
export declare class AfipProcessor extends WorkerHost {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    process(job: Job<any>): Promise<{
        status: string;
        cae: string;
    } | {
        status: string;
        cae?: undefined;
    }>;
    private processInvoice;
    private processCreditNote;
}
