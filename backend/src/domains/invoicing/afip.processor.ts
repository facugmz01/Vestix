import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, UnrecoverableError } from 'bullmq';
import { PrismaService } from '../../core/prisma/prisma.service';
import { Logger } from '@nestjs/common';
import { AfipService } from './afip.service';
import { SettingsService } from '../../modules/settings/settings.service';
import {
  resolveAfipVoucherParams,
  splitAmountsForMultiVat,
  resolveCreditNoteParams,
  resolveDebitNoteParams,
  extractVatRateFromAttributes,
  buildAfipAmounts,
  resolveAfipParamsFromInvoice,
  AfipLineAmount,
} from './afip-voucher.util';
import { InvoiceStatus } from './models/invoice.model';

interface OrderLineWithVariant {
  finalPrice: number;
  quantity: number;
  variantId: string;
}

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
    if (job.name === 'generate_debit_note') {
      return this.processDebitNote(job.data as {
        orderId: string;
        branchId: string;
        amount: number;
        reason?: string;
      });
    }
    return this.processInvoice(job.data as { orderId: string; branchId: string });
  }

  private async getDefaultVatRate(): Promise<number> {
    const pricing = await this.settingsService.getPricingSettings();
    const pct = pricing?.vatDefaultPct ?? 21;
    return pct / 100;
  }

  private async resolveLineAmounts(
    lines: OrderLineWithVariant[],
  ): Promise<{ amounts: ReturnType<typeof buildAfipAmounts>; defaultUsed: number }> {
    const defaultVatRate = await this.getDefaultVatRate();
    const variantIds = [...new Set(lines.map(line => line.variantId))];
    const variants = variantIds.length
      ? await this.prisma.productVariant.findMany({
          where: { id: { in: variantIds } },
          select: { id: true, attributes: true },
        })
      : [];
    const variantMap = new Map(variants.map(v => [v.id, v.attributes]));

    const afipLines: AfipLineAmount[] = lines.map(line => ({
      lineTotal: line.finalPrice * line.quantity,
      vatRate: extractVatRateFromAttributes(variantMap.get(line.variantId), defaultVatRate),
    }));

    return {
      amounts: buildAfipAmounts(splitAmountsForMultiVat(afipLines, defaultVatRate), false),
      defaultUsed: defaultVatRate,
    };
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

    const customerMeta = order.customer as { taxCondition?: string } | null;
    const voucherParams = resolveAfipVoucherParams(
      order.customer?.taxId,
      order.customer?.type,
      customerMeta?.taxCondition,
    );

    const lineSplit = order.lines.length
      ? await this.resolveLineAmounts(order.lines)
      : {
          amounts: buildAfipAmounts(
            splitAmountsForMultiVat([{ lineTotal: order.grandTotal }], await this.getDefaultVatRate()),
            voucherParams.noIvaDiscrimination,
          ),
          defaultUsed: await this.getDefaultVatRate(),
        };

    const amounts = buildAfipAmounts(lineSplit.amounts, voucherParams.noIvaDiscrimination);

    let invoice = order.invoices.find(
      inv => inv.status === InvoiceStatus.PENDING_AFIP || inv.status === InvoiceStatus.FAILED,
    );
    const preserveDraft =
      !!invoice &&
      (invoice.type.startsWith('FACTURA_') || invoice.type.startsWith('NOTA_CREDITO_'));

    if (!invoice) {
      invoice = await this.prisma.invoice.create({
        data: {
          orderId: order.id,
          type: voucherParams.invoiceLabel,
          customerDocumentType: String(voucherParams.documentType),
          customerDocumentNumber: String(voucherParams.documentNumber || order.customer?.taxId || '0'),
          netAmount: amounts.netAmount,
          vatAmount: amounts.vatAmount,
          totalAmount: amounts.totalAmount,
          status: InvoiceStatus.PENDING_AFIP,
        },
      });
    } else if (invoice.status === InvoiceStatus.FAILED) {
      invoice = await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: preserveDraft
          ? { status: InvoiceStatus.PENDING_AFIP, afipErrorMessage: null }
          : {
              status: InvoiceStatus.PENDING_AFIP,
              afipErrorMessage: null,
              netAmount: amounts.netAmount,
              vatAmount: amounts.vatAmount,
              totalAmount: amounts.totalAmount,
              type: voucherParams.invoiceLabel,
            },
      });
    }

    const afipParams = preserveDraft
      ? resolveAfipParamsFromInvoice(invoice)
      : {
          invoiceType: voucherParams.invoiceType,
          documentType: voucherParams.documentType,
          documentNumber: voucherParams.documentNumber,
          netAmount: amounts.netAmount,
          vatAmount: amounts.vatAmount,
          totalAmount: amounts.totalAmount,
          ivaId: voucherParams.ivaId,
          condicionIvaReceptorId: voucherParams.condicionIvaReceptorId,
          noIvaDiscrimination: voucherParams.noIvaDiscrimination,
          vatBreakdown: amounts.vatBreakdown,
        };

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
        invoiceType: afipParams.invoiceType,
        documentType: afipParams.documentType,
        documentNumber: afipParams.documentNumber,
        netAmount: afipParams.netAmount,
        vatAmount: afipParams.vatAmount,
        totalAmount: afipParams.totalAmount,
        ivaId: afipParams.ivaId,
        condicionIvaReceptorId: afipParams.condicionIvaReceptorId,
        vatBreakdown: afipParams.vatBreakdown,
        noIvaDiscrimination: afipParams.noIvaDiscrimination,
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
      include: {
        lines: { include: { orderLine: true } },
        saleOrder: { include: { customer: true, invoices: true } },
      },
    });

    if (!saleReturn) throw new UnrecoverableError(`Return ${data.returnId} not found`);

    const customerMeta = saleReturn.saleOrder.customer as { taxCondition?: string } | null;
    const voucherParams = resolveAfipVoucherParams(
      saleReturn.saleOrder.customer?.taxId,
      saleReturn.saleOrder.customer?.type,
      customerMeta?.taxCondition,
    );
    const { label: creditNoteType, cbteTipo: creditNoteCbteType } = resolveCreditNoteParams(voucherParams);

    const defaultVatRate = await this.getDefaultVatRate();
    const returnLines: AfipLineAmount[] = saleReturn.lines.map(line => ({
      lineTotal: (line.orderLine?.finalPrice ?? line.unitPrice) * line.quantity,
      vatRate: defaultVatRate,
    }));
    const split = splitAmountsForMultiVat(
      returnLines.length ? returnLines : [{ lineTotal: saleReturn.totalRefundAmount }],
      defaultVatRate,
    );
    const amounts = buildAfipAmounts(split, voucherParams.noIvaDiscrimination);

    let invoice = await this.prisma.invoice.findFirst({
      where: {
        orderId: saleReturn.saleOrderId,
        type: creditNoteType,
        status: { in: [InvoiceStatus.PENDING_AFIP, InvoiceStatus.FAILED] },
      },
    });

    if (!invoice) {
      invoice = await this.prisma.invoice.create({
        data: {
          orderId: saleReturn.saleOrderId,
          type: creditNoteType,
          customerDocumentType: String(voucherParams.documentType),
          customerDocumentNumber: String(voucherParams.documentNumber || saleReturn.saleOrder.customer?.taxId || '0'),
          netAmount: amounts.netAmount,
          vatAmount: amounts.vatAmount,
          totalAmount: amounts.totalAmount,
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
        invoiceType: creditNoteCbteType,
        documentType: voucherParams.documentType,
        documentNumber: voucherParams.documentNumber,
        netAmount: amounts.netAmount,
        vatAmount: amounts.vatAmount,
        totalAmount: amounts.totalAmount,
        ivaId: voucherParams.ivaId,
        condicionIvaReceptorId: voucherParams.condicionIvaReceptorId,
        vatBreakdown: amounts.vatBreakdown,
        noIvaDiscrimination: voucherParams.noIvaDiscrimination,
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

  private async processDebitNote(data: {
    orderId: string;
    branchId: string;
    amount: number;
    reason?: string;
  }) {
    this.logger.log(`Processing AFIP Debit Note for Order: ${data.orderId}`);

    const order = await this.prisma.saleOrder.findUnique({
      where: { id: data.orderId },
      include: { customer: true, invoices: true },
    });

    if (!order) throw new UnrecoverableError(`Order ${data.orderId} not found`);
    if (data.amount <= 0) throw new UnrecoverableError('Debit note amount must be positive');

    const customerMeta = order.customer as { taxCondition?: string } | null;
    const voucherParams = resolveAfipVoucherParams(
      order.customer?.taxId,
      order.customer?.type,
      customerMeta?.taxCondition,
    );
    const { label: debitNoteType, cbteTipo: debitNoteCbteType } = resolveDebitNoteParams(voucherParams);

    const defaultVatRate = await this.getDefaultVatRate();
    const split = splitAmountsForMultiVat([{ lineTotal: data.amount }], defaultVatRate);
    const amounts = buildAfipAmounts(split, voucherParams.noIvaDiscrimination);

    let invoice = await this.prisma.invoice.findFirst({
      where: {
        orderId: order.id,
        type: debitNoteType,
        status: { in: [InvoiceStatus.PENDING_AFIP, InvoiceStatus.FAILED] },
        totalAmount: amounts.totalAmount,
      },
    });

    if (!invoice) {
      invoice = await this.prisma.invoice.create({
        data: {
          orderId: order.id,
          type: debitNoteType,
          customerDocumentType: String(voucherParams.documentType),
          customerDocumentNumber: String(voucherParams.documentNumber || order.customer?.taxId || '0'),
          netAmount: amounts.netAmount,
          vatAmount: amounts.vatAmount,
          totalAmount: amounts.totalAmount,
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
        'Configure certificados y CUIT en ARCA antes de emitir notas de débito.';

      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: InvoiceStatus.FAILED,
          afipErrorMessage: errorMessage,
        },
      });

      return { status: 'FAILED', reason: errorMessage };
    }

    const arcaSettings = await this.settingsService.getArcaSettings();
    const pointOfSale = parseInt(String(arcaSettings.pointOfSale), 10) || 1;

    try {
      const afipResponse = await this.afipService.createElectronicInvoice({
        pointOfSale,
        invoiceType: debitNoteCbteType,
        documentType: voucherParams.documentType,
        documentNumber: voucherParams.documentNumber,
        netAmount: amounts.netAmount,
        vatAmount: amounts.vatAmount,
        totalAmount: amounts.totalAmount,
        ivaId: voucherParams.ivaId,
        condicionIvaReceptorId: voucherParams.condicionIvaReceptorId,
        vatBreakdown: amounts.vatBreakdown,
        noIvaDiscrimination: voucherParams.noIvaDiscrimination,
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

      this.logger.log(
        `Successfully generated Debit Note for Order ${data.orderId}` +
          (data.reason ? ` (${data.reason})` : '') +
          ` - CAE: ${afipResponse.cae}`,
      );
      return { status: 'SUCCESS', cae: afipResponse.cae, invoiceId: invoice.id };
    } catch (error: any) {
      const errorMessage = error.message || 'Error desconocido al conectar con AFIP';

      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: InvoiceStatus.FAILED,
          afipErrorMessage: errorMessage,
        },
      });

      this.logger.error(`AFIP debit note failed for Order ${data.orderId}: ${errorMessage}`);
      return { status: 'FAILED', reason: errorMessage };
    }
  }
}
