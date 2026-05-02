"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var IntegrationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationsService = void 0;
const common_1 = require("@nestjs/common");
const crypto = __importStar(require("crypto"));
const sync_job_model_1 = require("./models/sync-job.model");
const woocommerce_api_service_1 = require("./woocommerce-api.service");
const checkout_orchestrator_1 = require("../sales/checkout.orchestrator");
const order_model_1 = require("../sales/models/order.model");
const MAX_ATTEMPTS = 5;
const BASE_DELAY_MS = 2000;
let IntegrationsService = IntegrationsService_1 = class IntegrationsService {
    constructor(wcApi, checkoutOrchestrator) {
        this.wcApi = wcApi;
        this.checkoutOrchestrator = checkoutOrchestrator;
        this.logger = new common_1.Logger(IntegrationsService_1.name);
        this.jobs = [];
    }
    async handleInboundWebhook(event, payload, wcSignature, rawBody) {
        const expectedSig = crypto
            .createHmac('sha256', process.env.WC_WEBHOOK_SECRET ?? 'mock-secret')
            .update(rawBody)
            .digest('base64');
        if (expectedSig !== wcSignature) {
            this.logger.error('[Webhook] ✗ Invalid signature — possible spoofed request');
            throw new common_1.BadRequestException('Invalid webhook signature');
        }
        const job = this.enqueueJob(sync_job_model_1.SyncDirection.INBOUND, event, payload, payload.id?.toString());
        setImmediate(() => this.processJob(job.id));
        return { received: true, jobId: job.id };
    }
    async syncStockToWooCommerce(variantId, newQuantity) {
        const mapping = this.getMockWcMapping(variantId);
        if (!mapping)
            return;
        const job = this.enqueueJob(sync_job_model_1.SyncDirection.OUTBOUND, 'STOCK_UPDATE', {
            variantId, newQuantity, ...mapping
        });
        setImmediate(() => this.processJob(job.id));
    }
    async syncPriceToWooCommerce(variantId, newPrice) {
        const mapping = this.getMockWcMapping(variantId);
        if (!mapping)
            return;
        const job = this.enqueueJob(sync_job_model_1.SyncDirection.OUTBOUND, 'PRICE_UPDATE', {
            variantId, newPrice, ...mapping
        });
        setImmediate(() => this.processJob(job.id));
    }
    async processJob(jobId) {
        const job = this.jobs.find(j => j.id === jobId);
        if (!job)
            return;
        job.status = sync_job_model_1.SyncJobStatus.PROCESSING;
        job.attempts += 1;
        job.updatedAt = new Date();
        try {
            if (job.direction === sync_job_model_1.SyncDirection.INBOUND) {
                await this.processInboundJob(job);
            }
            else {
                await this.processOutboundJob(job);
            }
            job.status = sync_job_model_1.SyncJobStatus.COMPLETED;
            job.updatedAt = new Date();
            this.logger.log(`[Sync] ✓ Job ${job.id} (${job.event}) completed`);
        }
        catch (err) {
            job.lastError = err.message;
            job.updatedAt = new Date();
            if (job.attempts < MAX_ATTEMPTS) {
                const delayMs = Math.pow(2, job.attempts) * BASE_DELAY_MS;
                job.status = sync_job_model_1.SyncJobStatus.RETRYING;
                this.logger.warn(`[Retry] Job ${job.id} failed (attempt ${job.attempts}/${MAX_ATTEMPTS}). Retrying in ${delayMs}ms`);
                setTimeout(() => this.processJob(jobId), delayMs);
            }
            else {
                job.status = sync_job_model_1.SyncJobStatus.FAILED;
                this.logger.error(`[Sync] ✗ Job ${job.id} permanently FAILED: ${err.message}`);
            }
        }
    }
    async processInboundJob(job) {
        if (job.event === sync_job_model_1.WooCommerceEvent.ORDER_CREATED) {
            const wcOrder = await this.wcApi.getOrder(job.payload.id);
            const erpOrderDto = {
                id: crypto.randomUUID(),
                branchId: 'E-COMMERCE-BRANCH',
                warehouseId: 'E-COMMERCE-WAREHOUSE',
                source: order_model_1.OrderSource.ECOMMERCE,
                customerId: undefined,
                lines: wcOrder.line_items.map((item) => ({
                    variantId: `wc-variation-${item.variation_id}`,
                    categoryId: 'ECOMMERCE',
                    quantity: item.quantity,
                })),
                paymentMethod: order_model_1.PaymentMethod.CREDIT_CARD,
                paymentAccountId: 'VIRTUAL-MP-ACCOUNT-ID',
                createdAtIso: new Date().toISOString(),
            };
            await this.checkoutOrchestrator.processCheckout(erpOrderDto);
            this.logger.log(`[Inbound] ✓ WooCommerce Order ${job.payload.id} imported into ERP`);
        }
    }
    async processOutboundJob(job) {
        const { wcProductId, wcVariationId } = job.payload;
        if (job.event === 'STOCK_UPDATE') {
            await this.wcApi.updateProductStock(wcProductId, wcVariationId, job.payload.newQuantity);
        }
        if (job.event === 'PRICE_UPDATE') {
            await this.wcApi.updateProductPrice(wcProductId, wcVariationId, job.payload.newPrice.toFixed(2));
        }
    }
    enqueueJob(direction, event, payload, externalId) {
        const job = {
            id: crypto.randomUUID(),
            direction,
            event,
            payload,
            status: sync_job_model_1.SyncJobStatus.QUEUED,
            attempts: 0,
            externalId,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.jobs.push(job);
        return job;
    }
    getMockWcMapping(variantId) {
        const mappings = {
            'mock-variant-id-123': { wcProductId: 101, wcVariationId: 202 },
        };
        return mappings[variantId] ?? null;
    }
};
exports.IntegrationsService = IntegrationsService;
exports.IntegrationsService = IntegrationsService = IntegrationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [woocommerce_api_service_1.WooCommerceApiService,
        checkout_orchestrator_1.CheckoutOrchestrator])
], IntegrationsService);
//# sourceMappingURL=integrations.service.js.map