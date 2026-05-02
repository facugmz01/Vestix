import { Injectable, BadRequestException } from '@nestjs/common';
import { CashShift, ShiftStatus } from './models/cash-register.model';
import { AccountsService } from '../accounts.service';
import { TransactionType, AccountType } from '../models/account.model';
import * as crypto from 'crypto';

@Injectable()
export class CashService {
  constructor(private readonly accountsService: AccountsService) {}

  private shifts: CashShift[] = [];

  /**
   * 1. OPEN SHIFT
   * Cashier counts the float in the morning and opens the register.
   */
  async openShift(accountId: string, userId: string, reportedOpeningBalance: number) {
    const account = await this.accountsService.getAccount(accountId);
    
    if (account.type !== AccountType.CASH) {
      throw new BadRequestException('Shifts can only be opened on physical CASH accounts.');
    }

    const activeShift = this.shifts.find(s => s.accountId === accountId && s.status === ShiftStatus.OPEN);
    if (activeShift) {
      throw new BadRequestException('A shift is already open for this register.');
    }

    // In a strict environment, if the reported balance doesn't match the system's known balance
    // from the previous night, it flags management immediately.
    if (reportedOpeningBalance !== account.balance) {
      // E.g., someone stole $10 overnight from the safe.
      console.warn(`WARNING: Opening balance discrepancy. System expects ${account.balance}, Cashier reported ${reportedOpeningBalance}`);
    }

    const shift: CashShift = {
      id: crypto.randomUUID(),
      accountId,
      openedByUserId: userId,
      status: ShiftStatus.OPEN,
      openingBalance: reportedOpeningBalance,
      openedAt: new Date(),
    };

    this.shifts.push(shift);
    return shift;
  }

  /**
   * 2. EXPENSES (Cash Out / Petty Cash)
   * A manager takes $15 out of the drawer to pay the window washer.
   */
  async recordExpense(accountId: string, amount: number, description: string, userId: string) {
    this.ensureShiftIsOpen(accountId);

    // Hits the core treasury ledger to physically deduct the money
    await this.accountsService.postTransaction(
      accountId,
      TransactionType.CREDIT, // Money leaves the drawer
      amount,
      `EXP-${crypto.randomUUID()}`,
      `Cash Expense by ${userId}: ${description}`
    );

    return { success: true, message: `Expense of $${amount} recorded.` };
  }

  /**
   * 3. CASH DROP (Transfer from Register to Safe/Bank)
   * The drawer has too much cash, so the manager moves $500 to the backroom safe.
   */
  async performCashDrop(sourceAccountId: string, destinationAccountId: string, amount: number, userId: string) {
    this.ensureShiftIsOpen(sourceAccountId);
    
    const source = await this.accountsService.getAccount(sourceAccountId);
    if (source.balance < amount) {
      throw new BadRequestException('Cannot drop more cash than is currently in the drawer.');
    }

    // 1. Money leaves Register
    await this.accountsService.postTransaction(
      sourceAccountId,
      TransactionType.CREDIT,
      amount,
      `DROP-${crypto.randomUUID()}`,
      `Cash Drop by ${userId} to Safe`
    );

    // 2. Money enters Safe (or Bank)
    await this.accountsService.postTransaction(
      destinationAccountId,
      TransactionType.DEBIT,
      amount,
      `DROP-${crypto.randomUUID()}`,
      `Received Cash Drop from Register ${source.name}`
    );

    return { success: true, amount };
  }

  /**
   * 4. CLOSE SHIFT (The Blind Count)
   * At the end of the day, the cashier counts the money without knowing how much SHOULD be there.
   */
  async closeShift(accountId: string, userId: string, actualCountedBalance: number) {
    const shift = this.shifts.find(s => s.accountId === accountId && s.status === ShiftStatus.OPEN);
    if (!shift) {
      throw new BadRequestException('No open shift found for this register.');
    }

    const account = await this.accountsService.getAccount(accountId);
    
    // The system knows exactly what should be in the drawer based on the Treasury Ledger
    const expected = account.balance; 
    
    // The moment of truth: Does the physical money match the math?
    const difference = actualCountedBalance - expected;

    shift.status = ShiftStatus.CLOSED;
    shift.closedByUserId = userId;
    shift.expectedClosingBalance = expected;
    shift.actualClosingBalance = actualCountedBalance;
    shift.difference = difference;
    shift.closedAt = new Date();

    // STRICT RECONCILIATION:
    // If the cashier is short or over, we MUST adjust the ledger to match physical reality 
    // so tomorrow's shift doesn't inherit today's error.
    if (difference < 0) {
      // Shortage (Theft, or gave a customer too much change)
      await this.accountsService.postTransaction(
        accountId,
        TransactionType.CREDIT, // Remove phantom money from ledger
        Math.abs(difference),
        `SHORT-${shift.id}`,
        `Shift Closing Shortage. Expected: ${expected}, Counted: ${actualCountedBalance}`
      );
    } else if (difference > 0) {
      // Overage (Forgot to ring something up, or shortchanged a customer)
      await this.accountsService.postTransaction(
        accountId,
        TransactionType.DEBIT, // Add unrecorded money to ledger
        Math.abs(difference),
        `OVER-${shift.id}`,
        `Shift Closing Overage. Expected: ${expected}, Counted: ${actualCountedBalance}`
      );
    }

    return shift;
  }

  private ensureShiftIsOpen(accountId: string) {
    const activeShift = this.shifts.find(s => s.accountId === accountId && s.status === ShiftStatus.OPEN);
    if (!activeShift) {
      throw new BadRequestException('SECURITY BLOCK: A shift must be OPEN to perform this operation. The register is locked.');
    }
  }
}
