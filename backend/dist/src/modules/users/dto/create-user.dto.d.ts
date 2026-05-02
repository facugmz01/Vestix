export declare enum UserRole {
    SUPER_ADMIN = "SUPER_ADMIN",
    STORE_MANAGER = "STORE_MANAGER",
    CASHIER = "CASHIER",
    WAREHOUSE_OPERATOR = "WAREHOUSE_OPERATOR"
}
export declare class CreateUserDto {
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    branchIds?: string[];
}
