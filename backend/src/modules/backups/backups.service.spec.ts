import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BackupsService } from './backups.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { Queue } from 'bullmq';

describe('BackupsService', () => {
  let service: BackupsService;
  let prismaMock: any;
  let auditMock: any;
  let queueMock: any;

  beforeEach(() => {
    prismaMock = {
      backupJob: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    auditMock = {
      log: jest.fn().mockReturnValue(Promise.resolve()),
    };
    queueMock = {
      add: jest.fn().mockReturnValue(Promise.resolve({ id: 'job-1' })),
    };

    service = new BackupsService(
      prismaMock as unknown as PrismaService,
      auditMock as unknown as AuditService,
      queueMock as unknown as Queue,
    );
  });

  describe('parseDatabaseUrl', () => {
    const originalUrl = process.env.DATABASE_URL;

    afterEach(() => {
      process.env.DATABASE_URL = originalUrl;
    });

    it('parses a standard postgres url', () => {
      process.env.DATABASE_URL = 'postgresql://erp_admin:secret123@127.0.0.1:5432/erp_prod';
      const config = service.parseDatabaseUrl();
      expect(config.host).toBe('127.0.0.1');
      expect(config.port).toBe(5432);
      expect(config.user).toBe('erp_admin');
      expect(config.password).toBe('secret123');
      expect(config.database).toBe('erp_prod');
    });

    it('throws BadRequestException if DATABASE_URL is missing', () => {
      delete process.env.DATABASE_URL;
      expect(() => service.parseDatabaseUrl()).toThrow(BadRequestException);
    });
  });

  describe('cleanStaleJobs', () => {
    it('marks PENDING/IN_PROGRESS jobs older than cutoff as FAILED', async () => {
      const oldJob = { id: 'stale-1', type: 'MANUAL', status: 'IN_PROGRESS' };
      prismaMock.backupJob.findMany.mockResolvedValue([oldJob]);
      prismaMock.backupJob.update.mockResolvedValue({ ...oldJob, status: 'FAILED' });

      const cleaned = await service.cleanStaleJobs();
      expect(cleaned).toBe(1);
      expect(prismaMock.backupJob.update).toHaveBeenCalledWith({
        where: { id: 'stale-1' },
        data: expect.objectContaining({
          status: 'FAILED',
        }),
      });
    });

    it('returns 0 if no stale jobs exist', async () => {
      prismaMock.backupJob.findMany.mockResolvedValue([]);
      const cleaned = await service.cleanStaleJobs();
      expect(cleaned).toBe(0);
      expect(prismaMock.backupJob.update).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('rejects creation if another active job is currently in progress', async () => {
      prismaMock.backupJob.findMany.mockResolvedValue([]); // cleanStaleJobs
      prismaMock.backupJob.count.mockResolvedValue(1);

      await expect(service.create({ description: 'test' })).rejects.toThrow(BadRequestException);
    });

    it('marks job FAILED if queue enqueuing fails (e.g. Redis down)', async () => {
      prismaMock.backupJob.findMany.mockResolvedValue([]);
      prismaMock.backupJob.count.mockResolvedValue(0);
      prismaMock.backupJob.create.mockResolvedValue({
        id: 'job-123',
        filename: 'backup-test.sql',
        filePath: '/test/path',
        format: 'SQL',
        status: 'PENDING',
        type: 'MANUAL',
      });
      queueMock.add.mockRejectedValue(new Error('Redis connection refused'));
      prismaMock.backupJob.update.mockResolvedValue({});

      await expect(service.create({ description: 'test' })).rejects.toThrow(BadRequestException);
      expect(prismaMock.backupJob.update).toHaveBeenCalledWith({
        where: { id: 'job-123' },
        data: expect.objectContaining({
          status: 'FAILED',
          error: expect.stringContaining('Redis connection refused'),
        }),
      });
    });

    it('successfully enqueues a backup when no active jobs exist', async () => {
      prismaMock.backupJob.findMany.mockResolvedValue([]);
      prismaMock.backupJob.count.mockResolvedValue(0);
      prismaMock.backupJob.create.mockResolvedValue({
        id: 'job-123',
        filename: 'backup-test.sql',
        filePath: '/test/path',
        fileSize: null,
        format: 'SQL',
        status: 'PENDING',
        type: 'MANUAL',
        description: 'Test',
        error: null,
        startedAt: null,
        completedAt: null,
        createdById: null,
        createdByEmail: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      queueMock.add.mockResolvedValue({ id: 'q-1' });

      const res = await service.create({ description: 'Test' });
      expect(res.id).toBe('job-123');
      expect(queueMock.add).toHaveBeenCalledWith('create', { backupId: 'job-123', type: 'CREATE' });
    });
  });

  describe('remove', () => {
    it('throws NotFoundException if job does not exist', async () => {
      prismaMock.backupJob.findUnique.mockResolvedValue(null);
      await expect(service.remove('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('allows deleting completed jobs', async () => {
      prismaMock.backupJob.findUnique.mockResolvedValue({
        id: 'completed-1',
        status: 'COMPLETED',
        type: 'MANUAL',
        filePath: null,
      });
      prismaMock.backupJob.delete.mockResolvedValue({});

      const res = await service.remove('completed-1');
      expect(res.success).toBe(true);
      expect(prismaMock.backupJob.delete).toHaveBeenCalledWith({ where: { id: 'completed-1' } });
    });

    it('allows force-deleting stuck jobs', async () => {
      prismaMock.backupJob.findUnique.mockResolvedValue({
        id: 'stuck-1',
        status: 'IN_PROGRESS',
        type: 'MANUAL',
        filePath: null,
        createdAt: new Date(), // recent
      });
      prismaMock.backupJob.delete.mockResolvedValue({});

      const res = await service.remove('stuck-1', undefined, undefined, true); // force=true
      expect(res.success).toBe(true);
      expect(prismaMock.backupJob.delete).toHaveBeenCalledWith({ where: { id: 'stuck-1' } });
    });
  });
});
