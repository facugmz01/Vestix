import { Response, Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../core/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class StorefrontAuthController {
    private readonly prisma;
    private readonly jwtService;
    private readonly notificationsService;
    private readonly logger;
    private readonly otpStore;
    private readonly OTP_EXPIRY_MS;
    private readonly RESEND_COOLDOWN_MS;
    private readonly MAX_ATTEMPTS;
    constructor(prisma: PrismaService, jwtService: JwtService, notificationsService: NotificationsService);
    sendOtp(body: {
        phone: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    verifyOtp(body: {
        phone: string;
        code: string;
    }, res: Response): Promise<{
        success: boolean;
        customer: {
            id: string;
            fullName: string;
            phone: string;
            email: string;
        };
    }>;
    getMe(req: Request): Promise<{
        id: string;
        phone: string;
        email: string;
        fullName: string;
    }>;
    logout(res: Response): Promise<{
        success: boolean;
        message: string;
    }>;
    private normalizePhone;
}
