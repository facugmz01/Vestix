import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AuditContextService } from '../audit-context/audit-context.service';
export declare class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly auditContextService;
    constructor(auditContextService: AuditContextService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    private toCamelCase;
    private sanitize;
}
