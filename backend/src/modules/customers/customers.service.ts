import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Customer, CustomerType, CustomerHistoryRecord } from './models/customer.model';
import { CreateCustomerDto } from './dto/create-customer.dto';
import * as crypto from 'crypto';

@Injectable()
export class CustomersService {
  private customers: Customer[] = [];
  private history: CustomerHistoryRecord[] = [];

  async createCustomer(dto: CreateCustomerDto): Promise<Customer> {
    const customer: Customer = {
      id: crypto.randomUUID(),
      type: dto.type,
      fullName: dto.fullName,
      taxId: dto.taxId,
      email: dto.email,
      phone: dto.phone,
      credit: {
        limit: dto.creditLimit || 0,
        used: 0,
        available: dto.creditLimit || 0,
        onHold: false,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.customers.push(customer);
    
    await this.logHistory(customer.id, 'CUSTOMER_CREATED', customer.id, 'Customer profile initialized');

    return customer;
  }

  async getCustomer(id: string): Promise<Customer> {
    const customer = this.customers.find(c => c.id === id);
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  /**
   * Modifies a B2B client's credit limit. Highly sensitive operation.
   */
  async updateCreditLimit(id: string, newLimit: number, userId: string) {
    if (newLimit < 0) throw new BadRequestException('Credit limit cannot be negative.');

    const customer = await this.getCustomer(id);
    const oldLimit = customer.credit.limit;
    
    customer.credit.limit = newLimit;
    customer.credit.available = newLimit - customer.credit.used; // Recalculate dynamic availability

    // If their available drops below 0 because they currently owe MORE than the new limit, auto-hold the account
    if (customer.credit.available < 0) {
      customer.credit.onHold = true;
    }

    customer.updatedAt = new Date();

    await this.logHistory(
      id, 
      'CREDIT_LIMIT_CHANGED', 
      id, 
      `Limit safely changed from ${oldLimit} to ${newLimit} by user ${userId}`
    );

    return customer.credit;
  }

  /**
   * Financial Gateway: Executed during Checkout when a B2B customer selects "Pay On Account"
   */
  async consumeCredit(id: string, amount: number, orderId: string) {
    const customer = await this.getCustomer(id);

    if (customer.credit.onHold) {
      throw new BadRequestException('Checkout blocked: Account is currently on financial hold.');
    }

    if (customer.credit.available < amount) {
      throw new BadRequestException(`Checkout blocked: Insufficient credit available. Reduce the order by $${amount - customer.credit.available} or request a limit increase.`);
    }

    customer.credit.used += amount;
    customer.credit.available -= amount;
    customer.updatedAt = new Date();

    await this.logHistory(id, 'CREDIT_CONSUMED', orderId, `Consumed $${amount} for order ${orderId}`);

    return customer.credit;
  }

  /**
   * Repayment processing. Executed when the Accounts Receivable department processes an incoming bank transfer.
   */
  async repayCredit(id: string, amount: number, paymentReceiptId: string) {
    const customer = await this.getCustomer(id);

    if (amount <= 0) throw new BadRequestException('Repayment must be strictly positive.');

    // Reduce used credit, but do not allow it to go below 0
    customer.credit.used = Math.max(0, customer.credit.used - amount);
    customer.credit.available = customer.credit.limit - customer.credit.used;
    
    // Auto-lift financial holds if their account returns to good standing
    if (customer.credit.available >= 0 && customer.credit.onHold) {
      customer.credit.onHold = false; 
    }

    customer.updatedAt = new Date();

    await this.logHistory(id, 'CREDIT_REPAYMENT', paymentReceiptId, `Repaid $${amount} via receipt ${paymentReceiptId}`);

    return customer.credit;
  }

  /**
   * Retrieves the full audit trail for customer dispute resolutions.
   */
  async getCustomerHistory(id: string): Promise<CustomerHistoryRecord[]> {
    return this.history
      .filter(h => h.customerId === id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Newest first
  }

  // --- INTERNAL UTILITY ---
  private async logHistory(customerId: string, actionType: string, referenceId: string, description: string) {
    const record: CustomerHistoryRecord = {
      id: crypto.randomUUID(),
      customerId,
      actionType,
      referenceId,
      description,
      createdAt: new Date(),
    };
    this.history.push(record);
  }
}
