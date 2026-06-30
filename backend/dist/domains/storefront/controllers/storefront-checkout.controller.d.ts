import { StorefrontCheckoutService, CheckoutDto } from '../services/storefront-checkout.service';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
export declare class StorefrontCheckoutController {
    private readonly checkoutService;
    private readonly jwtService;
    constructor(checkoutService: StorefrontCheckoutService, jwtService: JwtService);
    processCheckout(req: Request, dto: CheckoutDto): Promise<{
        success: boolean;
        orderId: string;
        total: number;
        payment: any;
    }>;
}
