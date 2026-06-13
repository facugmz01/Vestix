import { PrismaService } from '../../core/prisma/prisma.service';
export declare class MercadoLibreService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    private getSettings;
    authenticate(): Promise<string>;
    syncProducts(): Promise<{
        success: boolean;
    }>;
    handleWebhook(topic: string, resource: string): Promise<{
        success: boolean;
    }>;
}
