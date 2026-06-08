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

  async process(job: Job<{ orderId: string; branchId: string }>) {
    this.logger.log(`Processing AFIP invoice for Order: ${job.data.orderId}`);
    
    // 1. Fetch complete order context
    const order = await this.prisma.saleOrder.findUnique({
      where: { id: job.data.orderId },
      include: { lines: true, customer: true, invoices: true }
    });

    if (!order) {
      throw new Error(`Order ${job.data.orderId} not found. Cannot invoice.`);
    }

    if (order.invoices.some(inv => inv.status === 'APPROVED')) {
      this.logger.log(`Order ${order.id} already has an approved invoice. Skipping.`);
      return { status: 'ALREADY_INVOICED' };
    }

    // 2. MOCK: Execute slow external HTTPS call to AFIP Web Services
    // In production, this uses an AFIP SDK with SOAP/WSDL endpoints.
    await new Promise(resolve => setTimeout(resolve, 2500)); // Simulate 2.5s latency
    
    // Simulate Random Government API Failure (10% chance)
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
        customerDocumentNumber: '99999999', // Mock Consumidor Final
        netAmount: order.grandTotal / 1.21,
        vatAmount: order.grandTotal - (order.grandTotal / 1.21),
        totalAmount: order.grandTotal,
        status: 'APPROVED',
      }
    });

    this.logger.log(`Successfully generated Invoice for Order ${order.id} - CAE: ${simulatedCae}`);
    return { status: 'SUCCESS', cae: simulatedCae };
  }
}
