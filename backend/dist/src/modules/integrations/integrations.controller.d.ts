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
    receiveWebhook(event: string, signature: string, payload: any, req: RawBodyRequest<Request>): Promise<{
        received: boolean;
        jobId: string;
    }>;
}
