import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/settings.dto';
export declare class SettingsController {
    private readonly settingsService;
    constructor(settingsService: SettingsService);
    getSettings(): Promise<{
        id: string;
        general: import(".prisma/client").Prisma.JsonValue;
        pricing: import(".prisma/client").Prisma.JsonValue;
        skuBarcode: import(".prisma/client").Prisma.JsonValue;
        invoicing: import(".prisma/client").Prisma.JsonValue;
        notifications: import(".prisma/client").Prisma.JsonValue;
        integrations: import(".prisma/client").Prisma.JsonValue;
        offline: import(".prisma/client").Prisma.JsonValue;
        pos: import(".prisma/client").Prisma.JsonValue;
        arca: import(".prisma/client").Prisma.JsonValue;
        storefront: import(".prisma/client").Prisma.JsonValue;
        pwa: import(".prisma/client").Prisma.JsonValue;
        qr: import(".prisma/client").Prisma.JsonValue;
        updatedAt: Date;
    }>;
    updateAllSettings(dto: UpdateSettingsDto, req: any): Promise<{
        id: string;
        general: import(".prisma/client").Prisma.JsonValue;
        pricing: import(".prisma/client").Prisma.JsonValue;
        skuBarcode: import(".prisma/client").Prisma.JsonValue;
        invoicing: import(".prisma/client").Prisma.JsonValue;
        notifications: import(".prisma/client").Prisma.JsonValue;
        integrations: import(".prisma/client").Prisma.JsonValue;
        offline: import(".prisma/client").Prisma.JsonValue;
        pos: import(".prisma/client").Prisma.JsonValue;
        arca: import(".prisma/client").Prisma.JsonValue;
        storefront: import(".prisma/client").Prisma.JsonValue;
        pwa: import(".prisma/client").Prisma.JsonValue;
        qr: import(".prisma/client").Prisma.JsonValue;
        updatedAt: Date;
    }>;
    testAfipConnection(): Promise<{
        success: boolean;
        message: string;
    }>;
    testSmtpConnection(dto: any): Promise<{
        success: boolean;
        message: string;
    }>;
    testSmsConnection(dto: any): Promise<{
        success: boolean;
        message: string;
    }>;
    testWhatsappConnection(dto: any): Promise<{
        success: boolean;
        message: string;
    }>;
    testPushConnection(dto: any): Promise<{
        success: boolean;
        message: string;
    }>;
    uploadLogo(file: Express.Multer.File, req: any): Promise<{
        logoUrl: string;
    }>;
    repriceUsd(dto: {
        type: 'Oficial' | 'Blue';
    }): Promise<{
        success: boolean;
        updatedCount: number;
    }>;
}
