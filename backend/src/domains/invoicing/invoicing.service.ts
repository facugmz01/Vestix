import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InvoiceType, InvoiceStatus } from './models/invoice.model';
import * as crypto from 'crypto';

import { PrismaService } from '../../core/prisma/prisma.service';
import { AfipProducer } from './afip.producer';

@Injectable()
export class InvoicingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly afipProducer: AfipProducer,
  ) {}

  /**
   * Internal Gateway to generate legal electronic invoices.
   * Creates a draft invoice and enqueues AFIP authorization asynchronously.
   */
  async generateInvoice(payload: {
    orderId: string;
    type: InvoiceType;
    customerDocumentType: string;
    customerDocumentNumber: string;
    netAmount: number;
    vatAmount: number;
  }) {
    const existing = await this.prisma.invoice.findFirst({
      where: {
        orderId: payload.orderId,
        status: { in: [InvoiceStatus.APPROVED, InvoiceStatus.PENDING_AFIP] },
      },
    });
    if (existing) {
      throw new BadRequestException(
        existing.status === InvoiceStatus.APPROVED
          ? `Order ${payload.orderId} has already been invoiced under receipt ${existing.receiptNumber}.`
          : `Order ${payload.orderId} already has a pending AFIP invoice.`,
      );
    }

    const order = await this.prisma.saleOrder.findUnique({
      where: { id: payload.orderId },
      select: { branchId: true },
    });
    if (!order) {
      throw new NotFoundException(`Order ${payload.orderId} not found`);
    }

    const totalAmount = payload.netAmount + payload.vatAmount;

    const invoice = await this.prisma.invoice.create({
      data: {
        id: crypto.randomUUID(),
        orderId: payload.orderId,
        type: payload.type,
        customerDocumentType: payload.customerDocumentType,
        customerDocumentNumber: payload.customerDocumentNumber,
        netAmount: payload.netAmount,
        vatAmount: payload.vatAmount,
        totalAmount,
        status: InvoiceStatus.PENDING_AFIP,
      },
    });

    // Mark the sale as fiscally invoiced so returns/credit notes and UI follow that state.
    await this.prisma.saleOrder.update({
      where: { id: payload.orderId },
      data: { issueInvoice: true },
    });

    await this.afipProducer.enqueueInvoiceGeneration(payload.orderId, order.branchId);

    return invoice;
  }

  async getInvoiceByOrder(orderId: string) {
    return this.prisma.invoice.findFirst({
      where: { orderId, status: InvoiceStatus.APPROVED },
    });
  }
}
