import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { PrismaService } from '../../core/prisma/prisma.service';

describe('CustomerCreditBalance - CustomersService', () => {
  let service: CustomersService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      customer: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      financialAccount: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      financialTransaction: {
        create: jest.fn(),
      },
      paymentReceipt: {
        create: jest.fn(),
      },
      currentAccountMovement: {
        create: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => cb(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
  });

  describe('addCreditBalance', () => {
    it('throws NotFoundException if customer does not exist', async () => {
      prisma.customer.findUnique.mockResolvedValue(null);

      await expect(
        service.addCreditBalance('non-existent', { amount: 500 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('adds credit balance without treasury account and records movement', async () => {
      const mockCustomer = {
        id: 'cust-1',
        fullName: 'Juan Perez',
        creditLimit: 0,
        usedCredit: 0,
        creditBalance: 100,
      };
      prisma.customer.findUnique.mockResolvedValue(mockCustomer);
      prisma.customer.update.mockResolvedValue({
        ...mockCustomer,
        creditBalance: 600,
      });

      const res = await service.addCreditBalance('cust-1', {
        amount: 500,
        description: 'Anticipo en efectivo',
      });

      expect(prisma.customer.update).toHaveBeenCalledWith({
        where: { id: 'cust-1' },
        data: {
          creditBalance: { increment: 500 },
          updatedAt: expect.any(Date),
        },
      });

      expect(prisma.currentAccountMovement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          accountId: 'cust-1',
          entityType: 'CUSTOMER',
          documentType: 'RECEIPT',
          amount: 500,
          credit: 500,
          debit: 0,
          balanceAfter: 600,
        }),
      });

      expect(res.creditBalance).toBe(600);
      expect(res.credit.balance).toBe(600);
    });

    it('adds credit balance with financial account and records treasury transaction', async () => {
      const mockCustomer = {
        id: 'cust-1',
        fullName: 'Maria Lopez',
        creditLimit: 0,
        usedCredit: 0,
        creditBalance: 0,
      };
      prisma.customer.findUnique.mockResolvedValue(mockCustomer);
      prisma.financialAccount.findUnique.mockResolvedValue({
        id: 'acc-caja',
        name: 'Caja Principal',
        isActive: true,
      });
      prisma.customer.update.mockResolvedValue({
        ...mockCustomer,
        creditBalance: 1000,
      });

      const res = await service.addCreditBalance('cust-1', {
        amount: 1000,
        financialAccountId: 'acc-caja',
        reference: 'REC-001',
      });

      expect(prisma.financialAccount.update).toHaveBeenCalledWith({
        where: { id: 'acc-caja' },
        data: { balance: { increment: 1000 } },
      });

      expect(prisma.financialTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          accountId: 'acc-caja',
          type: 'DEBIT',
          amount: 1000,
          referenceId: 'REC-001',
        }),
      });

      expect(prisma.paymentReceipt.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          accountId: 'acc-caja',
          amount: 1000,
          payerName: 'Maria Lopez',
        }),
      });

      expect(res.creditBalance).toBe(1000);
    });
  });
});
