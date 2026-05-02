import { WooCommerceApiService } from './woocommerce-api.service';
import { CheckoutOrchestrator } from '../sales/checkout.orchestrator';
export declare class IntegrationsService {
    private readonly wcApi;
    private readonly checkoutOrchestrator;
    private readonly logger;
    private jobs;
    constructor(wcApi: WooCommerceApiService, checkoutOrchestrator: CheckoutOrchestrator);
    handleInboundWebhook(event: string, payload: Record<string, any>, wcSignature: string, rawBody: Buffer): Promise<{
        received: boolean;
        jobId: string;
    }>;
    syncStockToWooCommerce(variantId: string, newQuantity: number): Promise<void>;
    syncPriceToWooCommerce(variantId: string, newPrice: number): Promise<void>;
    processJob(jobId: string): Promise<void>;
    private processInboundJob;
    private processOutboundJob;
    private enqueueJob;
    private getMockWcMapping;
}
