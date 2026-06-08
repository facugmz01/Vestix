export interface BranchConfig {
    id: string;
    branchId: string;
    timezone: string;
    isPosEnabled: boolean;
    receiptHeader?: string;
    receiptFooter?: string;
    taxIdentifier?: string;
    afipPointOfSale?: number;
    updatedAt: Date;
}
