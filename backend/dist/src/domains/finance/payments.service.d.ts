import { PaymentProvider } from './models/payment.model';
import { MercadoPagoService } from './mercado-pago.service';
import { OrdersFulfillmentService } from '../sales/orders/orders-fulfillment.service';
import { AccountsService } from './accounts.service';
import { PrismaService } from '../../core/prisma/prisma.service';
export declare class PaymentsService {
    private readonly mpService;
    private readonly ordersService;
    private readonly accountsService;
    private readonly prisma;
    constructor(mpService: MercadoPagoService, ordersService: OrdersFulfillmentService, accountsService: AccountsService, prisma: PrismaService);
    createOnlinePayment(orderId: string, amount: number, title: string, provider: PaymentProvider): Promise<{
        intentId: string;
        checkoutUrl: string;
    }>;
    handleWebhook(provider: PaymentProvider, payload: any): Promise<{
        status: string;
    }>;
}
