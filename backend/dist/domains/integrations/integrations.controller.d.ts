import { RawBodyRequest } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { Request } from 'express';
export declare class IntegrationsController {
    private readonly integrationsService;
    constructor(integrationsService: IntegrationsService);
    getIntegrations(): Promise<{
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
    getWebhookLogs(id: string, page?: string, pageSize?: string, success?: string, direction?: string): Promise<{
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
    retryWebhook(id: string, logId: string): Promise<{
        id: string;
        integrationId: string;
        direction: "INBOUND" | "OUTBOUND";
        event: string;
        statusCode: any;
        responseTime: any;
        success: boolean;
        createdAt: string;
    }>;
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
    receiveWebhook(event: string, signature: string, payload: any, req: RawBodyRequest<Request>): Promise<{
        received: boolean;
        jobId: string;
    }>;
}
