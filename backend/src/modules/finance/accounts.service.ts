import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { FinancialAccount, AccountType, TransactionType, FinancialTransaction, PaymentReceipt } from './models/account.model';
import { CreateAccountDto } from './dto/create-account.dto';
import * as crypto from 'crypto';

@Injectable()
export class AccountsService {
  private accounts: FinancialAccount[] = [];
  private transactions: FinancialTransaction[] = [];
  private receipts: PaymentReceipt[] = [];

  async createAccount(dto: CreateAccountDto): Promise<FinancialAccount> {
    const account: FinancialAccount = {
      id: crypto.randomUUID(),
      ...dto,
      balance: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.accounts.push(account);
    return account;
  }

  async getAccount(id: string): Promise<FinancialAccount> {
    const acc = this.accounts.find(a => a.id === id);
    if (!acc) throw new NotFoundException('Financial Account not found');
    return acc;
  }

  /**
   * CORE LEDGER ENGINE: Posts a financial transaction.
   * Follows strict accounting rules: 
   * - DEBIT increases Asset accounts (Cash in)
   * - CREDIT decreases Asset accounts (Cash out)
   */
  async postTransaction(accountId: string, type: TransactionType, amount: number, referenceId: string, description: string) {
    if (amount <= 0) {
      throw new BadRequestException('Transaction amounts must be strictly positive.');
    }

    const account = await this.getAccount(accountId);

    const transaction: FinancialTransaction = {
      id: crypto.randomUUID(),
      accountId,
      type,
      amount,
      referenceId,
      description,
      createdAt: new Date(),
    };

    this.transactions.push(transaction);

    // Update the Materialized Balance
    if (type === TransactionType.DEBIT) {
      account.balance += amount;
    } else {
      account.balance -= amount;
    }
    
    account.updatedAt = new Date();

    return transaction;
  }

  /**
   * Triggered by the POS/Sales module when a customer pays for an order.
   * Orchestrates putting money in the drawer and issuing a formal receipt document.
   */
  async generateIncomingReceipt(payload: {
    accountId: string;
    amount: number;
    payerName: string;
    referenceId: string; // e.g., POS Order ID
    description: string;
  }) {
    // 1. Post the money into the bank/drawer (DEBIT)
    await this.postTransaction(
      payload.accountId, 
      TransactionType.DEBIT, 
      payload.amount, 
      payload.referenceId, 
      payload.description
    );

    // 2. Generate the immutable Receipt document for the customer
    const receipt: PaymentReceipt = {
      id: crypto.randomUUID(),
      accountId: payload.accountId,
      amount: payload.amount,
      payerName: payload.payerName,
      referenceId: payload.referenceId,
      issuedAt: new Date()
    };

    this.receipts.push(receipt);
    return receipt;
  }

  /**
   * Triggered by the Accounts Payable team to wire money to a Supplier.
   */
  async processOutgoingPayment(payload: {
    accountId: string;
    amount: number;
    payeeName: string;
    referenceId: string; // e.g., Supplier Invoice ID
    description: string;
  }) {
    const account = await this.getAccount(payload.accountId);
    
    // Strict Safety Check: You cannot pay cash if the physical POS drawer is empty
    if (account.type === AccountType.CASH && account.balance < payload.amount) {
      throw new BadRequestException(`Insufficient funds in Cash Drawer. Current balance is $${account.balance}, but attempted to pay $${payload.amount}.`);
    }

    // Money leaves the account (CREDIT)
    await this.postTransaction(
      payload.accountId,
      TransactionType.CREDIT,
      payload.amount,
      payload.referenceId,
      payload.description
    );

    return { success: true, message: `Paid $${payload.amount} to ${payload.payeeName}` };
  }
}
