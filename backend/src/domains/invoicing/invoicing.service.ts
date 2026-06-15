import { Injectable, BadRequestException } from '@nestjs/common';
import { Invoice, InvoiceType, InvoiceStatus } from './models/invoice.model';
import { AfipService } from './afip.service';
import * as crypto from 'crypto';

import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class InvoicingService {
  constructor(
    private readonly afipService: AfipService,
    private readonly prisma: PrismaService
  ) {}

  /**
   * Internal Gateway to generate legal electronic invoices.
   * Not all POS sales require an immediate invoice (some are batched or handled as "Z-reads" at end of day).
   * This handles explicit B2B or B2C requests.
   */
  async generateInvoice(payload: {
    orderId: string;
    type: InvoiceType;
    customerDocumentType: string;
    customerDocumentNumber: string;
    netAmount: number;
    vatAmount: number;
  }) {
    // 1. Validation: Prevent Double-Billing
    const existing = await this.getInvoiceByOrder(payload.orderId);
    if (existing) {
      throw new BadRequestException(`Order ${payload.orderId} has already been invoiced under receipt ${existing.receiptNumber}.`);
    }

    const totalAmount = payload.netAmount + payload.vatAmount;

    // 2. Draft the internal document
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
      }
    });

    // 3. AFIP Internal Code Mapping
    let afipInvoiceType = 6; // Factura B (Final Consumer) default
    if (payload.type === InvoiceType.FACTURA_A) afipInvoiceType = 1;
    if (payload.type === InvoiceType.NOTA_CREDITO_B) afipInvoiceType = 8;
    
    let afipDocType = 96; // DNI default
    if (payload.customerDocumentType === 'CUIT') afipDocType = 80;

    // Read Point of Sale from Settings
    const settings = await this.prisma.systemSettings.findUnique({ where: { id: 'default' } });
    const arcaSettings = (settings?.arca as any) || {};
    const pointOfSale = parseInt(arcaSettings.pointOfSale) || 1;

    // 4. Request Legal Authorization from the Government
    try {
      const afipResponse = await this.afipService.createElectronicInvoice({
        pointOfSale: pointOfSale, // Determines the branch issuing the invoice
        invoiceType: afipInvoiceType,
        documentType: afipDocType,
        documentNumber: parseInt(payload.customerDocumentNumber, 10),
        netAmount: payload.netAmount,
        vatAmount: payload.vatAmount,
        totalAmount
      });

      // 5. Success: Attach the CAE to our internal document
      return await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: InvoiceStatus.APPROVED,
          cae: afipResponse.cae,
          caeExpiration: new Date(afipResponse.caeExpiration),
          receiptNumber: afipResponse.receiptNumber,
          updatedAt: new Date(),
        }
      });

    } catch (error: any) {
      // 6. Failure: AFIP is down or rejected the payload (e.g. invalid CUIT)
      // The invoice is saved as REJECTED so we can retry it via cronjob later without losing the context
      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: InvoiceStatus.REJECTED,
          afipErrorMessage: error.message,
          updatedAt: new Date(),
        }
      });
      throw new BadRequestException(`Invoicing failed: ${error.message}`);
    }
  }

  async getInvoiceByOrder(orderId: string) {
    return this.prisma.invoice.findFirst({
      where: { orderId, status: InvoiceStatus.APPROVED }
    });
  }
}
