import { SaleReturn, ReturnAction, ReturnCondition } from './models/return.model';
import { StockMovementService } from '../../inventory/stock-movement.service';
import { AccountsService } from '../../finance/accounts.service';
import { CustomersService } from '../../customers/customers.service';
export declare class ReturnsService {
    private readonly stockService;
    private readonly accountsService;
    private readonly customersService;
    constructor(stockService: StockMovementService, accountsService: AccountsService, customersService: CustomersService);
    private returns;
    processReturn(payload: {
        originalOrderId: string;
        branchId: string;
        warehouseId: string;
        customerId?: string;
        refundAccountId?: string;
        lines: {
            originalOrderLineId: string;
            variantId: string;
            quantity: number;
            condition: ReturnCondition;
            action: ReturnAction;
            refundAmount: number;
            exchangeVariantId?: string;
        }[];
    }): Promise<SaleReturn>;
}
