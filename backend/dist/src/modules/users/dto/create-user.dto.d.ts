export declare enum UserRole {
    SUPER_ADMIN = "SUPER_ADMIN",
    STORE_MANAGER = "STORE_MANAGER",
    CASHIER = "CASHIER",
    WAREHOUSE_OPERATOR = "WAREHOUSE_OPERATOR"
}
export declare class CreateUserDto {
    email: string;
    fullName: string;
    password?: string;
    role: string;
    branchId?: string;
}
