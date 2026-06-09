import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../core/prisma/prisma.service';
import { Logger } from '@nestjs/common';

@Processor('afip_invoices')
export class AfipProcessor extends WorkerHost {
  private readonly logger = new Logger(AfipProcessor.name);

  constructor(private readonly prisma: PrismaService) {
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
    
    // 1. Fetch complete order context
    const order = await this.prisma.saleOrder.findUnique({
      where: { id: data.orderId },
      include: { lines: true, customer: true, invoices: true }
    });

    if (!order) {
      throw new Error(`Order ${data.orderId} not found. Cannot invoice.`);
    }

    if (order.invoices.some(inv => inv.status === 'APPROVED' && inv.type.startsWith('FA_'))) {
      this.logger.log(`Order ${order.id} already has an approved invoice. Skipping.`);
      return { status: 'ALREADY_INVOICED' };
    }

    // 2. MOCK: Execute slow external HTTPS call to AFIP Web Services
    await new Promise(resolve => setTimeout(resolve, 2500)); 
    
    if (Math.random() < 0.1) {
      throw new Error('AFIP WSFE: Service Unavailable (503). Retrying...');
    }

    const simulatedCae = Math.floor(Math.random() * 100000000000000).toString();
    const simulatedVto = new Date();
    simulatedVto.setDate(simulatedVto.getDate() + 10);
    const receiptNumber = `B-0001-${Math.floor(Math.random() * 10000000).toString().padStart(8, '0')}`;

    // 3. Persist official fiscal data to Invoice record
    await this.prisma.invoice.create({
      data: {
        orderId: order.id,
        type: 'FA_B', // Factura B
        cae: simulatedCae,
        caeExpiration: simulatedVto,
        receiptNumber: receiptNumber,
        customerDocumentType: 'DNI',
        customerDocumentNumber: order.customer?.taxId || '99999999',
        netAmount: order.grandTotal / 1.21,
        vatAmount: order.grandTotal - (order.grandTotal / 1.21),
        totalAmount: order.grandTotal,
        status: 'APPROVED',
      }
    });

    this.logger.log(`Successfully generated Invoice for Order ${order.id} - CAE: ${simulatedCae}`);
    return { status: 'SUCCESS', cae: simulatedCae };
  }

  private async processCreditNote(data: { returnId: string; branchId: string }) {
    this.logger.log(`Processing AFIP Credit Note for Return: ${data.returnId}`);
    
    const saleReturn = await this.prisma.saleReturn.findUnique({
      where: { id: data.returnId },
      include: { saleOrder: { include: { customer: true } } }
    });

    if (!saleReturn) throw new Error(`Return ${data.returnId} not found`);

    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API latency
    
    const simulatedCae = Math.floor(Math.random() * 100000000000000).toString();
    const simulatedVto = new Date();
    simulatedVto.setDate(simulatedVto.getDate() + 10);
    const receiptNumber = `NC-0001-${Math.floor(Math.random() * 10000000).toString().padStart(8, '0')}`;

    await this.prisma.invoice.create({
      data: {
        orderId: saleReturn.saleOrderId,
        type: 'NC_B', // Nota de Crédito B
        cae: simulatedCae,
        caeExpiration: simulatedVto,
        receiptNumber: receiptNumber,
        customerDocumentType: 'DNI',
        customerDocumentNumber: saleReturn.saleOrder.customer?.taxId || '99999999',
        netAmount: saleReturn.totalRefundAmount / 1.21,
        vatAmount: saleReturn.totalRefundAmount - (saleReturn.totalRefundAmount / 1.21),
        totalAmount: saleReturn.totalRefundAmount,
        status: 'APPROVED',
      }
    });

    this.logger.log(`Successfully generated Credit Note for Return ${data.returnId} - CAE: ${simulatedCae}`);
    return { status: 'SUCCESS', cae: simulatedCae };
  }
}
