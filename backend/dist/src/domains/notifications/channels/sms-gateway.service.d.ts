import { PrismaService } from '../../../core/prisma/prisma.service';
export declare class SmsGatewayService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    sendSms(phone: string, message: string): Promise<{
        success: boolean;
        error: string;
    } | {
        success: boolean;
        error?: undefined;
    }>;
}
