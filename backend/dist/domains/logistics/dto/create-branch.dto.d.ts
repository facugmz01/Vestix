export declare class CreateBranchDto {
    name: string;
    code: string;
    address?: string;
    phone?: string;
    isActive?: boolean;
    isMain?: boolean;
    settings?: {
        taxId?: string;
        posReceiptHeader?: string;
        posReceiptFooter?: string;
    };
    config?: {
        timezone?: string;
        isPosEnabled?: boolean;
        taxIdentifier?: string;
    };
}
