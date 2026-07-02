import { PrismaService } from '../prisma/prisma.service';
export declare class OutboxProcessorService {
    private prisma;
    private readonly logger;
    private isProcessing;
    constructor(prisma: PrismaService);
    processOutboxEvents(): Promise<void>;
}
