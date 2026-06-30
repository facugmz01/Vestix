import { StorefrontAuthService } from '../services/storefront-auth.service';
import { Response, Request } from 'express';
export declare class StorefrontAuthController {
    private readonly authService;
    constructor(authService: StorefrontAuthService);
    requestOtp(phone: string): Promise<{
        success: boolean;
        message: string;
    }>;
    verifyOtp(phone: string, code: string, res: Response): Promise<{
        success: boolean;
        customer: {
            id: string;
            type: string;
            fullName: string;
            taxId: string | null;
            email: string | null;
            phone: string | null;
            creditLimit: number;
            usedCredit: number;
            isActive: boolean;
            priceListId: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    logout(res: Response): Promise<{
        success: boolean;
    }>;
    me(req: Request): Promise<{
        authenticated: boolean;
    }>;
}
