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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const payment_model_1 = require("./models/payment.model");
const mercado_pago_service_1 = require("./mercado-pago.service");
const orders_fulfillment_service_1 = require("../sales/orders/orders-fulfillment.service");
const accounts_service_1 = require("./accounts.service");
const crypto = __importStar(require("crypto"));
const prisma_service_1 = require("../../core/prisma/prisma.service");
let PaymentsService = class PaymentsService {
    constructor(mpService, ordersService, accountsService, prisma) {
        this.mpService = mpService;
        this.ordersService = ordersService;
        this.accountsService = accountsService;
        this.prisma = prisma;
    }
    async createOnlinePayment(orderId, amount, title, provider) {
        let externalRef = '';
        let checkoutUrl = '';
        if (provider === payment_model_1.PaymentProvider.MERCADO_PAGO) {
            const mpResponse = await this.mpService.createPaymentPreference({ orderId, amount, title });
            externalRef = mpResponse.externalReferenceId;
            checkoutUrl = mpResponse.checkoutUrl;
        }
        else {
            throw new common_1.BadRequestException(`Provider ${provider} is not supported yet.`);
        }
        const intent = await this.prisma.paymentIntent.create({
            data: {
                id: crypto.randomUUID(),
                provider,
                externalReferenceId: externalRef,
                orderId,
                amount,
                currency: 'ARS',
                status: payment_model_1.PaymentIntentStatus.CREATED,
            }
        });
        return { intentId: intent.id, checkoutUrl };
    }
    async handleWebhook(provider, payload) {
        if (provider === payment_model_1.PaymentProvider.MERCADO_PAGO) {
            const verification = await this.mpService.verifyPaymentNotification(payload.data.id);
            if (verification.status === 'approved') {
                const intent = await this.prisma.paymentIntent.findFirst({
                    where: { orderId: verification.orderId }
                });
                if (!intent)
                    throw new common_1.NotFoundException('Payment Intent not found for this order.');
                await this.prisma.paymentIntent.update({
                    where: { id: intent.id },
                    data: { status: payment_model_1.PaymentIntentStatus.APPROVED }
                });
                await this.ordersService.markAsPaid(intent.orderId);
                await this.accountsService.generateIncomingReceipt({
                    accountId: 'VIRTUAL-MP-ACCOUNT-ID',
                    amount: verification.amount,
                    payerName: 'MercadoPago Auto-Clearing',
                    referenceId: intent.id,
                    description: `Online Payment Cleared for Order ${intent.orderId}`
                });
                return { status: 'SUCCESS' };
            }
        }
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mercado_pago_service_1.MercadoPagoService,
        orders_fulfillment_service_1.OrdersFulfillmentService,
        accounts_service_1.AccountsService,
        prisma_service_1.PrismaService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map