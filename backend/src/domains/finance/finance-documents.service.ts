import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { InvoicingService } from '../invoicing/invoicing.service';
import { AfipProducer } from '../invoicing/afip.producer';
import { InvoiceStatus, InvoiceType } from '../invoicing/models/invoice.model';

const INVOICE_TYPE_MAP: Record<string, string> = {
  FA_A: 'FACTURA_A',
  FA_B: 'FACTURA_B',
  FA_C: 'FACTURA_C',
  NC_A: 'NOTA_CREDITO_A',
  NC_B: 'NOTA_CREDITO_B',
  NC_C: 'NOTA_CREDITO_C',
  ND_A: 'NOTA_DEBITO_A',
  ND_B: 'NOTA_DEBITO_B',
  ND_C: 'NOTA_DEBITO_C',
  FACTURA_A: 'FACTURA_A',
  FACTURA_B: 'FACTURA_B',
  FACTURA_C: 'FACTURA_C',
  NOTA_CREDITO_A: 'NOTA_CREDITO_A',
  NOTA_CREDITO_B: 'NOTA_CREDITO_B',
  NOTA_CREDITO_C: 'NOTA_CREDITO_C',
  NOTA_DEBITO_A: 'NOTA_DEBITO_A',
  NOTA_DEBITO_B: 'NOTA_DEBITO_B',
  NOTA_DEBITO_C: 'NOTA_DEBITO_C',
};

const INVOICE_TYPE_REVERSE: Record<string, InvoiceType> = {
  FACTURA_A: InvoiceType.FACTURA_A,
  FACTURA_B: InvoiceType.FACTURA_B,
  FACTURA_C: InvoiceType.FACTURA_C,
  NOTA_CREDITO_A: InvoiceType.NOTA_CREDITO_A,
  NOTA_CREDITO_B: InvoiceType.NOTA_CREDITO_B,
  NOTA_CREDITO_C: InvoiceType.NOTA_CREDITO_C,
  NOTA_DEBITO_A: InvoiceType.NOTA_DEBITO_A,
  NOTA_DEBITO_B: InvoiceType.NOTA_DEBITO_B,
  NOTA_DEBITO_C: InvoiceType.NOTA_DEBITO_C,
};

@Injectable()
export class FinanceDocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly invoicingService: InvoicingService,
    private readonly afipProducer: AfipProducer,
  ) {}

  async getPayments(filters: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
  }) {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 15;
    const skip = (page - 1) * pageSize;
    const search = filters.search?.trim();

    const where: any = {
      status: { notIn: ['QUOTE', 'QUOTATION', 'CANCELLED'] },
    };

    if (filters.status === 'PENDING') {
      where.status = 'PENDING_PAYMENT';
    } else if (filters.status === 'COMPLETED') {
      where.status = { in: ['COMPLETED', 'CONFIRMED', 'DELIVERED', 'READY_FOR_PICKUP'] };
    } else if (filters.status === 'FAILED') {
      where.status = 'PENDING_PAYMENT';
    } else if (filters.status === 'REFUNDED') {
      where.returns = { some: { status: 'APPROVED' } };
    }

    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { customer: { fullName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [orders, total] = await Promise.all([
      this.prisma.saleOrder.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
          payments: { include: { paymentMethod: true } },
        },
      }),
      this.prisma.saleOrder.count({ where }),
    ]);

    return {
      data: orders.map(order => this.mapPaymentRecord(order)),
      total,
      page,
      pageSize,
    };
  }

  async getPayment(id: string) {
    const payment = await this.prisma.saleOrderPayment.findUnique({
      where: { id },
      include: {
        order: { include: { customer: true, payments: { include: { paymentMethod: true } } } },
        paymentMethod: true,
      },
    });

    if (payment?.order) {
      return this.mapPaymentRecord(payment.order);
    }

    const order = await this.prisma.saleOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        payments: { include: { paymentMethod: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('Pago no encontrado');
    }

    return this.mapPaymentRecord(order);
  }

  async getInvoices(filters: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    type?: string;
  }) {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 15;
    const skip = (page - 1) * pageSize;
    const search = filters.search?.trim();

    const where: any = {};
    if (filters.type) {
      const dbType = Object.entries(INVOICE_TYPE_MAP).find(([, v]) => v === filters.type)?.[0] ?? filters.type;
      where.type = dbType;
    }
    if (filters.status) {
      where.status = this.mapFrontendStatusToDb(filters.status);
    }
    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { orderId: { contains: search, mode: 'insensitive' } },
        { receiptNumber: { contains: search, mode: 'insensitive' } },
        { cae: { contains: search, mode: 'insensitive' } },
        { customerDocumentNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          order: { include: { customer: true } },
        },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      data: invoices.map(inv => this.mapElectronicInvoice(inv)),
      total,
      page,
      pageSize,
    };
  }

  async getInvoice(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: { order: { include: { customer: true } } },
    });
    if (!invoice) throw new NotFoundException('Factura no encontrada');
    return this.mapElectronicInvoice(invoice);
  }

  async getInvoicesBySaleOrder(saleOrderId: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: { orderId: saleOrderId },
      orderBy: { createdAt: 'desc' },
      include: { order: { include: { customer: true } } },
    });
    return invoices.map(inv => this.mapElectronicInvoice(inv));
  }

  async issueInvoice(dto: {
    saleOrderId: string;
    type: string;
    receiverName: string;
    receiverDocType: string;
    receiverDocNumber: string;
    receiverIvaCondition: string;
    receiverAddress?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country?: string;
    };
  }) {
    const order = await this.prisma.saleOrder.findUnique({
      where: { id: dto.saleOrderId },
    });
    if (!order) throw new NotFoundException('Venta no encontrada');

    const invoiceType = INVOICE_TYPE_REVERSE[dto.type];
    if (!invoiceType) {
      throw new BadRequestException(`Tipo de comprobante no soportado: ${dto.type}`);
    }

    const netAmount = order.grandTotal / 1.21;
    const vatAmount = order.grandTotal - netAmount;

    const invoice = await this.invoicingService.generateInvoice({
      orderId: dto.saleOrderId,
      type: invoiceType,
      customerDocumentType: dto.receiverDocType,
      customerDocumentNumber: dto.receiverDocNumber,
      netAmount,
      vatAmount,
    });

    return this.mapElectronicInvoice({
      ...invoice,
      order: {
        customer: { fullName: dto.receiverName },
      },
    });
  }

  async retryInvoice(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: { order: { include: { customer: true } } },
    });
    if (!invoice) throw new NotFoundException('Factura no encontrada');

    const retriable = [InvoiceStatus.FAILED, InvoiceStatus.REJECTED, InvoiceStatus.PENDING_AFIP];
    if (!retriable.includes(invoice.status as InvoiceStatus)) {
      throw new BadRequestException('Solo se pueden reintentar facturas pendientes o fallidas');
    }

    const order = await this.prisma.saleOrder.findUnique({
      where: { id: invoice.orderId },
      select: { branchId: true },
    });
    if (!order) throw new NotFoundException('Venta asociada no encontrada');

    await this.afipProducer.enqueueInvoiceGeneration(invoice.orderId, order.branchId);

    const refreshed = await this.prisma.invoice.findUnique({
      where: { id },
      include: { order: { include: { customer: true } } },
    });

    return this.mapElectronicInvoice(refreshed!);
  }

  async cancelInvoice(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: { order: { include: { customer: true } } },
    });
    if (!invoice) throw new NotFoundException('Factura no encontrada');

    if (invoice.status === InvoiceStatus.APPROVED) {
      throw new BadRequestException('No se puede anular un comprobante ya autorizado por AFIP');
    }

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.CANCELLED },
      include: { order: { include: { customer: true } } },
    });

    return this.mapElectronicInvoice(updated);
  }

  async issueDebitNote(dto: {
    saleOrderId: string;
    amount: number;
    reason?: string;
  }) {
    const order = await this.prisma.saleOrder.findUnique({
      where: { id: dto.saleOrderId },
      select: { id: true, branchId: true, grandTotal: true },
    });
    if (!order) throw new NotFoundException('Venta no encontrada');

    if (dto.amount <= 0) {
      throw new BadRequestException('El monto de la nota de débito debe ser mayor a cero');
    }

    await this.afipProducer.enqueueDebitNote(
      order.id,
      order.branchId,
      dto.amount,
      dto.reason,
    );

    return {
      success: true,
      message: 'Nota de débito encolada para emisión AFIP',
      saleOrderId: order.id,
      amount: dto.amount,
    };
  }

  private mapPaymentRecord(order: any) {
    const lines =
      order.payments?.length > 0
        ? order.payments.map((p: any) => ({
            method: this.mapPaymentMethodType(p.paymentMethod?.type ?? order.paymentMethod),
            amount: p.amount,
            reference: p.referenceId ?? undefined,
          }))
        : [
            {
              method: this.mapPaymentMethodType(order.paymentMethod),
              amount: order.grandTotal,
              reference: undefined,
            },
          ];

    let status = 'COMPLETED';
    if (order.status === 'PENDING_PAYMENT') status = 'PENDING';
    else if (order.returns?.some?.((r: any) => r.status === 'APPROVED')) status = 'REFUNDED';

    return {
      id: order.payments?.[0]?.id ?? order.id,
      referenceId: order.id,
      amount: order.grandTotal,
      status,
      lines,
      customerName: order.customer?.fullName,
      createdAt: order.createdAt.toISOString(),
      completedAt: status === 'COMPLETED' ? order.createdAt.toISOString() : undefined,
    };
  }

  private mapPaymentMethodType(type: string) {
    if (type === 'QR_MERCADOPAGO') return 'CREDIT_CARD';
    if (type === 'DEBIT_CARD') return 'DEBIT_CARD';
    if (type === 'CUSTOMER_CREDIT') return 'STORE_CREDIT';
    if (type === 'BANK_TRANSFER') return 'BANK_TRANSFER';
    if (type === 'CASH') return 'CASH';
    return type || 'CASH';
  }

  private mapFrontendStatusToDb(status: string): string | { in: string[] } {
    switch (status) {
      case 'ISSUED':
        return InvoiceStatus.APPROVED;
      case 'PENDING':
        return { in: [InvoiceStatus.PENDING_AFIP, InvoiceStatus.DRAFT] };
      case 'FAILED':
        return { in: [InvoiceStatus.FAILED, InvoiceStatus.REJECTED] };
      case 'CANCELLED':
        return InvoiceStatus.CANCELLED;
      default:
        return status;
    }
  }

  private mapDbStatusToFrontend(status: string): string {
    switch (status) {
      case InvoiceStatus.APPROVED:
        return 'ISSUED';
      case InvoiceStatus.PENDING_AFIP:
      case InvoiceStatus.DRAFT:
        return 'PENDING';
      case InvoiceStatus.FAILED:
      case InvoiceStatus.REJECTED:
        return 'FAILED';
      case InvoiceStatus.CANCELLED:
        return 'CANCELLED';
      default:
        return status;
    }
  }

  private mapElectronicInvoice(invoice: any) {
    return {
      id: invoice.id,
      saleOrderId: invoice.orderId,
      type: INVOICE_TYPE_MAP[invoice.type] ?? invoice.type,
      status: this.mapDbStatusToFrontend(invoice.status),
      receiverName: invoice.order?.customer?.fullName ?? 'Consumidor Final',
      receiverDocType: invoice.customerDocumentType,
      receiverDocNumber: invoice.customerDocumentNumber,
      receiverIvaCondition: 'Consumidor Final',
      cae: invoice.cae ?? undefined,
      caeDueDate: invoice.caeExpiration?.toISOString?.() ?? undefined,
      afipMessage: invoice.afipErrorMessage ?? undefined,
      subtotal: invoice.netAmount,
      vatAmount: invoice.vatAmount,
      total: invoice.totalAmount,
      issuedAt: invoice.status === InvoiceStatus.APPROVED ? invoice.updatedAt?.toISOString?.() : undefined,
      createdAt: invoice.createdAt.toISOString(),
    };
  }
}
