import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CurrentAccountsService } from './current-accounts.service';
import { PrismaService } from '../../core/prisma/prisma.service';

const mockPrisma: any = {
  customer: { findMany: jest.fn(), findUnique: jest.fn() },
  supplier: { findMany: jest.fn(), findUnique: jest.fn() },
  saleOrder: { findMany: jest.fn(), count: jest.fn() },
  purchaseOrder: { findMany: jest.fn(), count: jest.fn() },
};

describe('CurrentAccountsService', () => {
  let service: CurrentAccountsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CurrentAccountsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(CurrentAccountsService);
  });

  it('should list customers and suppliers with positive balances', async () => {
    mockPrisma.customer.findMany.mockResolvedValueOnce([
      {
        id: 'cust-1',
        fullName: 'Cliente A',
        usedCredit: 1000,
        creditLimit: 5000,
        updatedAt: new Date('2026-01-01'),
      },
    ]);
    mockPrisma.supplier.findMany.mockResolvedValueOnce([
      {
        id: 'sup-1',
        companyName: 'Proveedor B',
        balance: 2500,
        currency: 'ARS',
        updatedAt: new Date('2026-01-02'),
      },
    ]);

    const result = await service.findAll({ page: 1, pageSize: 10 });

    expect(result.total).toBe(2);
    expect(result.data[0].entityType).toBe('CUSTOMER');
    expect(result.data[1].entityType).toBe('SUPPLIER');
  });

  it('should resolve customer account by id', async () => {
    mockPrisma.customer.findUnique.mockResolvedValueOnce({
      id: 'cust-1',
      fullName: 'Cliente A',
      usedCredit: 3000,
      creditLimit: 2000,
      phone: '5491122334455',
      email: 'cliente@test.com',
      updatedAt: new Date(),
    });

    const account = await service.findById('cust-1');

    expect(account.entityName).toBe('Cliente A');
    expect(account.overdueAmount).toBe(1000);
    expect(account.phone).toBe('5491122334455');
    expect(account.email).toBe('cliente@test.com');
  });

  it('should throw when account is not found', async () => {
    mockPrisma.customer.findUnique.mockResolvedValueOnce(null);
    mockPrisma.supplier.findUnique.mockResolvedValueOnce(null);

    await expect(service.findById('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should register payment receipt and credit financial account', async () => {
    const tx = {
      financialAccount: {
        findUnique: jest.fn<any>().mockResolvedValue({ id: 'fa-1', name: 'Caja Principal', balance: 5000, isActive: true, type: 'CASH' }),
        update: jest.fn<any>().mockResolvedValue({ id: 'fa-1', balance: 6000 }),
      },
      financialTransaction: {
        create: jest.fn<any>().mockResolvedValue({ id: 'ft-1' }),
      },
      paymentReceipt: {
        create: jest.fn<any>().mockResolvedValue({ id: 'pr-1' }),
      },
      customer: {
        update: jest.fn<any>().mockResolvedValue({ id: 'cust-1', usedCredit: 500 }),
      },
      currentAccountMovement: {
        create: jest.fn<any>().mockResolvedValue({
          id: 'mov-1',
          accountId: 'cust-1',
          documentType: 'RECEIPT',
          referenceId: 'REC-001',
          description: 'Cobro en efectivo',
          amount: 1000,
          credit: 1000,
          debit: 0,
          balanceAfter: 500,
          createdAt: new Date(),
          financialAccountId: 'fa-1',
          financialAccount: { id: 'fa-1', name: 'Caja Principal', type: 'CASH', currency: 'ARS' },
        }),
      },
    };

    mockPrisma.$transaction = jest.fn<any>((cb: any) => cb(tx));
    mockPrisma.customer.findUnique.mockResolvedValueOnce({ id: 'cust-1', fullName: 'Cliente A', usedCredit: 1500 });

    const res = await service.registerPaymentReceipt('cust-1', {
      amount: 1000,
      referenceId: 'REC-001',
      description: 'Cobro en efectivo',
      financialAccountId: 'fa-1',
    });

    expect(res.amount).toBe(1000);
    expect(res.financialAccountId).toBe('fa-1');
    expect(tx.financialAccount.update).toHaveBeenCalledWith({
      where: { id: 'fa-1' },
      data: { balance: { increment: 1000 } },
    });
    expect(tx.financialTransaction.create).toHaveBeenCalled();
  });
});
