import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, UnrecoverableError } from 'bullmq';
import { PrismaService } from '../../core/prisma/prisma.service';
import { Logger } from '@nestjs/common';
import { AfipService } from './afip.service';
import { SettingsService } from '../../modules/settings/settings.service';
import { InvoiceStatus } from './models/invoice.model';

@Processor('afip_invoices')
export class AfipProcessor extends WorkerHost {
  private readonly logger = new Logger(AfipProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly afipService: AfipService,
    private readonly settingsService: SettingsService,
  ) {
    super();
  }

  async process(job: Job<any>) {
    if (job.name === 'generate_credit_note') {
      return this.processCreditNote(job.data as { returnId: string; branchId: string });
    }
    return this.processInvoice(job.data as { orderId: string; branchId: string });
  }

  private async processInvoice(data: { orderId: string; branchId: string }) {
    this.logger.log(`Processing AFIP invoice for Order: ${data.orderId}`);

    const order = await this.prisma.saleOrder.findUnique({
      where: { id: data.orderId },
      include: { lines: true, customer: true, invoices: true },
    });

    if (!order) {
      throw new UnrecoverableError(`Order ${data.orderId} not found. Cannot invoice.`);
    }

    if (order.invoices.some(inv => inv.status === InvoiceStatus.APPROVED && inv.type.startsWith('FA_'))) {
      this.logger.log(`Order ${order.id} already has an approved invoice. Skipping.`);
      return { status: 'ALREADY_INVOICED' };
    }

    const netAmount = order.grandTotal / 1.21;
    const vatAmount = order.grandTotal - netAmount;

    let invoice = order.invoices.find(
      inv => inv.status === InvoiceStatus.PENDING_AFIP || inv.status === InvoiceStatus.FAILED,
    );

    if (!invoice) {
      invoice = await this.prisma.invoice.create({
        data: {
          orderId: order.id,
          type: 'FA_B',
          customerDocumentType: 'DNI',
          customerDocumentNumber: order.customer?.taxId || '99999999',
          netAmount,
          vatAmount,
          totalAmount: order.grandTotal,
          status: InvoiceStatus.PENDING_AFIP,
        },
      });
    } else if (invoice.status === InvoiceStatus.FAILED) {
      invoice = await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: InvoiceStatus.PENDING_AFIP, afipErrorMessage: null },
      });
    }

    const configured = await this.afipService.isConfigured();
    if (!configured) {
      const status = await this.afipService.getConfigurationStatus();
      const errorMessage =
        `AFIP no configurado: ${status.missing.join(', ')}. ` +
        'Configure certificados y CUIT en ARCA antes de emitir.';

      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: InvoiceStatus.FAILED,
          afipErrorMessage: errorMessage,
        },
      });

      this.logger.warn(`Invoice for Order ${order.id} marked FAILED — AFIP not configured`);
      return { status: 'FAILED', reason: errorMessage };
    }

    const arcaSettings = await this.settingsService.getArcaSettings();
    const pointOfSale = parseInt(String(arcaSettings.pointOfSale), 10) || 1;

    try {
      const afipResponse = await this.afipService.createElectronicInvoice({
        pointOfSale,
        invoiceType: 6,
        documentType: 96,
        documentNumber: parseInt(order.customer?.taxId || '99999999', 10),
        netAmount,
        vatAmount,
        totalAmount: order.grandTotal,
      });

      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          cae: afipResponse.cae,
          caeExpiration: new Date(afipResponse.caeExpiration),
          receiptNumber: afipResponse.receiptNumber,
          status: InvoiceStatus.APPROVED,
          afipErrorMessage: null,
        },
      });

      this.logger.log(`Successfully generated Invoice for Order ${order.id} - CAE: ${afipResponse.cae}`);
      return { status: 'SUCCESS', cae: afipResponse.cae };
    } catch (error: any) {
      const errorMessage = error.message || 'Error desconocido al conectar con AFIP';

      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: InvoiceStatus.FAILED,
          afipErrorMessage: errorMessage,
        },
      });

      this.logger.error(`AFIP invoice failed for Order ${order.id}: ${errorMessage}`);
      return { status: 'FAILED', reason: errorMessage };
    }
  }

  private async processCreditNote(data: { returnId: string; branchId: string }) {
    this.logger.log(`Processing AFIP Credit Note for Return: ${data.returnId}`);

    const saleReturn = await this.prisma.saleReturn.findUnique({
      where: { id: data.returnId },
      include: { saleOrder: { include: { customer: true, invoices: true } } },
    });

    if (!saleReturn) throw new UnrecoverableError(`Return ${data.returnId} not found`);

    const netAmount = saleReturn.totalRefundAmount / 1.21;
    const vatAmount = saleReturn.totalRefundAmount - netAmount;

    let invoice = await this.prisma.invoice.findFirst({
      where: {
        orderId: saleReturn.saleOrderId,
        type: 'NC_B',
        status: { in: [InvoiceStatus.PENDING_AFIP, InvoiceStatus.FAILED] },
      },
    });

    if (!invoice) {
      invoice = await this.prisma.invoice.create({
        data: {
          orderId: saleReturn.saleOrderId,
          type: 'NC_B',
          customerDocumentType: 'DNI',
          customerDocumentNumber: saleReturn.saleOrder.customer?.taxId || '99999999',
          netAmount,
          vatAmount,
          totalAmount: saleReturn.totalRefundAmount,
          status: InvoiceStatus.PENDING_AFIP,
        },
      });
    } else if (invoice.status === InvoiceStatus.FAILED) {
      invoice = await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: InvoiceStatus.PENDING_AFIP, afipErrorMessage: null },
      });
    }

    const configured = await this.afipService.isConfigured();
    if (!configured) {
      const status = await this.afipService.getConfigurationStatus();
      const errorMessage =
        `AFIP no configurado: ${status.missing.join(', ')}. ` +
        'Configure certificados y CUIT en ARCA antes de emitir notas de crédito.';

      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: InvoiceStatus.FAILED,
          afipErrorMessage: errorMessage,
        },
      });

      this.logger.warn(`Credit note for Return ${data.returnId} marked FAILED — AFIP not configured`);
      return { status: 'FAILED', reason: errorMessage };
    }

    const arcaSettings = await this.settingsService.getArcaSettings();
    const pointOfSale = parseInt(String(arcaSettings.pointOfSale), 10) || 1;

    try {
      const afipResponse = await this.afipService.createElectronicInvoice({
        pointOfSale,
        invoiceType: 8,
        documentType: 96,
        documentNumber: parseInt(saleReturn.saleOrder.customer?.taxId || '99999999', 10),
        netAmount,
        vatAmount,
        totalAmount: saleReturn.totalRefundAmount,
      });

      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          cae: afipResponse.cae,
          caeExpiration: new Date(afipResponse.caeExpiration),
          receiptNumber: afipResponse.receiptNumber,
          status: InvoiceStatus.APPROVED,
          afipErrorMessage: null,
        },
      });

      this.logger.log(`Successfully generated Credit Note for Return ${data.returnId} - CAE: ${afipResponse.cae}`);
      return { status: 'SUCCESS', cae: afipResponse.cae };
    } catch (error: any) {
      const errorMessage = error.message || 'Error desconocido al conectar con AFIP';

      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: InvoiceStatus.FAILED,
          afipErrorMessage: errorMessage,
        },
      });

      this.logger.error(`AFIP credit note failed for Return ${data.returnId}: ${errorMessage}`);
      return { status: 'FAILED', reason: errorMessage };
    }
  }
}
