import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { ExpenseCategoriesService } from './expense-categories.service';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { AuditService } from '../../../modules/audit/audit.service';
import { ExpenseOriginType, ExpenseStatus } from './dto/create-expense.dto';

const mockPrisma: any = {
  expense: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  },
  expenseCategory: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  financialAccount: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  financialTransaction: {
    create: jest.fn(),
  },
  cashShift: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
  },
  $transaction: jest.fn(),
  $queryRaw: jest.fn(),
};

const mockAuditService: any = {
  log: jest.fn<any>().mockResolvedValue(undefined),
};

const mockCategoriesService: any = {
  findById: jest.fn(),
};

describe('ExpensesService', () => {
  let service: ExpensesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpensesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAuditService },
        { provide: ExpenseCategoriesService, useValue: mockCategoriesService },
      ],
    }).compile();

    service = module.get(ExpensesService);
  });

  describe('createExpense', () => {
    it('should create an expense from a cash shift and deduct funds atomically', async () => {
      mockCategoriesService.findById.mockResolvedValueOnce({
        id: 'cat-1',
        name: 'Insumos y Embalaje',
        isActive: true,
      });

      mockPrisma.cashShift.findUnique.mockResolvedValueOnce({
        id: 'shift-1',
        status: 'OPEN',
        cashRegister: {
          id: 'reg-1',
          name: 'Caja Mostrador 1',
          branchId: 'branch-1',
          paymentMethods: [{ type: 'CASH', accountId: 'acc-cash-1', isActive: true }],
        },
      });

      const mockCreatedExpense = {
        id: 'exp-1',
        amount: 2500,
        currency: 'ARS',
        description: 'Compra de bolsas y cinta',
        status: ExpenseStatus.PAID,
        financialAccountId: 'acc-cash-1',
        cashShiftId: 'shift-1',
        financialTransactionId: 'ft-1',
      };

      mockPrisma.$transaction = jest.fn<any>(async (callback: any) => {
        const tx = {
          $queryRaw: jest.fn<any>().mockResolvedValue([
            { id: 'acc-cash-1', name: 'Caja Chica', type: 'CASH', balance: 10000 },
          ]),
          financialTransaction: {
            create: jest.fn<any>().mockResolvedValue({ id: 'ft-1' }),
          },
          financialAccount: {
            update: jest.fn<any>().mockResolvedValue({ id: 'acc-cash-1', balance: 7500 }),
          },
          expense: {
            create: jest.fn<any>().mockResolvedValue(mockCreatedExpense),
          },
        };
        return callback(tx);
      });

      const result = await service.createExpense(
        {
          expenseCategoryId: 'cat-1',
          amount: 2500,
          description: 'Compra de bolsas y cinta',
          originType: ExpenseOriginType.CASH_SHIFT,
          cashShiftId: 'shift-1',
        },
        { userId: 'user-1', email: 'cajero@vestix.com', branchId: 'branch-1' },
      );

      expect(result.id).toBe('exp-1');
      expect(result.amount).toBe(2500);
      expect(mockAuditService.log).toHaveBeenCalled();
    });

    it('should throw BadRequestException if cash account has insufficient funds', async () => {
      mockCategoriesService.findById.mockResolvedValueOnce({
        id: 'cat-1',
        name: 'Insumos',
        isActive: true,
      });

      mockPrisma.financialAccount.findUnique.mockResolvedValueOnce({
        id: 'acc-cash-1',
        name: 'Caja Chica',
        type: 'CASH',
        balance: 500,
        isActive: true,
      });

      mockPrisma.$transaction = jest.fn<any>(async (callback: any) => {
        const tx = {
          $queryRaw: jest.fn<any>().mockResolvedValue([
            { id: 'acc-cash-1', name: 'Caja Chica', type: 'CASH', balance: 500 },
          ]),
        };
        return callback(tx);
      });

      await expect(
        service.createExpense(
          {
            expenseCategoryId: 'cat-1',
            amount: 1500,
            description: 'Insumos mayores',
            originType: ExpenseOriginType.FINANCIAL_ACCOUNT,
            financialAccountId: 'acc-cash-1',
          },
          { userId: 'user-1', email: 'admin@vestix.com' },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if category is inactive', async () => {
      mockCategoriesService.findById.mockResolvedValueOnce({
        id: 'cat-inactive',
        name: 'Categoría Vieja',
        isActive: false,
      });

      await expect(
        service.createExpense(
          {
            expenseCategoryId: 'cat-inactive',
            amount: 1000,
            description: 'Prueba',
            originType: ExpenseOriginType.FINANCIAL_ACCOUNT,
            financialAccountId: 'acc-1',
          },
          { userId: 'user-1' },
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancelExpense', () => {
    it('should reverse the transaction, refund account balance and mark expense as CANCELLED', async () => {
      const mockExpense = {
        id: 'exp-1',
        amount: 3000,
        description: 'Alquiler temporario',
        status: ExpenseStatus.PAID,
        financialAccountId: 'acc-bank-1',
        financialTransactionId: 'ft-1',
        notes: null,
      };

      jest.spyOn(service, 'getExpenseById').mockResolvedValueOnce(mockExpense as any);

      mockPrisma.$transaction = jest.fn<any>(async (callback: any) => {
        const tx = {
          financialTransaction: {
            create: jest.fn<any>().mockResolvedValue({ id: 'ft-rev-1' }),
          },
          financialAccount: {
            update: jest.fn<any>().mockResolvedValue({ id: 'acc-bank-1', balance: 13000 }),
          },
          expense: {
            update: jest.fn<any>().mockResolvedValue({
              ...mockExpense,
              status: ExpenseStatus.CANCELLED,
              notes: 'ANULADO: Error en monto',
            }),
          },
        };
        return callback(tx);
      });

      const result = await service.cancelExpense(
        'exp-1',
        { reason: 'Error en monto' },
        { userId: 'admin-1', email: 'admin@vestix.com' },
      );

      expect(result.status).toBe(ExpenseStatus.CANCELLED);
      expect(mockAuditService.log).toHaveBeenCalled();
    });
  });

  describe('getExpensesSummary', () => {
    it('should aggregate metrics and breakdown by category and origin', async () => {
      mockPrisma.expense.findMany.mockResolvedValueOnce([
        {
          id: 'e1',
          amount: 5000,
          expenseCategory: { id: 'c1', name: 'Alquiler', code: 'EXP-RENT' },
          financialAccount: { id: 'a1', name: 'Banco Galicia', type: 'BANK' },
          cashShiftId: null,
        },
        {
          id: 'e2',
          amount: 2000,
          expenseCategory: { id: 'c2', name: 'Insumos', code: 'EXP-SUPPLIES' },
          financialAccount: { id: 'a2', name: 'Caja Central', type: 'CASH' },
          cashShiftId: 's1',
        },
      ]);

      const summary = await service.getExpensesSummary({});

      expect(summary.totalAmount).toBe(7000);
      expect(summary.count).toBe(2);
      expect(summary.byCategory.length).toBe(2);
      expect(summary.byCategory[0].name).toBe('Alquiler');
      expect(summary.byOrigin.bankTotal).toBe(5000);
      expect(summary.byOrigin.cashTotal).toBe(2000);
    });
  });
});
