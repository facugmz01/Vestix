export declare enum InvoiceType {
    FACTURA_A = "FACTURA_A",
    FACTURA_B = "FACTURA_B",
    FACTURA_C = "FACTURA_C",
    NOTA_CREDITO_A = "NOTA_CREDITO_A",
    NOTA_CREDITO_B = "NOTA_CREDITO_B"
}
export declare enum InvoiceStatus {
    DRAFT = "DRAFT",
    PENDING_AFIP = "PENDING_AFIP",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED"
}
export interface Invoice {
    id: string;
    orderId: string;
    type: InvoiceType;
    cae?: string;
    caeExpiration?: Date;
    receiptNumber?: string;
    customerDocumentType: string;
    customerDocumentNumber: string;
    netAmount: number;
    vatAmount: number;
    totalAmount: number;
    status: InvoiceStatus;
    afipErrorMessage?: string;
    createdAt: Date;
    updatedAt: Date;
}
