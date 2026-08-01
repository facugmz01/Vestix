import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InvoicingService } from './invoicing.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AfipProducer } from './afip.producer';
import { InvoiceType, InvoiceStatus } from './models/invoice.model';

describe('InvoicingService', () => {
  let service: InvoicingService;
  const prisma = {
    invoice: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    saleOrder: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
  const afipProducer = {
    enqueueInvoiceGeneration: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicingService,
        { provide: PrismaService, useValue: prisma },
        { provide: AfipProducer, useValue: afipProducer },
      ],
    }).compile();

    service = module.get(InvoicingService);
  });

  it('creates a pending invoice and enqueues AFIP generation', async () => {
    prisma.invoice.findFirst.mockResolvedValue(null);
    prisma.saleOrder.findUnique.mockResolvedValue({ branchId: 'branch-1' });
    prisma.saleOrder.update.mockResolvedValue({ id: 'order-1', issueInvoice: true });
    prisma.invoice.create.mockResolvedValue({
      id: 'inv-1',
      orderId: 'order-1',
      status: InvoiceStatus.PENDING_AFIP,
    });

    const result = await service.generateInvoice({
      orderId: 'order-1',
      type: InvoiceType.FACTURA_B,
      customerDocumentType: 'DNI',
      customerDocumentNumber: '12345678',
      netAmount: 100,
      vatAmount: 21,
    });

    expect(prisma.invoice.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          orderId: 'order-1',
          status: InvoiceStatus.PENDING_AFIP,
        }),
      }),
    );
    expect(prisma.saleOrder.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: { issueInvoice: true },
    });
    expect(afipProducer.enqueueInvoiceGeneration).toHaveBeenCalledWith('order-1', 'branch-1');
    expect(result.status).toBe(InvoiceStatus.PENDING_AFIP);
  });

  it('rejects duplicate pending invoices for the same order', async () => {
    prisma.invoice.findFirst.mockResolvedValue({
      status: InvoiceStatus.PENDING_AFIP,
    });

    await expect(
      service.generateInvoice({
        orderId: 'order-1',
        type: InvoiceType.FACTURA_B,
        customerDocumentType: 'DNI',
        customerDocumentNumber: '12345678',
        netAmount: 100,
        vatAmount: 21,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(afipProducer.enqueueInvoiceGeneration).not.toHaveBeenCalled();
  });

  it('rejects duplicate approved invoices for the same order', async () => {
    prisma.invoice.findFirst.mockResolvedValue({
      receiptNumber: '0001-00000123',
    });

    await expect(
      service.generateInvoice({
        orderId: 'order-1',
        type: InvoiceType.FACTURA_B,
        customerDocumentType: 'DNI',
        customerDocumentNumber: '12345678',
        netAmount: 100,
        vatAmount: 21,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(afipProducer.enqueueInvoiceGeneration).not.toHaveBeenCalled();
  });

  it('throws when the sale order does not exist', async () => {
    prisma.invoice.findFirst.mockResolvedValue(null);
    prisma.saleOrder.findUnique.mockResolvedValue(null);

    await expect(
      service.generateInvoice({
        orderId: 'missing-order',
        type: InvoiceType.FACTURA_B,
        customerDocumentType: 'DNI',
        customerDocumentNumber: '12345678',
        netAmount: 100,
        vatAmount: 21,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
