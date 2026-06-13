import { PrismaService } from '../../../core/prisma/prisma.service';
export declare class WhatsAppOpenWaService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    sendText(phone: string, message: string): Promise<{
        success: boolean;
        error: string;
    } | {
        success: boolean;
        error?: undefined;
    }>;
    getStatus(): Promise<{
        isReady: boolean;
        qrCode: any;
    }>;
}
