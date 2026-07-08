import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { RbacService } from './rbac.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma: any = {
  role: { findUnique: jest.fn() },
  user: { update: jest.fn() },
};

describe('RbacService', () => {
  let service: RbacService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RbacService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(RbacService);
  });

  it('validates permissions from the role record', async () => {
    mockPrisma.role.findUnique.mockResolvedValue({
      permissions: [
        { action: 'manage', subject: 'Users' },
      ],
    });

    await expect(
      service.validateUserPermissions('role-1', [{ action: 'manage', subject: 'Users' }]),
    ).resolves.toBe(true);

    await expect(
      service.validateUserPermissions('role-1', [{ action: 'manage', subject: 'Settings' }]),
    ).resolves.toBe(false);
  });

  it('allows manage/all to satisfy any requirement', async () => {
    mockPrisma.role.findUnique.mockResolvedValue({
      permissions: [{ action: 'manage', subject: 'all' }],
    });

    await expect(
      service.validateUserPermissions('role-1', [{ action: 'delete', subject: 'Users' }]),
    ).resolves.toBe(true);
  });
});
