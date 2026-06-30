"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const testing_1 = require("@nestjs/testing");
const audit_service_1 = require("./audit.service");
const prisma_service_1 = require("../../core/prisma/prisma.service");
const mockPrismaService = {
    auditLog: {
        create: globals_1.jest.fn(),
        findMany: globals_1.jest.fn(),
    },
};
(0, globals_1.describe)('AuditService', () => {
    let service;
    (0, globals_1.beforeEach)(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                audit_service_1.AuditService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
            ],
        }).compile();
        service = module.get(audit_service_1.AuditService);
        globals_1.jest.clearAllMocks();
    });
    (0, globals_1.it)('should be defined', () => {
        (0, globals_1.expect)(service).toBeDefined();
    });
    (0, globals_1.describe)('log', () => {
        const basePayload = {
            userId: 'user-1',
            userEmail: 'test@example.com',
            ipAddress: '127.0.0.1',
            action: audit_service_1.AuditAction.CREATE,
            resource: 'Product',
            resourceId: 'p-1',
            module: 'CatalogService',
            description: 'Created product',
        };
        (0, globals_1.it)('should persist an audit record via prisma', async () => {
            mockPrismaService.auditLog.create.mockResolvedValueOnce({});
            await service.log(basePayload);
            (0, globals_1.expect)(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
                data: globals_1.expect.objectContaining({
                    userId: 'user-1',
                    action: audit_service_1.AuditAction.CREATE,
                    resource: 'Product',
                    module: 'CatalogService',
                }),
            });
        });
        (0, globals_1.it)('should not throw when prisma create fails', async () => {
            mockPrismaService.auditLog.create.mockRejectedValueOnce(new Error('DB down'));
            await (0, globals_1.expect)(service.log(basePayload)).resolves.toBeUndefined();
        });
        (0, globals_1.it)('should sanitize sensitive fields from newValue', async () => {
            mockPrismaService.auditLog.create.mockResolvedValueOnce({});
            await service.log({
                ...basePayload,
                newValue: { name: 'Test', password: 'secret123', token: 'abc' },
            });
            const createCall = mockPrismaService.auditLog.create.mock.calls[0][0];
            (0, globals_1.expect)(createCall.data.newValue.password).toBe('[REDACTED]');
            (0, globals_1.expect)(createCall.data.newValue.token).toBe('[REDACTED]');
            (0, globals_1.expect)(createCall.data.newValue.name).toBe('Test');
        });
        (0, globals_1.it)('should sanitize sensitive fields from previousValue', async () => {
            mockPrismaService.auditLog.create.mockResolvedValueOnce({});
            await service.log({
                ...basePayload,
                previousValue: { cardNumber: '4111111111', cvv: '123', email: 'a@b.com' },
            });
            const createCall = mockPrismaService.auditLog.create.mock.calls[0][0];
            (0, globals_1.expect)(createCall.data.previousValue.cardNumber).toBe('[REDACTED]');
            (0, globals_1.expect)(createCall.data.previousValue.cvv).toBe('[REDACTED]');
            (0, globals_1.expect)(createCall.data.previousValue.email).toBe('a@b.com');
        });
        (0, globals_1.it)('should handle undefined newValue and previousValue', async () => {
            mockPrismaService.auditLog.create.mockResolvedValueOnce({});
            await service.log({ ...basePayload, newValue: undefined, previousValue: undefined });
            const createCall = mockPrismaService.auditLog.create.mock.calls[0][0];
            (0, globals_1.expect)(createCall.data.newValue).toBeUndefined();
            (0, globals_1.expect)(createCall.data.previousValue).toBeUndefined();
        });
    });
    (0, globals_1.describe)('getResourceHistory', () => {
        (0, globals_1.it)('should query audit logs by resource and resourceId', async () => {
            const mockLogs = [{ id: 'log-1' }];
            mockPrismaService.auditLog.findMany.mockResolvedValueOnce(mockLogs);
            const result = await service.getResourceHistory('Product', 'p-1');
            (0, globals_1.expect)(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
                where: { resource: 'Product', resourceId: 'p-1' },
                orderBy: { createdAt: 'desc' },
            });
            (0, globals_1.expect)(result).toEqual(mockLogs);
        });
    });
    (0, globals_1.describe)('getUserTrail', () => {
        (0, globals_1.it)('should query audit logs by userId with date range', async () => {
            const from = new Date('2026-01-01');
            const to = new Date('2026-12-31');
            mockPrismaService.auditLog.findMany.mockResolvedValueOnce([]);
            await service.getUserTrail('user-1', from, to);
            (0, globals_1.expect)(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
                where: {
                    userId: 'user-1',
                    createdAt: { gte: from, lte: to },
                },
                orderBy: { createdAt: 'desc' },
            });
        });
        (0, globals_1.it)('should work without date filters', async () => {
            mockPrismaService.auditLog.findMany.mockResolvedValueOnce([]);
            await service.getUserTrail('user-1');
            (0, globals_1.expect)(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
                where: {
                    userId: 'user-1',
                    createdAt: { gte: undefined, lte: undefined },
                },
                orderBy: { createdAt: 'desc' },
            });
        });
    });
    (0, globals_1.describe)('getSecurityEvents', () => {
        (0, globals_1.it)('should query ACCESS_DENIED events from the given date', async () => {
            const from = new Date('2026-06-01');
            mockPrismaService.auditLog.findMany.mockResolvedValueOnce([]);
            await service.getSecurityEvents(from);
            (0, globals_1.expect)(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
                where: {
                    action: audit_service_1.AuditAction.ACCESS_DENIED,
                    createdAt: { gte: from },
                },
                orderBy: { createdAt: 'desc' },
            });
        });
        (0, globals_1.it)('should default to last 24h when no date is provided', async () => {
            mockPrismaService.auditLog.findMany.mockResolvedValueOnce([]);
            const before = Date.now() - 24 * 60 * 60 * 1000;
            await service.getSecurityEvents();
            const call = mockPrismaService.auditLog.findMany.mock.calls[0][0];
            const since = call.where.createdAt.gte.getTime();
            (0, globals_1.expect)(since).toBeGreaterThanOrEqual(before - 1000);
            (0, globals_1.expect)(since).toBeLessThanOrEqual(Date.now());
        });
    });
    (0, globals_1.describe)('getModuleActivity', () => {
        (0, globals_1.it)('should query logs for a specific module with default limit', async () => {
            mockPrismaService.auditLog.findMany.mockResolvedValueOnce([]);
            await service.getModuleActivity('SalesService');
            (0, globals_1.expect)(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
                where: { module: 'SalesService' },
                orderBy: { createdAt: 'desc' },
                take: 100,
            });
        });
        (0, globals_1.it)('should respect custom limit', async () => {
            mockPrismaService.auditLog.findMany.mockResolvedValueOnce([]);
            await service.getModuleActivity('SalesService', 50);
            (0, globals_1.expect)(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
                where: { module: 'SalesService' },
                orderBy: { createdAt: 'desc' },
                take: 50,
            });
        });
    });
});
//# sourceMappingURL=audit.service.spec.js.map