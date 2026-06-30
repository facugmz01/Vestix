import { SettingsService } from '../../../modules/settings/settings.service';
export declare class WhatsAppOpenWaService {
    private readonly settingsService;
    private readonly logger;
    constructor(settingsService: SettingsService);
    sendText(phone: string, message: string, isOtp?: boolean): Promise<{
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
