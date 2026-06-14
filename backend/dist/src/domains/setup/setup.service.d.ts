import { PrismaService } from '../../core/prisma/prisma.service';
import { SettingsService } from '../../modules/settings/settings.service';
export declare class SetupService {
    private readonly prisma;
    private readonly settingsService;
    constructor(prisma: PrismaService, settingsService: SettingsService);
    isSystemInitialized(): Promise<boolean>;
    isCompanyConfigured(): Promise<boolean>;
    createSuperAdmin(data: {
        email: string;
        password: string;
        fullName: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    saveCompanyInfo(data: {
        companyName: string;
        cuit?: string;
        address?: string;
        phone?: string;
        email?: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
}
