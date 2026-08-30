import { get, post, patch, del } from './client';
import { cleanParams } from './requestUtils';
import type {
  CurrentAccount,
  CurrentAccountMovement,
  FinancialAccount,
  PagedResponse,
  PaymentMethodEntity,
  Expense,
  ExpenseCategory,
  ExpenseSummary,
  AccountAdjustment,
} from '@/types';

export interface CurrentAccountFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  entityType?: 'CUSTOMER' | 'SUPPLIER';
}

export interface MovementFilters {
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
}

export interface ExpenseFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  expenseCategoryId?: string;
  branchId?: string;
  financialAccountId?: string;
  cashShiftId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface CreateExpensePayload {
  expenseCategoryId: string;
  amount: number;
  currency?: string;
  date?: string;
  description: string;
  notes?: string;
  receiptNumber?: string;
  voucherUrl?: string;
  originType: 'CASH_SHIFT' | 'FINANCIAL_ACCOUNT';
  cashShiftId?: string;
  financialAccountId?: string;
  branchId?: string;
}

export interface CreateExpenseCategoryPayload {
  name: string;
  code: string;
  description?: string;
  parentId?: string;
  isActive?: boolean;
}

export interface AdjustAccountPayload {
  adjustedBalance: number;
  reason: string;
}

export const financeApi = {
  getTreasuryAccounts: () => get<FinancialAccount[]>('/finance/treasury/accounts'),
  getAccounts: () => get<FinancialAccount[]>('/finance/treasury/accounts'),

  createTreasuryAccount: (dto: {
    name: string;
    type: string;
    currency?: string;
    branchId?: string;
    initialBalance?: number;
  }) => post<FinancialAccount>('/finance/treasury/accounts', dto),

  updateTreasuryAccount: (
    id: string,
    dto: {
      name?: string;
      type?: string;
      currency?: string;
      branchId?: string | null;
      isActive?: boolean;
    },
  ) => patch<FinancialAccount>(`/finance/treasury/accounts/${id}`, dto),

  getTreasuryAccountTransactions: (accountId: string, filters?: { page?: number; pageSize?: number }) =>
    get<{
      account: FinancialAccount;
      data: {
        id: string;
        accountId: string;
        type: 'DEBIT' | 'CREDIT';
        amount: number;
        referenceId?: string;
        description?: string;
        createdAt: string;
      }[];
      total: number;
      page: number;
      pageSize: number;
    }>(`/finance/treasury/accounts/${accountId}/transactions`, { params: cleanParams(filters ?? {}) }),

  adjustAccount: (accountId: string, payload: AdjustAccountPayload) =>
    post<AccountAdjustment>(`/finance/treasury/accounts/${accountId}/adjust`, payload),

  getAccountAdjustments: (accountId: string) =>
    get<AccountAdjustment[]>(`/finance/treasury/accounts/${accountId}/adjustments`),

  getPaymentMethods: () => get<PaymentMethodEntity[]>('/finance/payment-methods'),

  getCurrentAccounts: (filters?: CurrentAccountFilters) =>
    get<PagedResponse<CurrentAccount>>('/finance/current-accounts', { params: cleanParams(filters ?? {}) }),

  getCurrentAccount: (id: string) =>
    get<CurrentAccount>(`/finance/current-accounts/${id}`),

  getMovements: (accountId: string, filters?: MovementFilters) =>
    get<PagedResponse<CurrentAccountMovement>>(`/finance/current-accounts/${accountId}/movements`, { params: cleanParams(filters ?? {}) }),

  // Action endpoints for generating receipts/notes
  registerPaymentReceipt: (
    accountId: string,
    payload: {
      amount: number;
      referenceId: string;
      description?: string;
      financialAccountId?: string;
    },
  ) => post<CurrentAccountMovement>(`/finance/current-accounts/${accountId}/receipts`, payload),

  linkMovementFinancialAccount: (
    movementId: string,
    payload: { financialAccountId: string; applyBalanceEffect?: boolean },
  ) =>
    patch<CurrentAccountMovement>(
      `/finance/current-accounts/movements/${movementId}/link-financial-account`,
      payload,
    ),

  issueCreditNote: (accountId: string, payload: { amount: number; referenceId: string; description?: string }) =>
    post<CurrentAccountMovement>(`/finance/current-accounts/${accountId}/credit-notes`, payload),

  issueDebitNote: (accountId: string, payload: { amount: number; referenceId: string; description?: string; dueDate?: string }) =>
    post<CurrentAccountMovement>(`/finance/current-accounts/${accountId}/debit-notes`, payload),

  sendOverdueStatements: () =>
    post<{ success: boolean; message: string }>('/finance/current-accounts/send-overdue'),

  sendManualStatement: (accountId: string, payload: { channel: 'EMAIL' | 'WHATSAPP' | 'SMS'; recipient: string }) =>
    post<{ success: boolean; message: string }>(`/finance/current-accounts/${accountId}/send-statement`, payload),

  // ─── EXPENSES ENDPOINTS ──────────────────────────────────────────────────
  getExpenses: (filters?: ExpenseFilters) =>
    get<PagedResponse<Expense>>('/finance/expenses', { params: cleanParams(filters ?? {}) }),

  getExpensesSummary: (filters?: ExpenseFilters) =>
    get<ExpenseSummary>('/finance/expenses/summary', { params: cleanParams(filters ?? {}) }),

  getExpenseById: (id: string) =>
    get<Expense>(`/finance/expenses/${id}`),

  createExpense: (payload: CreateExpensePayload) =>
    post<Expense>('/finance/expenses', payload),

  cancelExpense: (id: string, reason: string) =>
    post<Expense>(`/finance/expenses/${id}/cancel`, { reason }),

  getExpenseCategories: (includeInactive = false) =>
    get<ExpenseCategory[]>('/finance/expenses/categories', {
      params: includeInactive ? { includeInactive: 'true' } : undefined,
    }),

  createExpenseCategory: (payload: CreateExpenseCategoryPayload) =>
    post<ExpenseCategory>('/finance/expenses/categories', payload),

  updateExpenseCategory: (id: string, payload: Partial<CreateExpenseCategoryPayload>) =>
    patch<ExpenseCategory>(`/finance/expenses/categories/${id}`, payload),

  deleteExpenseCategory: (id: string) =>
    del<ExpenseCategory>(`/finance/expenses/categories/${id}`),
};

