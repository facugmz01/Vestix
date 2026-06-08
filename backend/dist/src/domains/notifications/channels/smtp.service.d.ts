export declare class SmtpService {
    private readonly logger;
    send(to: string, subject: string, body: string): Promise<{
        success: boolean;
    }>;
}
