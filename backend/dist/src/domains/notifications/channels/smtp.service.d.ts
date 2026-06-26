import { SettingsService } from '../../../modules/settings/settings.service';
export declare class SmtpService {
    private readonly settingsService;
    private readonly logger;
    constructor(settingsService: SettingsService);
    send(to: string, subject: string, body: string): Promise<{
        success: boolean;
    }>;
}
