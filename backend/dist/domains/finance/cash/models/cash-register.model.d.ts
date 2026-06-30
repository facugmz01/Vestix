export declare enum ShiftStatus {
    OPEN = "OPEN",
    CLOSED = "CLOSED"
}
export interface CashShift {
    id: string;
    accountId: string;
    openedByUserId: string;
    closedByUserId?: string;
    status: ShiftStatus;
    openingBalance: number;
    expectedClosingBalance?: number;
    actualClosingBalance?: number;
    difference?: number;
    openedAt: Date;
    closedAt?: Date;
}
