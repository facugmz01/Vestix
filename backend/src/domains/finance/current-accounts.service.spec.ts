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
      updatedAt: new Date(),
    });

    const account = await service.findById('cust-1');

    expect(account.entityName).toBe('Cliente A');
    expect(account.overdueAmount).toBe(1000);
  });

  it('should throw when account is not found', async () => {
    mockPrisma.customer.findUnique.mockResolvedValueOnce(null);
    mockPrisma.supplier.findUnique.mockResolvedValueOnce(null);

    await expect(service.findById('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
