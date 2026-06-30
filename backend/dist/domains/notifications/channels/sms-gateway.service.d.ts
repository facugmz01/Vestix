import { SettingsService } from '../../../modules/settings/settings.service';
export declare class SmsGatewayService {
    private readonly settingsService;
    private readonly logger;
    constructor(settingsService: SettingsService);
    sendSms(phone: string, message: string): Promise<{
        success: boolean;
        error: string;
    } | {
        success: boolean;
        error?: undefined;
    }>;
}
