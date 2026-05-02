import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Supplier, SupplierLedgerRecord } from './models/supplier.model';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import * as crypto from 'crypto';

@Injectable()
export class SuppliersService {
  private suppliers: Supplier[] = [];
  private ledger: SupplierLedgerRecord[] = [];

  async createSupplier(dto: CreateSupplierDto): Promise<Supplier> {
    const supplier: Supplier = {
      id: crypto.randomUUID(),
      companyName: dto.companyName,
      contactName: dto.contactName,
      taxId: dto.taxId,
      email: dto.email,
      phone: dto.phone,
      account: {
        balance: 0,
        currency: dto.currency,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.suppliers.push(supplier);
    return supplier;
  }

  async getSupplier(id: string): Promise<Supplier> {
    const supplier = this.suppliers.find(s => s.id === id);
    if (!supplier) throw new NotFoundException('Supplier not found');
    return supplier;
  }

  /**
   * Accounts Payable: Executed when we receive a formal invoice from the supplier 
   * (typically triggered after validating a Goods Receipt).
   */
  async registerInvoice(id: string, amount: number, invoiceNumber: string) {
    if (amount <= 0) throw new BadRequestException('Invoice amount must be strictly positive.');

    const supplier = await this.getSupplier(id);
    
    // Increases the amount we owe them
    supplier.account.balance += amount; 
    supplier.updatedAt = new Date();

    await this.logLedger(id, 'INVOICE_RECEIVED', amount, invoiceNumber, `Recorded supplier invoice #${invoiceNumber}`);

    return supplier.account;
  }

  /**
   * Accounts Payable: Executed when the Finance department wires money to the supplier.
   */
  async processPayment(id: string, amount: number, paymentTransactionId: string) {
    if (amount <= 0) throw new BadRequestException('Payment amount must be strictly positive.');

    const supplier = await this.getSupplier(id);
    
    // Decreases the amount we owe them
    supplier.account.balance -= amount; 
    supplier.updatedAt = new Date();

    await this.logLedger(id, 'PAYMENT_SENT', -amount, paymentTransactionId, `Sent bank transfer. Ref: ${paymentTransactionId}`);

    return supplier.account;
  }

  /**
   * Accounts Payable Exception: Executed if we return damaged goods to the supplier 
   * and they issue a financial Credit Note to forgive that debt.
   */
  async registerCreditNote(id: string, amount: number, creditNoteId: string) {
     if (amount <= 0) throw new BadRequestException('Credit note amount must be strictly positive.');

     const supplier = await this.getSupplier(id);
     
     // Decreases our debt to them without us sending actual cash
     supplier.account.balance -= amount; 
     supplier.updatedAt = new Date();

     await this.logLedger(id, 'CREDIT_NOTE', -amount, creditNoteId, `Applied Credit Note ${creditNoteId} for returned goods`);

     return supplier.account;
  }

  /**
   * Retrieves the full Accounts Payable audit trail for reconciliation.
   */
  async getSupplierLedger(id: string): Promise<SupplierLedgerRecord[]> {
    return this.ledger
      .filter(l => l.supplierId === id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // --- INTERNAL UTILITY ---
  private async logLedger(supplierId: string, actionType: string, amount: number, referenceId: string, description: string) {
    const record: SupplierLedgerRecord = {
      id: crypto.randomUUID(),
      supplierId,
      actionType,
      amount,
      referenceId,
      description,
      createdAt: new Date(),
    };
    this.ledger.push(record);
  }
}
