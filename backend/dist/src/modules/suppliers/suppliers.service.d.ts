import { Supplier, SupplierLedgerRecord } from './models/supplier.model';
import { CreateSupplierDto } from './dto/create-supplier.dto';
export declare class SuppliersService {
    private suppliers;
    private ledger;
    createSupplier(dto: CreateSupplierDto): Promise<Supplier>;
    getSupplier(id: string): Promise<Supplier>;
    registerInvoice(id: string, amount: number, invoiceNumber: string): Promise<import("./models/supplier.model").SupplierAccount>;
    processPayment(id: string, amount: number, paymentTransactionId: string): Promise<import("./models/supplier.model").SupplierAccount>;
    registerCreditNote(id: string, amount: number, creditNoteId: string): Promise<import("./models/supplier.model").SupplierAccount>;
    getSupplierLedger(id: string): Promise<SupplierLedgerRecord[]>;
    private logLedger;
}
