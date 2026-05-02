import { RawBodyRequest } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { Request } from 'express';
export declare class IntegrationsController {
    private readonly integrationsService;
    constructor(integrationsService: IntegrationsService);
    receiveWebhook(event: string, signature: string, payload: any, req: RawBodyRequest<Request>): Promise<{
        received: boolean;
        jobId: string;
    }>;
}
