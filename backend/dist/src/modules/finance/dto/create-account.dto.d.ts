import { AccountType } from '../models/account.model';
export declare class CreateAccountDto {
    name: string;
    type: AccountType;
    currency: string;
    branchId?: string;
}
