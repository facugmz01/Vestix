import { PaymentProvider } from './models/payment.model';
import { MercadoPagoService } from './mercado-pago.service';
import { OrdersFulfillmentService } from '../sales/orders/orders-fulfillment.service';
import { AccountsService } from '../finance/accounts.service';
export declare class PaymentsService {
    private readonly mpService;
    private readonly ordersService;
    private readonly accountsService;
    constructor(mpService: MercadoPagoService, ordersService: OrdersFulfillmentService, accountsService: AccountsService);
    private intents;
    createOnlinePayment(orderId: string, amount: number, title: string, provider: PaymentProvider): Promise<{
        intentId: string;
        checkoutUrl: string;
    }>;
    handleWebhook(provider: PaymentProvider, payload: any): Promise<{
        status: string;
    }>;
}
