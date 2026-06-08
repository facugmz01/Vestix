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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var IntegrationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationsService = void 0;
const common_1 = require("@nestjs/common");
const crypto = __importStar(require("crypto"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const axios_1 = __importDefault(require("axios"));
const woocommerce_api_service_1 = require("./woocommerce-api.service");
const checkout_orchestrator_1 = require("../sales/checkout.orchestrator");
const order_model_1 = require("../sales/models/order.model");
const prisma_service_1 = require("../../core/prisma/prisma.service");
const MAX_ATTEMPTS = 5;
const BASE_DELAY_MS = 2000;
let IntegrationsService = IntegrationsService_1 = class IntegrationsService {
    constructor(wcApi, checkoutOrchestrator, prisma) {
        this.wcApi = wcApi;
        this.checkoutOrchestrator = checkoutOrchestrator;
        this.prisma = prisma;
        this.logger = new common_1.Logger(IntegrationsService_1.name);
        this.configPath = path.join(__dirname, 'integrations-config.json');
    }
    readConfigs() {
        try {
            if (fs.existsSync(this.configPath)) {
                return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
            }
        }
        catch (e) {
            this.logger.error('Error reading config file:', e);
        }
        return {};
    }
    writeConfigs(configs) {
        try {
            fs.writeFileSync(this.configPath, JSON.stringify(configs, null, 2), 'utf8');
        }
        catch (e) {
            this.logger.error('Error writing config file:', e);
        }
    }
    async getAllIntegrations() {
        const configs = this.readConfigs();
        const providers = ['WOOCOMMERCE', 'AFIP'];
        return providers.map(prov => {
            const provLower = prov.toLowerCase();
            const provConfig = configs[provLower] || {};
            const isActive = provConfig.isActive ?? false;
            let status = 'PENDING_CONFIG';
            if (prov === 'WOOCOMMERCE') {
                if (provConfig.storeUrl && provConfig.consumerKey && provConfig.consumerSecret) {
                    status = isActive ? 'ACTIVE' : 'INACTIVE';
                }
            }
            else if (prov === 'AFIP') {
                if (provConfig.cuit) {
                    status = isActive ? 'ACTIVE' : 'INACTIVE';
                }
            }
            return {
                id: provLower,
                name: prov === 'WOOCOMMERCE' ? 'WooCommerce' : 'AFIP',
                provider: prov,
                status,
                lastSyncAt: provConfig.lastSyncAt ? new Date(provConfig.lastSyncAt).toISOString() : null,
                webhookUrl: prov === 'WOOCOMMERCE' ? `${process.env.BACKEND_URL || 'http://localhost:3000'}/integrations/woocommerce/webhook` : null,
                config: provConfig,
            };
        });
    }
    async getIntegration(id) {
        const integrations = await this.getAllIntegrations();
        const found = integrations.find(i => i.id === id.toLowerCase());
        if (!found) {
            throw new common_1.BadRequestException('Integración no encontrada');
        }
        return found;
    }
    async saveConfig(id, config) {
        const configs = this.readConfigs();
        const idLower = id.toLowerCase();
        configs[idLower] = {
            ...(configs[idLower] || {}),
            ...config,
        };
        this.writeConfigs(configs);
        return this.getIntegration(id);
    }
    async toggleActive(id, isActive) {
        const configs = this.readConfigs();
        const idLower = id.toLowerCase();
        configs[idLower] = {
            ...(configs[idLower] || {}),
            isActive,
        };
        this.writeConfigs(configs);
        return this.getIntegration(id);
    }
    async testConnection(id) {
        if (id.toLowerCase() === 'woocommerce') {
            try {
                const baseUrl = this.wcApi['getBaseUrl']();
                const auth = this.wcApi['getAuth']();
                await axios_1.default.get(`${baseUrl}/products`, { auth, params: { per_page: 1 }, timeout: 5000 });
                return { success: true, message: 'Conexión exitosa' };
            }
            catch (err) {
                return { success: false, message: `Fallo de conexión: ${err.message}` };
            }
        }
        if (id.toLowerCase() === 'afip') {
            return { success: true, message: 'Conexión simulada con AFIP homologación exitosa' };
        }
        return { success: false, message: 'Proveedor no soportado para test' };
    }
    async triggerSync(id) {
        if (id.toLowerCase() === 'woocommerce') {
            const configs = this.readConfigs();
            configs.woocommerce = {
                ...(configs.woocommerce || {}),
                lastSyncAt: new Date().toISOString(),
            };
            this.writeConfigs(configs);
            this.logger.log(`Full synchronization triggered for WooCommerce`);
            return { message: 'Sincronización iniciada' };
        }
        return { message: 'Sincronización no soportada' };
    }
    async getLogs(provider, filters) {
        const page = filters.page ? Number(filters.page) : 1;
        const pageSize = filters.pageSize ? Number(filters.pageSize) : 10;
        const skip = (page - 1) * pageSize;
        const where = {
            provider: provider.toUpperCase(),
        };
        if (filters.direction) {
            where.direction = filters.direction;
        }
        if (filters.success !== undefined) {
            where.status = filters.success ? 'SUCCESS' : 'FAILED';
        }
        const [data, total] = await Promise.all([
            this.prisma.integrationLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: pageSize,
            }),
            this.prisma.integrationLog.count({ where }),
        ]);
        const mappedData = data.map(log => ({
            id: log.id,
            integrationId: provider.toLowerCase(),
            direction: log.direction,
            event: log.action,
            statusCode: log.status === 'SUCCESS' ? 200 : (log.status === 'FAILED' ? 500 : undefined),
            responseTime: undefined,
            success: log.status === 'SUCCESS',
            payload: log.payload ? JSON.stringify(log.payload) : undefined,
            errorMessage: log.error || undefined,
            createdAt: log.createdAt.toISOString(),
        }));
        return {
            data: mappedData,
            meta: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        };
    }
    async retryLog(provider, logId) {
        const log = await this.prisma.integrationLog.findUnique({
            where: { id: logId }
        });
        if (!log) {
            throw new common_1.BadRequestException('Log no encontrado');
        }
        const updatedLog = await this.prisma.integrationLog.update({
            where: { id: logId },
            data: {
                status: 'PENDING',
                attempts: 0,
                error: null,
            }
        });
        setImmediate(() => this.processJob(logId));
        return {
            id: updatedLog.id,
            integrationId: provider.toLowerCase(),
            direction: updatedLog.direction,
            event: updatedLog.action,
            statusCode: undefined,
            responseTime: undefined,
            success: false,
            createdAt: updatedLog.createdAt.toISOString(),
        };
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
        const job = await this.prisma.integrationLog.create({
            data: {
                provider: 'WOOCOMMERCE',
                direction: 'INBOUND',
                action: event,
                status: 'PENDING',
                payload: payload,
                attempts: 0,
            },
        });
        setImmediate(() => this.processJob(job.id));
        return { received: true, jobId: job.id };
    }
    async syncStockToWooCommerce(variantId, newQuantity) {
        const mapping = await this.prisma.wcVariantMapping.findUnique({
            where: { variantId },
        });
        if (!mapping)
            return;
        const job = await this.prisma.integrationLog.create({
            data: {
                provider: 'WOOCOMMERCE',
                direction: 'OUTBOUND',
                action: 'STOCK_UPDATE',
                status: 'PENDING',
                payload: { variantId, newQuantity, ...mapping },
                attempts: 0,
            },
        });
        setImmediate(() => this.processJob(job.id));
    }
    async syncPriceToWooCommerce(variantId, newPrice) {
        const mapping = await this.prisma.wcVariantMapping.findUnique({
            where: { variantId },
        });
        if (!mapping)
            return;
        const job = await this.prisma.integrationLog.create({
            data: {
                provider: 'WOOCOMMERCE',
                direction: 'OUTBOUND',
                action: 'PRICE_UPDATE',
                status: 'PENDING',
                payload: { variantId, newPrice, ...mapping },
                attempts: 0,
            },
        });
        setImmediate(() => this.processJob(job.id));
    }
    async processJob(jobId) {
        const job = await this.prisma.integrationLog.findUnique({ where: { id: jobId } });
        if (!job)
            return;
        await this.prisma.integrationLog.update({
            where: { id: jobId },
            data: {
                status: 'PROCESSING',
                attempts: { increment: 1 },
            },
        });
        try {
            if (job.direction === 'INBOUND') {
                await this.processInboundJob(job);
            }
            else {
                await this.processOutboundJob(job);
            }
            await this.prisma.integrationLog.update({
                where: { id: jobId },
                data: {
                    status: 'SUCCESS',
                    response: { success: true },
                },
            });
            this.logger.log(`[Sync] ✓ Job ${job.id} (${job.action}) completed`);
        }
        catch (err) {
            const currentAttempts = job.attempts + 1;
            const errorMessage = err.message || 'Unknown error';
            if (currentAttempts < MAX_ATTEMPTS) {
                const delayMs = Math.pow(2, currentAttempts) * BASE_DELAY_MS;
                await this.prisma.integrationLog.update({
                    where: { id: jobId },
                    data: {
                        status: 'RETRYING',
                        error: errorMessage,
                    },
                });
                this.logger.warn(`[Retry] Job ${job.id} failed (attempt ${currentAttempts}/${MAX_ATTEMPTS}). Retrying in ${delayMs}ms`);
                setTimeout(() => this.processJob(jobId), delayMs);
            }
            else {
                await this.prisma.integrationLog.update({
                    where: { id: jobId },
                    data: {
                        status: 'FAILED',
                        error: errorMessage,
                    },
                });
                this.logger.error(`[Sync] ✗ Job ${job.id} permanently FAILED: ${errorMessage}`);
            }
        }
    }
    async processInboundJob(job) {
        if (job.action === 'woocommerce_new_order' || job.action === 'order.created') {
            const payload = job.payload;
            const wcOrder = await this.wcApi.getOrder(payload.id);
            const branch = await this.prisma.branch.findFirst({ where: { isMain: true } }) || await this.prisma.branch.findFirst();
            if (!branch) {
                throw new Error('No se encontró una sucursal en el ERP para asociar el pedido de WooCommerce.');
            }
            const warehouse = await this.prisma.warehouse.findFirst({ where: { branchId: branch.id } });
            const erpOrderDto = {
                id: crypto.randomUUID(),
                branchId: branch.id,
                warehouseId: warehouse?.id || null,
                source: order_model_1.OrderSource.ECOMMERCE,
                customerId: undefined,
                lines: wcOrder.line_items.map((item) => ({
                    variantId: `wc-variation-${item.variation_id}`,
                    categoryId: 'ECOMMERCE',
                    quantity: item.quantity,
                })),
                paymentMethod: order_model_1.PaymentMethod.CREDIT_CARD,
                paymentAccountId: undefined,
                createdAtIso: new Date().toISOString(),
            };
            await this.checkoutOrchestrator.processCheckout(erpOrderDto);
            this.logger.log(`[Inbound] ✓ WooCommerce Order ${payload.id} imported into ERP`);
        }
    }
    async processOutboundJob(job) {
        const payload = job.payload;
        const { wcProductId, wcVariationId } = payload;
        if (job.action === 'STOCK_UPDATE') {
            await this.wcApi.updateProductStock(wcProductId, wcVariationId, payload.newQuantity);
        }
        if (job.action === 'PRICE_UPDATE') {
            await this.wcApi.updateProductPrice(wcProductId, wcVariationId, payload.newPrice.toFixed(2));
        }
    }
    async getWcMappings() {
        return this.prisma.wcVariantMapping.findMany({
            include: {
                variant: {
                    include: {
                        product: true,
                    },
                },
            },
        });
    }
    async saveWcMapping(variantId, wcProductId, wcVariationId) {
        return this.prisma.wcVariantMapping.upsert({
            where: { variantId },
            create: {
                variantId,
                wcProductId,
                wcVariationId,
            },
            update: {
                wcProductId,
                wcVariationId,
            },
        });
    }
    async deleteWcMapping(variantId) {
        return this.prisma.wcVariantMapping.delete({
            where: { variantId },
        });
    }
};
exports.IntegrationsService = IntegrationsService;
exports.IntegrationsService = IntegrationsService = IntegrationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [woocommerce_api_service_1.WooCommerceApiService,
        checkout_orchestrator_1.CheckoutOrchestrator,
        prisma_service_1.PrismaService])
], IntegrationsService);
//# sourceMappingURL=integrations.service.js.map