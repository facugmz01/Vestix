import { PrismaService } from '../../../core/prisma/prisma.service';
import { SettingsService } from '../../../modules/settings/settings.service';
export interface CheckoutDto {
    id?: string;
    customerInfo: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        documentType: string;
        documentNumber: string;
    };
    shippingInfo: {
        method: 'SHIPPING' | 'PICKUP';
        address?: string;
        city?: string;
        state?: string;
        zipCode?: string;
    };
    paymentMethod: string;
    cartLines: {
        variantId: string;
        quantity: number;
        price: number;
    }[];
    issueInvoice?: boolean;
}
export declare class StorefrontCheckoutService {
    private readonly prisma;
    private readonly settingsService;
    private readonly logger;
    constructor(prisma: PrismaService, settingsService: SettingsService);
    processCheckout(authCustomerId: string | null, dto: CheckoutDto): Promise<{
        success: boolean;
        orderId: string;
        total: number;
        payment: any;
    }>;
}
