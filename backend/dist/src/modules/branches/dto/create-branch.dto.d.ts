export declare class BranchConfigDto {
    timezone: string;
    isPosEnabled: boolean;
    taxIdentifier?: string;
}
export declare class CreateBranchDto {
    name: string;
    code: string;
    address: string;
    isActive?: boolean;
    config?: BranchConfigDto;
}
