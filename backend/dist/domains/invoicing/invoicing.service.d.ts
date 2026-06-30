import { InvoiceType } from './models/invoice.model';
import { AfipService } from './afip.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { SettingsService } from '../../modules/settings/settings.service';
export declare class InvoicingService {
    private readonly afipService;
    private readonly prisma;
    private readonly settingsService;
    constructor(afipService: AfipService, prisma: PrismaService, settingsService: SettingsService);
    generateInvoice(payload: {
        orderId: string;
        type: InvoiceType;
        customerDocumentType: string;
        customerDocumentNumber: string;
        netAmount: number;
        vatAmount: number;
    }): Promise<{
        id: string;
        orderId: string;
        type: string;
        cae: string | null;
        caeExpiration: Date | null;
        receiptNumber: string | null;
        customerDocumentType: string;
        customerDocumentNumber: string;
        netAmount: number;
        vatAmount: number;
        totalAmount: number;
        status: string;
        afipErrorMessage: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getInvoiceByOrder(orderId: string): Promise<{
        id: string;
        orderId: string;
        type: string;
        cae: string | null;
        caeExpiration: Date | null;
        receiptNumber: string | null;
        customerDocumentType: string;
        customerDocumentNumber: string;
        netAmount: number;
        vatAmount: number;
        totalAmount: number;
        status: string;
        afipErrorMessage: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
