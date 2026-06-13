import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
export declare class SettingsService implements OnModuleInit {
    private readonly prisma;
    private readonly auditService;
    private readonly logger;
    private cachedSettings;
    constructor(prisma: PrismaService, auditService: AuditService);
    onModuleInit(): Promise<void>;
    private loadSettingsFromDb;
    getSettings(): Promise<any>;
    updateSection(section: string, payload: any, userId: string): Promise<any>;
    testAfipConnection(): Promise<{
        success: boolean;
        message: string;
    }>;
}
