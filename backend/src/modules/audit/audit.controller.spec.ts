import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../../core/rbac/guards/permissions.guard';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';

const mockAuditService: any = {
  findAll: jest.fn<any>().mockResolvedValue({ data: [], total: 0, page: 1, pageSize: 20 }),
  findById: jest.fn<any>().mockResolvedValue(null),
  getEntityTrace: jest.fn<any>().mockResolvedValue([]),
};

describe('AuditController', () => {
  let controller: AuditController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [{ provide: AuditService, useValue: mockAuditService }],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuditController>(AuditController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getLogs', () => {
    it('should delegate to auditService.findAll', async () => {
      const result = await controller.getLogs('1', '20');
      expect(mockAuditService.findAll).toHaveBeenCalled();
      expect(result).toEqual({ data: [], total: 0, page: 1, pageSize: 20 });
    });
  });
});
