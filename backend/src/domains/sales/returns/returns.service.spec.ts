import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ReturnsService } from './returns.service';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { InventoryService } from '../../logistics/inventory.service';
import { AfipProducer } from '../../invoicing/afip.producer';
import { AccountsService } from '../../finance/accounts.service';
import { ReturnAction, ReturnCondition } from './dto/create-return.dto';

describe('ReturnsService', () => {
  let service: ReturnsService;

  const txMock: any = {
    saleReturn: {
      create: jest.fn(),
      update: jest.fn(),
    },
    saleReturnLine: {
      create: jest.fn(),
    },
    customer: {
      update: jest.fn(),
    },
    financialAccount: {
      findFirst: jest.fn(),
    },
    treasuryReceipt: {
      create: jest.fn(),
    },
  };

  const prismaMock: any = {
    saleOrder: { findUnique: jest.fn() },
    saleReturn: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    productVariant: { findMany: jest.fn() },
    $transaction: jest.fn((fn: (tx: typeof txMock) => unknown) => fn(txMock)),
  };

  const inventoryServiceMock: any = {
    recordMovement: jest.fn(),
  };

  const afipProducerMock: any = {
    enqueueCreditNote: jest.fn(),
  };

  const accountsServiceMock: any = {
    postTransactionInTx: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReturnsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: InventoryService, useValue: inventoryServiceMock },
        { provide: AfipProducer, useValue: afipProducerMock },
        { provide: AccountsService, useValue: accountsServiceMock },
      ],
    }).compile();

    service = module.get(ReturnsService);
    jest.clearAllMocks();
  });

  describe('processReturn', () => {
    it('creates a PENDING return without restoring stock or posting refunds', async () => {
      const sale = {
        id: 'sale-1',
        branchId: 'branch-1',
        customerId: 'cust-1',
        lines: [{
          id: 'line-1',
          quantity: 2,
          finalPrice: 200,
          basePrice: 80,
        }],
      };

      prismaMock.saleOrder.findUnique.mockResolvedValue(sale);
      txMock.saleReturn.create.mockResolvedValue({ id: 'ret-1' });
      txMock.saleReturn.update.mockResolvedValue({
        id: 'ret-1',
        status: 'PENDING',
        totalRefundAmount: 200,
        lines: [],
      });

      const dto = {
        saleOrderId: 'sale-1',
        branchId: 'branch-1',
        action: ReturnAction.REFUND,
        items: [{
          orderLineId: 'line-1',
          variantId: 'var-1',
          quantity: 1,
          condition: ReturnCondition.SELLABLE,
        }],
      };

      const result = await service.processReturn(dto);

      expect(txMock.saleReturn.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'PENDING' }) }),
      );
      expect(txMock.saleReturnLine.create).toHaveBeenCalled();
      expect(inventoryServiceMock.recordMovement).not.toHaveBeenCalled();
      expect(accountsServiceMock.postTransactionInTx).not.toHaveBeenCalled();
      expect(afipProducerMock.enqueueCreditNote).not.toHaveBeenCalled();
      expect(result.status).toBe('PENDING');
      expect(result.totalRefundAmount).toBe(200);
    });
  });

  describe('approveReturn', () => {
    it('approves a PENDING return and executes stock, refund, and AFIP', async () => {
      const saleReturn = {
        id: 'ret-1',
        status: 'PENDING',
        action: ReturnAction.REFUND,
        totalRefundAmount: 200,
        lines: [{
          id: 'rl-1',
          variantId: 'var-1',
          quantity: 1,
          unitPrice: 80,
          condition: ReturnCondition.SELLABLE,
        }],
        saleOrder: {
          id: 'sale-1',
          branchId: 'branch-1',
          status: 'COMPLETED',
          paymentAccountId: 'acc-1',
          warehouseId: 'wh-1',
          issueInvoice: true,
          customer: { fullName: 'Jane Doe' },
        },
      };

      prismaMock.saleReturn.findUnique.mockResolvedValue(saleReturn);
      txMock.saleReturn.update.mockResolvedValue({
        ...saleReturn,
        status: 'APPROVED',
      });

      const result = await service.approveReturn('ret-1');

      expect(inventoryServiceMock.recordMovement).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'SALE_RETURN', variantId: 'var-1' }),
        txMock,
      );
      expect(accountsServiceMock.postTransactionInTx).toHaveBeenCalledWith(
        txMock,
        'acc-1',
        'CREDIT',
        200,
        'ret-1',
        expect.any(String),
      );
      expect(txMock.saleReturn.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'APPROVED' } }),
      );
      expect(afipProducerMock.enqueueCreditNote).toHaveBeenCalledWith('ret-1', 'branch-1');
      expect(result.status).toBe('APPROVED');
    });

    it('rejects approving an already approved return', async () => {
      prismaMock.saleReturn.findUnique.mockResolvedValue({
        id: 'ret-1',
        status: 'APPROVED',
        lines: [],
        saleOrder: { id: 'sale-1', branchId: 'branch-1' },
      });

      await expect(service.approveReturn('ret-1')).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('rejectReturn', () => {
    it('rejects a PENDING return', async () => {
      prismaMock.saleReturn.findUnique.mockResolvedValue({
        id: 'ret-1',
        status: 'PENDING',
        lines: [],
        saleOrder: { id: 'sale-1' },
      });
      prismaMock.saleReturn.update.mockResolvedValue({
        id: 'ret-1',
        status: 'REJECTED',
      });

      const result = await service.rejectReturn('ret-1');

      expect(prismaMock.saleReturn.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'REJECTED' } }),
      );
      expect(result.status).toBe('REJECTED');
    });

    it('throws when return is not found', async () => {
      prismaMock.saleReturn.findUnique.mockResolvedValue(null);
      await expect(service.rejectReturn('missing')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws when return is already approved', async () => {
      prismaMock.saleReturn.findUnique.mockResolvedValue({
        id: 'ret-1',
        status: 'APPROVED',
        lines: [],
        saleOrder: { id: 'sale-1' },
      });

      await expect(service.rejectReturn('ret-1')).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
