import { Invoice, InvoiceType } from './models/invoice.model';
import { AfipService } from './afip.service';
import { PrismaService } from '../../core/prisma/prisma.service';
export declare class InvoicingService {
    private readonly afipService;
    private readonly prisma;
    constructor(afipService: AfipService, prisma: PrismaService);
    private invoices;
    generateInvoice(payload: {
        orderId: string;
        type: InvoiceType;
        customerDocumentType: string;
        customerDocumentNumber: string;
        netAmount: number;
        vatAmount: number;
    }): Promise<Invoice>;
}
