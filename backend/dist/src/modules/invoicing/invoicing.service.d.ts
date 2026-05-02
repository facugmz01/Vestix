import { Invoice, InvoiceType } from './models/invoice.model';
import { AfipService } from './afip.service';
export declare class InvoicingService {
    private readonly afipService;
    constructor(afipService: AfipService);
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
