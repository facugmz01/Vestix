import { PrismaService } from '../../core/prisma/prisma.service';
export declare class ShopifyService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    private getSettings;
    private getClient;
    syncInventory(): Promise<{
        success: boolean;
    }>;
    handleWebhook(topic: string, payload: any): Promise<{
        success: boolean;
    }>;
}
