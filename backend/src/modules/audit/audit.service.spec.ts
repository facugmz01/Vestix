import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { AuditService, AuditAction, LogPayload } from './audit.service';
import { PrismaService } from '../../core/prisma/prisma.service';

const mockPrismaService: any = {
  auditLog: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
};

describe('AuditService', () => {
  let service: AuditService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log', () => {
    const basePayload: LogPayload = {
      userId: 'user-1',
      userEmail: 'test@example.com',
      ipAddress: '127.0.0.1',
      action: AuditAction.CREATE,
      resource: 'Product',
      resourceId: 'p-1',
      module: 'CatalogService',
      description: 'Created product',
    };

    it('should persist an audit record via prisma', async () => {
      mockPrismaService.auditLog.create.mockResolvedValueOnce({});
      await service.log(basePayload);
      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          action: AuditAction.CREATE,
          resource: 'Product',
          module: 'CatalogService',
        }),
      });
    });

    it('should not throw when prisma create fails', async () => {
      mockPrismaService.auditLog.create.mockRejectedValueOnce(new Error('DB down'));
      await expect(service.log(basePayload)).resolves.toBeUndefined();
    });

    it('should sanitize sensitive fields from newValue', async () => {
      mockPrismaService.auditLog.create.mockResolvedValueOnce({});
      await service.log({
        ...basePayload,
        newValue: { name: 'Test', password: 'secret123', token: 'abc' },
      });
      const createCall = mockPrismaService.auditLog.create.mock.calls[0][0];
      expect(createCall.data.newValue.password).toBe('[REDACTED]');
      expect(createCall.data.newValue.token).toBe('[REDACTED]');
      expect(createCall.data.newValue.name).toBe('Test');
    });

    it('should sanitize sensitive fields from previousValue', async () => {
      mockPrismaService.auditLog.create.mockResolvedValueOnce({});
      await service.log({
        ...basePayload,
        previousValue: { cardNumber: '4111111111', cvv: '123', email: 'a@b.com' },
      });
      const createCall = mockPrismaService.auditLog.create.mock.calls[0][0];
      expect(createCall.data.previousValue.cardNumber).toBe('[REDACTED]');
      expect(createCall.data.previousValue.cvv).toBe('[REDACTED]');
      expect(createCall.data.previousValue.email).toBe('a@b.com');
    });

    it('should handle undefined newValue and previousValue', async () => {
      mockPrismaService.auditLog.create.mockResolvedValueOnce({});
      await service.log({ ...basePayload, newValue: undefined, previousValue: undefined });
      const createCall = mockPrismaService.auditLog.create.mock.calls[0][0];
      expect(createCall.data.newValue).toBeUndefined();
      expect(createCall.data.previousValue).toBeUndefined();
    });
  });

  describe('getResourceHistory', () => {
    it('should query audit logs by resource and resourceId', async () => {
      const mockLogs = [{ id: 'log-1' }];
      mockPrismaService.auditLog.findMany.mockResolvedValueOnce(mockLogs);
      const result = await service.getResourceHistory('Product', 'p-1');
      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
        where: { resource: 'Product', resourceId: 'p-1' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockLogs);
    });
  });

  describe('getUserTrail', () => {
    it('should query audit logs by userId with date range', async () => {
      const from = new Date('2026-01-01');
      const to = new Date('2026-12-31');
      mockPrismaService.auditLog.findMany.mockResolvedValueOnce([]);
      await service.getUserTrail('user-1', from, to);
      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          createdAt: { gte: from, lte: to },
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should work without date filters', async () => {
      mockPrismaService.auditLog.findMany.mockResolvedValueOnce([]);
      await service.getUserTrail('user-1');
      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          createdAt: { gte: undefined, lte: undefined },
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getSecurityEvents', () => {
    it('should query ACCESS_DENIED events from the given date', async () => {
      const from = new Date('2026-06-01');
      mockPrismaService.auditLog.findMany.mockResolvedValueOnce([]);
      await service.getSecurityEvents(from);
      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          action: AuditAction.ACCESS_DENIED,
          createdAt: { gte: from },
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should default to last 24h when no date is provided', async () => {
      mockPrismaService.auditLog.findMany.mockResolvedValueOnce([]);
      const before = Date.now() - 24 * 60 * 60 * 1000;
      await service.getSecurityEvents();
      const call = mockPrismaService.auditLog.findMany.mock.calls[0][0];
      const since = call.where.createdAt.gte.getTime();
      expect(since).toBeGreaterThanOrEqual(before - 1000);
      expect(since).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('getModuleActivity', () => {
    it('should query logs for a specific module with default limit', async () => {
      mockPrismaService.auditLog.findMany.mockResolvedValueOnce([]);
      await service.getModuleActivity('SalesService');
      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
        where: { module: 'SalesService' },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    });

    it('should respect custom limit', async () => {
      mockPrismaService.auditLog.findMany.mockResolvedValueOnce([]);
      await service.getModuleActivity('SalesService', 50);
      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
        where: { module: 'SalesService' },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    });
  });
});
