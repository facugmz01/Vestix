import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  AccountAdjustmentsService,
  AccountAdjustmentType,
} from './account-adjustments.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AuditService } from '../../modules/audit/audit.service';

const mockPrisma: any = {
  financialAccount: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  financialTransaction: {
    create: jest.fn(),
  },
  accountAdjustment: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  $transaction: jest.fn(),
  $queryRaw: jest.fn(),
};

const mockAuditService = {
  log: jest.fn<any>().mockResolvedValue(undefined),
};

describe('AccountAdjustmentsService', () => {
  let service: AccountAdjustmentsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountAdjustmentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get(AccountAdjustmentsService);
  });

  describe('adjustAccountBalance', () => {
    it('should register an INCOME_SURPLUS adjustment with DEBIT transaction when verified balance is higher', async () => {
      const mockAdjustment = {
        id: 'adj-1',
        financialAccountId: 'acc-1',
        previousBalance: 10000,
        adjustedBalance: 12500,
        difference: 2500,
        type: AccountAdjustmentType.INCOME_SURPLUS,
        reason: 'Ajuste por sobrante tras arqueo mensual',
        approvedById: 'user-admin',
      };

      mockPrisma.$transaction = jest.fn<any>(async (callback: any) => {
        const tx = {
          $queryRaw: jest.fn<any>().mockResolvedValue([
            { id: 'acc-1', name: 'Banco Santander', type: 'BANK', balance: 10000, isActive: true },
          ]),
          financialTransaction: {
            create: jest.fn<any>().mockResolvedValue({ id: 'ft-1', type: 'DEBIT', amount: 2500 }),
          },
          financialAccount: {
            update: jest.fn<any>().mockResolvedValue({ id: 'acc-1', name: 'Banco Santander', balance: 12500 }),
          },
          accountAdjustment: {
            create: jest.fn<any>().mockResolvedValue(mockAdjustment),
          },
        };
        return callback(tx);
      });

      const result = await service.adjustAccountBalance(
        'acc-1',
        {
          adjustedBalance: 12500,
          reason: 'Ajuste por sobrante tras arqueo mensual',
        },
        { userId: 'user-admin', email: 'admin@vestix.com' },
      );

      expect(result.id).toBe('adj-1');
      expect(result.type).toBe(AccountAdjustmentType.INCOME_SURPLUS);
      expect(result.difference).toBe(2500);
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'RECONCILE',
          resource: 'FinancialAccount',
          resourceId: 'acc-1',
        }),
      );
    });

    it('should register an EXPENSE_DEFICIT adjustment with CREDIT transaction when verified balance is lower', async () => {
      const mockAdjustment = {
        id: 'adj-2',
        financialAccountId: 'acc-1',
        previousBalance: 10000,
        adjustedBalance: 8800,
        difference: -1200,
        type: AccountAdjustmentType.EXPENSE_DEFICIT,
        reason: 'Comisiones bancarias no registradas en el extracto',
        approvedById: 'user-admin',
      };

      mockPrisma.$transaction = jest.fn<any>(async (callback: any) => {
        const tx = {
          $queryRaw: jest.fn<any>().mockResolvedValue([
            { id: 'acc-1', name: 'Banco Santander', type: 'BANK', balance: 10000, isActive: true },
          ]),
          financialTransaction: {
            create: jest.fn<any>().mockResolvedValue({ id: 'ft-2', type: 'CREDIT', amount: 1200 }),
          },
          financialAccount: {
            update: jest.fn<any>().mockResolvedValue({ id: 'acc-1', name: 'Banco Santander', balance: 8800 }),
          },
          accountAdjustment: {
            create: jest.fn<any>().mockResolvedValue(mockAdjustment),
          },
        };
        return callback(tx);
      });

      const result = await service.adjustAccountBalance(
        'acc-1',
        {
          adjustedBalance: 8800,
          reason: 'Comisiones bancarias no registradas en el extracto',
        },
        { userId: 'user-admin', email: 'admin@vestix.com' },
      );

      expect(result.id).toBe('adj-2');
      expect(result.type).toBe(AccountAdjustmentType.EXPENSE_DEFICIT);
      expect(result.difference).toBe(-1200);
    });

    it('should reject adjustment if difference is zero', async () => {
      mockPrisma.$transaction = jest.fn<any>(async (callback: any) => {
        const tx = {
          $queryRaw: jest.fn<any>().mockResolvedValue([
            { id: 'acc-1', name: 'Caja', type: 'CASH', balance: 5000, isActive: true },
          ]),
        };
        return callback(tx);
      });

      await expect(
        service.adjustAccountBalance(
          'acc-1',
          {
            adjustedBalance: 5000,
            reason: 'Saldos ya coinciden',
          },
          { userId: 'user-admin' },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject adjustment if reason is less than 5 characters', async () => {
      await expect(
        service.adjustAccountBalance(
          'acc-1',
          {
            adjustedBalance: 6000,
            reason: 'Test',
          },
          { userId: 'user-admin' },
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getAccountAdjustments', () => {
    it('should retrieve audit trail of account adjustments', async () => {
      mockPrisma.financialAccount.findUnique.mockResolvedValueOnce({
        id: 'acc-1',
        name: 'Caja Central',
      });
      mockPrisma.accountAdjustment.findMany.mockResolvedValueOnce([
        {
          id: 'adj-1',
          difference: 500,
          reason: 'Ajuste de caja',
          createdAt: new Date(),
        },
      ]);

      const list = await service.getAccountAdjustments('acc-1');
      expect(list.length).toBe(1);
      expect(list[0].difference).toBe(500);
    });
  });
});
