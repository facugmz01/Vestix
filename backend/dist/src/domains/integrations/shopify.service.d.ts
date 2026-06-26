import { PrismaService } from '../../core/prisma/prisma.service';
import { SettingsService } from '../../modules/settings/settings.service';
export declare class ShopifyService {
    private readonly prisma;
    private readonly settingsService;
    private readonly logger;
    constructor(prisma: PrismaService, settingsService: SettingsService);
    private getSettings;
    private getClient;
    syncInventory(): Promise<{
        success: boolean;
    }>;
    handleWebhook(topic: string, payload: any): Promise<{
        success: boolean;
    }>;
}
