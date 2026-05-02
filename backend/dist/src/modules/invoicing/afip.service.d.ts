export declare class AfipService {
    constructor();
    createElectronicInvoice(payload: {
        pointOfSale: number;
        invoiceType: number;
        documentType: number;
        documentNumber: number;
        netAmount: number;
        vatAmount: number;
        totalAmount: number;
    }): Promise<{
        cae: string;
        caeExpiration: Date;
        receiptNumber: string;
    }>;
}
