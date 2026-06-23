export declare class WhatsAppEvolutionService {
    private readonly logger;
    private readonly baseUrl;
    private readonly apiKey;
    private readonly instance;
    sendText(phone: string, message: string): Promise<{
        success: boolean;
    }>;
    getStatus(): Promise<{
        isReady: boolean;
        qrCode: any;
    }>;
}
