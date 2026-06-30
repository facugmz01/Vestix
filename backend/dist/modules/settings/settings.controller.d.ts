import { SettingsService } from './settings.service';
import { UpdateSettingsDto, TestSmtpDto, TestSmsDto, TestWhatsappDto, TestPushDto } from './dto/settings.dto';
export declare class SettingsController {
    private readonly settingsService;
    constructor(settingsService: SettingsService);
    getSettings(): Promise<any>;
    patchSection(section: string, body: Record<string, any>, req: any): Promise<any>;
    updateAllSettings(dto: UpdateSettingsDto, req: any): Promise<any>;
    testAfipConnection(): Promise<{
        success: boolean;
        message: string;
    }>;
    testSmtpConnection(dto: TestSmtpDto): Promise<{
        success: boolean;
        message: string;
    }>;
    testSmsConnection(dto: TestSmsDto): Promise<{
        success: boolean;
        message: string;
    }>;
    testWhatsappConnection(dto: TestWhatsappDto): Promise<{
        success: boolean;
        message: string;
    }>;
    testPushConnection(dto: TestPushDto): Promise<{
        success: boolean;
        message: string;
    }>;
    uploadLogo(file: Express.Multer.File, req: any): Promise<{
        logoUrl: string;
    }>;
}
