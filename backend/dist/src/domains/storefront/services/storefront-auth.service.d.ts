import { PrismaService } from '../../../core/prisma/prisma.service';
import { RedisService } from '../../../core/redis/redis.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { JwtService } from '@nestjs/jwt';
export declare class StorefrontAuthService {
    private readonly prisma;
    private readonly redis;
    private readonly notifications;
    private readonly jwtService;
    private readonly logger;
    constructor(prisma: PrismaService, redis: RedisService, notifications: NotificationsService, jwtService: JwtService);
    requestOtp(phone: string): Promise<{
        success: boolean;
        message: string;
    }>;
    verifyOtp(phone: string, code: string): Promise<{
        success: boolean;
        token: string;
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
}
