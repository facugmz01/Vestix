import { SettingsService } from '../../../modules/settings/settings.service';
export declare class WhatsAppEvolutionService {
    private readonly settingsService;
    private readonly logger;
    constructor(settingsService: SettingsService);
    private getConfig;
    sendText(phone: string, message: string): Promise<{
        success: boolean;
        error: string;
    } | {
        success: boolean;
        error?: undefined;
    }>;
    getStatus(): Promise<{
        isReady: boolean;
        qrCode: any;
    }>;
}
