import { WooCommerceApiService } from './woocommerce-api.service';
import { CheckoutOrchestrator } from '../sales/checkout.orchestrator';
import { PrismaService } from '../../core/prisma/prisma.service';
export interface WebhookLogsFilters {
    page?: number;
    pageSize?: number;
    success?: boolean;
    direction?: string;
}
export declare class IntegrationsService {
    private readonly wcApi;
    private readonly checkoutOrchestrator;
    private readonly prisma;
    private readonly logger;
    private readonly configPath;
    constructor(wcApi: WooCommerceApiService, checkoutOrchestrator: CheckoutOrchestrator, prisma: PrismaService);
    private readConfigs;
    private writeConfigs;
    getAllIntegrations(): Promise<{
        id: string;
        name: string;
        provider: string;
        status: string;
        lastSyncAt: string;
        webhookUrl: string;
        config: any;
    }[]>;
    getIntegration(id: string): Promise<{
        id: string;
        name: string;
        provider: string;
        status: string;
        lastSyncAt: string;
        webhookUrl: string;
        config: any;
    }>;
    saveConfig(id: string, config: Record<string, string>): Promise<{
        id: string;
        name: string;
        provider: string;
        status: string;
        lastSyncAt: string;
        webhookUrl: string;
        config: any;
    }>;
    toggleActive(id: string, isActive: boolean): Promise<{
        id: string;
        name: string;
        provider: string;
        status: string;
        lastSyncAt: string;
        webhookUrl: string;
        config: any;
    }>;
    testConnection(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    triggerSync(id: string): Promise<{
        message: string;
    }>;
    getLogs(provider: string, filters: WebhookLogsFilters): Promise<{
        data: {
            id: string;
            integrationId: string;
            direction: "INBOUND" | "OUTBOUND";
            event: string;
            statusCode: number;
            responseTime: any;
            success: boolean;
            payload: string;
            errorMessage: string;
            createdAt: string;
        }[];
        meta: {
            total: number;
            page: number;
            pageSize: number;
            totalPages: number;
        };
    }>;
    retryLog(provider: string, logId: string): Promise<{
        id: string;
        integrationId: string;
        direction: "INBOUND" | "OUTBOUND";
        event: string;
        statusCode: any;
        responseTime: any;
        success: boolean;
        createdAt: string;
    }>;
    handleInboundWebhook(event: string, payload: Record<string, any>, wcSignature: string, rawBody: Buffer): Promise<{
        received: boolean;
        jobId: string;
    }>;
    syncStockToWooCommerce(variantId: string, newQuantity: number): Promise<void>;
    syncPriceToWooCommerce(variantId: string, newPrice: number): Promise<void>;
    processJob(jobId: string): Promise<void>;
    private processInboundJob;
    private processOutboundJob;
    private getMockWcMapping;
}
