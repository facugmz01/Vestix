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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var StorefrontController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorefrontController = void 0;
const common_1 = require("@nestjs/common");
const checkout_orchestrator_1 = require("./checkout.orchestrator");
const sales_service_1 = require("./sales.service");
const prisma_service_1 = require("../../core/prisma/prisma.service");
const mercadopago_service_1 = require("./mercadopago.service");
const inventory_service_1 = require("../logistics/inventory.service");
const storefront_auth_guard_1 = require("./storefront-auth.guard");
const settings_service_1 = require("../../modules/settings/settings.service");
const crypto = __importStar(require("crypto"));
const SHIPPING_RATES = {
    SHIPPING: 3500,
    PICKUP: 0,
};
let StorefrontController = StorefrontController_1 = class StorefrontController {
    constructor(checkoutOrchestrator, salesService, prisma, mercadoPagoService, inventoryService, settingsService) {
        this.checkoutOrchestrator = checkoutOrchestrator;
        this.salesService = salesService;
        this.prisma = prisma;
        this.mercadoPagoService = mercadoPagoService;
        this.inventoryService = inventoryService;
        this.settingsService = settingsService;
        this.logger = new common_1.Logger(StorefrontController_1.name);
    }
    async getManifest() {
        const pwa = await this.settingsService.getPwaSettings();
        return {
            short_name: pwa.appShortName || 'VentaWeb',
            name: pwa.appName || 'VentaWeb - ERP & Tienda',
            description: 'Sistema ERP y Tienda Online',
            icons: [
                {
                    src: pwa.iconUrl || '/favicon.svg',
                    type: pwa.iconUrl?.endsWith('.png') ? 'image/png' : 'image/svg+xml',
                    sizes: '192x192 512x512',
                    purpose: 'any maskable'
                }
            ],
            start_url: '/',
            display: 'standalone',
            background_color: pwa.backgroundColor || '#ffffff',
            theme_color: pwa.themeColor || '#3b82f6',
            orientation: 'portrait-primary',
        };
    }
    async getSettings() {
        const storefront = await this.settingsService.getStorefrontSettings();
        const pwa = await this.settingsService.getPwaSettings();
        let paymentMethods = [];
        if (storefront.allowedPaymentMethods?.length > 0) {
            paymentMethods = await this.prisma.paymentMethod.findMany({
                where: { id: { in: storefront.allowedPaymentMethods }, isActive: true },
                select: { id: true, name: true, type: true }
            });
        }
        return {
            ...storefront,
            pwa,
            paymentMethods,
        };
    }
    async checkout(dto, req) {
        const reqUser = req.user;
        let customerId = reqUser?.customerId || null;
        if (!customerId && dto.customerInfo) {
            const conditions = [];
            if (dto.customerInfo.email)
                conditions.push({ email: dto.customerInfo.email });
            if (dto.customerInfo.documentNumber)
                conditions.push({ taxId: dto.customerInfo.documentNumber });
            let customer = conditions.length > 0
                ? await this.prisma.customer.findFirst({ where: { OR: conditions } })
                : null;
            if (!customer) {
                customer = await this.prisma.customer.create({
                    data: {
                        fullName: `${dto.customerInfo.firstName || ''} ${dto.customerInfo.lastName || ''}`.trim() || 'Cliente Web',
                        email: dto.customerInfo.email || null,
                        phone: dto.customerInfo.phone || null,
                        taxId: dto.customerInfo.documentNumber || null,
                        type: 'INDIVIDUAL',
                    },
                });
            }
            customerId = customer.id;
        }
        const branch = await this.prisma.branch.findFirst({ where: { isMain: true } });
        if (!branch)
            throw new Error('No se encontró la sucursal principal.');
        const warehouse = await this.prisma.warehouse.findFirst({ where: { branchId: branch.id } });
        const storefront = await this.settingsService.getStorefrontSettings();
        const shippingMethods = storefront.shippingMethods || [];
        const selectedShipping = shippingMethods.find(m => m.id === dto.shippingInfo?.method);
        const shippingCost = selectedShipping ? selectedShipping.price : 0;
        const shippingMethodLabel = selectedShipping ? selectedShipping.type : 'PICKUP';
        const paymentMethodId = dto.paymentMethod;
        const selectedPaymentMethod = await this.prisma.paymentMethod.findUnique({ where: { id: paymentMethodId } });
        if (!selectedPaymentMethod) {
            throw new Error('Método de pago no válido.');
        }
        const orderId = dto.id || crypto.randomUUID();
        const saleOrderDto = {
            id: orderId,
            branchId: branch.id,
            warehouseId: warehouse?.id || null,
            source: 'ECOMMERCE',
            customerId,
            paymentMethod: selectedPaymentMethod.type,
            paymentAccountId: null,
            status: 'PENDING_PAYMENT',
            lines: dto.cartLines.map((l) => ({
                variantId: l.variantId,
                quantity: l.quantity,
                unitPriceOverride: l.price,
            })),
        };
        const order = await this.checkoutOrchestrator.processCheckout(saleOrderDto);
        if (selectedPaymentMethod.type === 'CREDIT_CARD' || selectedPaymentMethod.type === 'DEBIT_CARD') {
            const storeBase = process.env.MP_STORE_URL || 'http://localhost:5173/store';
            const { initPoint, preferenceId } = await this.mercadoPagoService.createPreference({
                externalReference: orderId,
                items: dto.cartLines.map((l) => ({
                    id: l.variantId,
                    title: l.name || `Producto (${l.variantId.slice(0, 8)})`,
                    quantity: l.quantity,
                    unit_price: l.price,
                })),
                payer: dto.customerInfo ? {
                    name: `${dto.customerInfo.firstName || ''} ${dto.customerInfo.lastName || ''}`.trim(),
                    email: dto.customerInfo.email,
                } : undefined,
                shippingCost,
                backUrls: {
                    success: `${storeBase}/checkout/success?orderId=${orderId}`,
                    failure: `${storeBase}/checkout/failure?orderId=${orderId}`,
                    pending: `${storeBase}/checkout/pending?orderId=${orderId}`,
                },
            });
            return {
                ...order,
                payment: {
                    method: 'MERCADOPAGO',
                    initPoint,
                    preferenceId,
                    shippingCost,
                    shippingMethod: shippingMethodLabel,
                },
            };
        }
        return {
            ...order,
            payment: {
                method: selectedPaymentMethod.type,
                shippingCost,
                shippingMethod: shippingMethodLabel,
            },
        };
    }
    async getMyOrders(page, pageSize, req) {
        const reqUser = req.user;
        const customerId = reqUser.customerId;
        const pageNum = parseInt(page) || 1;
        const sizeNum = parseInt(pageSize) || 15;
        const skip = (pageNum - 1) * sizeNum;
        const [data, total] = await Promise.all([
            this.prisma.saleOrder.findMany({
                where: { source: 'ECOMMERCE', customerId },
                skip,
                take: sizeNum,
                orderBy: { createdAt: 'desc' },
                include: { lines: true, customer: true },
            }),
            this.prisma.saleOrder.count({
                where: { source: 'ECOMMERCE', customerId },
            }),
        ]);
        return {
            data: data.map(order => ({
                ...order,
                customerName: order.customer?.fullName || 'Consumidor Final',
            })),
            total,
            page: pageNum,
            pageSize: sizeNum,
        };
    }
    async getMyOrder(id, req) {
        const reqUser = req.user;
        const customerId = reqUser.customerId;
        const order = await this.salesService.getOrderById(id);
        if (!order)
            throw new common_1.ForbiddenException('Pedido no encontrado.');
        if (order.customerId !== customerId) {
            throw new common_1.ForbiddenException('No tenés permiso para ver este pedido.');
        }
        return order;
    }
    async mercadoPagoWebhook(body, req) {
        this.logger.log(`[MercadoPago Webhook] Received: ${JSON.stringify(body)}`);
        const type = body?.type || body?.action;
        const resourceId = body?.data?.id || body?.resource;
        if (!type || !resourceId) {
            return { received: true };
        }
        const mpWebhookSecret = process.env.MP_WEBHOOK_SECRET;
        if (!mpWebhookSecret) {
            this.logger.warn('[MercadoPago Webhook] No MP_WEBHOOK_SECRET configured, skipping signature verification');
        }
        else {
            const xSignature = req.headers['x-signature'];
            const xRequestId = req.headers['x-request-id'];
            if (!xSignature || !xRequestId) {
                this.logger.warn('[MercadoPago Webhook] Missing x-signature or x-request-id header, rejecting request');
                return { received: false, error: 'Signature headers missing' };
            }
            try {
                const parts = xSignature.split(',');
                const tsPart = parts.find(p => p.trim().startsWith('ts='));
                const v1Part = parts.find(p => p.trim().startsWith('v1='));
                if (!tsPart || !v1Part) {
                    this.logger.warn('[MercadoPago Webhook] Invalid x-signature header format');
                    return { received: false, error: 'Invalid signature format' };
                }
                const ts = tsPart.split('=')[1];
                const v1 = v1Part.split('=')[1];
                const dataId = resourceId.toString().toLowerCase();
                const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
                const crypto = require('crypto');
                const calculatedHash = crypto
                    .createHmac('sha256', mpWebhookSecret)
                    .update(manifest)
                    .digest('hex');
                if (calculatedHash !== v1) {
                    this.logger.warn('[MercadoPago Webhook] Signature mismatch! Request rejected.');
                    return { received: false, error: 'Signature mismatch' };
                }
            }
            catch (err) {
                this.logger.error(`[MercadoPago Webhook] Signature verification failed: ${err.message}`);
                return { received: false, error: 'Signature verification error' };
            }
        }
        if (type === 'payment' || type === 'payment.updated') {
            try {
                const mpToken = process.env.MP_ACCESS_TOKEN;
                if (!mpToken) {
                    this.logger.warn('[MercadoPago Webhook] No access token configured, skipping payment verification');
                    return { received: true };
                }
                const response = await fetch(`https://api.mercadopago.com/v1/payments/${resourceId}`, {
                    headers: { 'Authorization': `Bearer ${mpToken}` },
                });
                if (!response.ok) {
                    this.logger.error(`[MercadoPago Webhook] Failed to fetch payment ${resourceId}`);
                    return { received: true };
                }
                const payment = await response.json();
                const orderId = payment.external_reference;
                const status = payment.status;
                if (!orderId) {
                    this.logger.warn('[MercadoPago Webhook] No external_reference in payment');
                    return { received: true };
                }
                this.logger.log(`[MercadoPago Webhook] Payment ${resourceId} → Order ${orderId} → Status: ${status}`);
                if (status === 'approved') {
                    const order = await this.prisma.saleOrder.findUnique({
                        where: { id: orderId },
                        include: { lines: true },
                    });
                    if (order && order.status === 'PENDING_PAYMENT') {
                        await this.prisma.$transaction(async (tx) => {
                            await tx.saleOrder.update({
                                where: { id: orderId },
                                data: { status: 'COMPLETED' },
                            });
                            if (order.warehouseId) {
                                for (const line of order.lines) {
                                    await this.inventoryService.consumeReservation(line.variantId, order.warehouseId, order.branchId, line.quantity, order.id, tx);
                                }
                            }
                        });
                        this.logger.log(`[MercadoPago Webhook] ✓ Order ${orderId} marked as COMPLETED and reservations consumed.`);
                    }
                }
                else if (status === 'rejected' || status === 'cancelled') {
                    const order = await this.prisma.saleOrder.findUnique({
                        where: { id: orderId },
                        include: { lines: true },
                    });
                    if (order && order.status === 'PENDING_PAYMENT') {
                        await this.prisma.$transaction(async (tx) => {
                            await tx.saleOrder.update({
                                where: { id: orderId },
                                data: { status: 'CANCELLED' },
                            });
                            if (order.warehouseId) {
                                for (const line of order.lines) {
                                    await this.inventoryService.releaseReservation(line.variantId, order.warehouseId, order.branchId, line.quantity, order.id, tx);
                                }
                            }
                        });
                        this.logger.log(`[MercadoPago Webhook] ✗ Order ${orderId} marked as CANCELLED and reservations released.`);
                    }
                }
            }
            catch (err) {
                this.logger.error(`[MercadoPago Webhook] Error processing payment: ${err.message}`);
            }
        }
        return { received: true };
    }
};
exports.StorefrontController = StorefrontController;
__decorate([
    (0, common_1.Get)('manifest.json'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StorefrontController.prototype, "getManifest", null);
__decorate([
    (0, common_1.Get)('settings'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StorefrontController.prototype, "getSettings", null);
__decorate([
    (0, common_1.Post)('checkout'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], StorefrontController.prototype, "checkout", null);
__decorate([
    (0, common_1.Get)('my-orders'),
    (0, common_1.UseGuards)(storefront_auth_guard_1.StorefrontAuthGuard),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('pageSize')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], StorefrontController.prototype, "getMyOrders", null);
__decorate([
    (0, common_1.Get)('my-orders/:id'),
    (0, common_1.UseGuards)(storefront_auth_guard_1.StorefrontAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], StorefrontController.prototype, "getMyOrder", null);
__decorate([
    (0, common_1.Post)('webhooks/mercadopago'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], StorefrontController.prototype, "mercadoPagoWebhook", null);
exports.StorefrontController = StorefrontController = StorefrontController_1 = __decorate([
    (0, common_1.Controller)('storefront'),
    __metadata("design:paramtypes", [checkout_orchestrator_1.CheckoutOrchestrator,
        sales_service_1.SalesService,
        prisma_service_1.PrismaService,
        mercadopago_service_1.MercadoPagoService,
        inventory_service_1.InventoryService,
        settings_service_1.SettingsService])
], StorefrontController);
//# sourceMappingURL=storefront.controller.js.map