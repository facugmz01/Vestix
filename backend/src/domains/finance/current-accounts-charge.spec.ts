import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CurrentAccountsService } from './current-accounts.service';
import { PrismaService } from '../../core/prisma/prisma.service';

describe('CurrentAccountsService.chargeCustomerSaleInTx', () => {
  let service: CurrentAccountsService;

  const tx: any = {
    currentAccountMovement: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    customer: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CurrentAccountsService,
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();
    service = module.get(CurrentAccountsService);
  });

  it('increments usedCredit and writes an INVOICE movement', async () => {
    tx.currentAccountMovement.findFirst.mockResolvedValue(null);
    tx.customer.findUnique.mockResolvedValue({
      id: 'cust-1',
      usedCredit: 100,
      creditLimit: 5000,
    });
    tx.customer.update.mockResolvedValue({ id: 'cust-1', usedCredit: 600 });
    tx.currentAccountMovement.create.mockResolvedValue({ id: 'mov-1' });

    await service.chargeCustomerSaleInTx(tx, {
      customerId: 'cust-1',
      amount: 500,
      orderId: 'order-1',
    });

    expect(tx.customer.update).toHaveBeenCalledWith({
      where: { id: 'cust-1' },
      data: { usedCredit: { increment: 500 } },
    });
    expect(tx.currentAccountMovement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          accountId: 'cust-1',
          entityType: 'CUSTOMER',
          documentType: 'INVOICE',
          referenceId: 'order-1',
          amount: 500,
          debit: 500,
          credit: 0,
          balanceAfter: 600,
        }),
      }),
    );
  });

  it('is idempotent when an INVOICE movement already exists for the sale', async () => {
    tx.currentAccountMovement.findFirst.mockResolvedValue({ id: 'existing' });

    const result = await service.chargeCustomerSaleInTx(tx, {
      customerId: 'cust-1',
      amount: 500,
      orderId: 'order-1',
    });

    expect(result).toEqual({ id: 'existing' });
    expect(tx.customer.update).not.toHaveBeenCalled();
    expect(tx.currentAccountMovement.create).not.toHaveBeenCalled();
  });

  it('rejects when credit limit would be exceeded', async () => {
    tx.currentAccountMovement.findFirst.mockResolvedValue(null);
    tx.customer.findUnique.mockResolvedValue({
      id: 'cust-1',
      usedCredit: 4800,
      creditLimit: 5000,
    });

    await expect(
      service.chargeCustomerSaleInTx(tx, {
        customerId: 'cust-1',
        amount: 500,
        orderId: 'order-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('reverses usedCredit and writes a CREDIT_NOTE on cancel', async () => {
    tx.currentAccountMovement.findFirst
      .mockResolvedValueOnce(null) // no existing CREDIT_NOTE
      .mockResolvedValueOnce({ id: 'inv-1', amount: 500 }); // original INVOICE
    tx.customer.update.mockResolvedValue({ id: 'cust-1', usedCredit: 100 });
    tx.currentAccountMovement.create.mockResolvedValue({ id: 'cn-1' });

    await service.reverseCustomerSaleInTx(tx, {
      customerId: 'cust-1',
      amount: 500,
      orderId: 'order-1',
    });

    expect(tx.customer.update).toHaveBeenCalledWith({
      where: { id: 'cust-1' },
      data: { usedCredit: { decrement: 500 } },
    });
    expect(tx.currentAccountMovement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          documentType: 'CREDIT_NOTE',
          credit: 500,
          debit: 0,
          balanceAfter: 100,
        }),
      }),
    );
  });
});
