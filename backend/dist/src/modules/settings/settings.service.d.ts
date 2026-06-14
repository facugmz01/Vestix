import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UpdateSettingsDto } from './dto/settings.dto';
export declare class SettingsService implements OnModuleInit {
    private readonly prisma;
    private readonly auditService;
    private readonly logger;
    constructor(prisma: PrismaService, auditService: AuditService);
    onModuleInit(): Promise<void>;
    private ensureDefaultSettings;
    getSettings(): Promise<{
        id: string;
        general: import(".prisma/client").Prisma.JsonValue;
        pricing: import(".prisma/client").Prisma.JsonValue;
        skuBarcode: import(".prisma/client").Prisma.JsonValue;
        invoicing: import(".prisma/client").Prisma.JsonValue;
        notifications: import(".prisma/client").Prisma.JsonValue;
        integrations: import(".prisma/client").Prisma.JsonValue;
        offline: import(".prisma/client").Prisma.JsonValue;
        updatedAt: Date;
    }>;
    updateAllSettings(dto: UpdateSettingsDto, userId: string): Promise<{
        id: string;
        general: import(".prisma/client").Prisma.JsonValue;
        pricing: import(".prisma/client").Prisma.JsonValue;
        skuBarcode: import(".prisma/client").Prisma.JsonValue;
        invoicing: import(".prisma/client").Prisma.JsonValue;
        notifications: import(".prisma/client").Prisma.JsonValue;
        integrations: import(".prisma/client").Prisma.JsonValue;
        offline: import(".prisma/client").Prisma.JsonValue;
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
}
