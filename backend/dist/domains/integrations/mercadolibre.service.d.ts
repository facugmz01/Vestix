import { PrismaService } from '../../core/prisma/prisma.service';
import { SettingsService } from '../../modules/settings/settings.service';
export declare class MercadoLibreService {
    private readonly prisma;
    private readonly settingsService;
    private readonly logger;
    constructor(prisma: PrismaService, settingsService: SettingsService);
    private getSettings;
    authenticate(): Promise<string>;
    syncProducts(): Promise<{
        success: boolean;
    }>;
    handleWebhook(topic: string, resource: string): Promise<{
        success: boolean;
    }>;
}
