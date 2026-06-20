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
        success: boolean;
    }>;
    toggleActive(id: string, isActive: boolean): Promise<{
        success: boolean;
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
    getWcMappings(): Promise<({
        variant: {
            product: {
                id: string;
                name: string;
                baseSku: string | null;
                description: string | null;
                categoryId: string;
                brandId: string | null;
                type: import(".prisma/client").$Enums.ProductType;
                isVariable: boolean;
                manageBatches: boolean;
                costPrice: number;
                isActive: boolean;
                isPublished: boolean;
                images: import(".prisma/client").Prisma.JsonValue;
                metadata: import(".prisma/client").Prisma.JsonValue;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            productId: string;
            sku: string;
            barcode: string | null;
            size: string | null;
            color: string | null;
            imageUrl: string | null;
            costPrice: number;
            basePrice: number;
            isActive: boolean;
            attributes: import(".prisma/client").Prisma.JsonValue;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        variantId: string;
        wcProductId: number;
        wcVariationId: number;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    saveWcMapping(variantId: string, wcProductId: number, wcVariationId: number): Promise<{
        id: string;
        variantId: string;
        wcProductId: number;
        wcVariationId: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deleteWcMapping(variantId: string): Promise<{
        id: string;
        variantId: string;
        wcProductId: number;
        wcVariationId: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
