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
exports.PosService = void 0;
const common_1 = require("@nestjs/common");
const checkout_orchestrator_1 = require("../sales/checkout.orchestrator");
const identifiers_service_1 = require("../identifiers/identifiers.service");
const pricing_service_1 = require("../pricing/pricing.service");
const rules_engine_service_1 = require("../pricing/rules-engine.service");
const crypto = __importStar(require("crypto"));
let PosService = class PosService {
    constructor(checkoutOrchestrator, identifiersService, pricingService, rulesEngine) {
        this.checkoutOrchestrator = checkoutOrchestrator;
        this.identifiersService = identifiersService;
        this.pricingService = pricingService;
        this.rulesEngine = rulesEngine;
    }
    async resolveBarcode(barcode) {
        if (!barcode || barcode.length < 5) {
            throw new common_1.NotFoundException('Invalid barcode format.');
        }
        return {
            variantId: 'mock-variant-id-123',
            categoryId: 'mock-category-id',
            sku: 'MOCK-SKU',
            name: 'Resolved Product via Scanner',
            basePrice: 20.00
        };
    }
    async processQuickSale(payload) {
        const quickOrderDto = {
            id: crypto.randomUUID(),
            branchId: payload.branchId,
            warehouseId: payload.warehouseId,
            source: 'POS',
            lines: [
                {
                    variantId: payload.variantId,
                    categoryId: payload.categoryId,
                    quantity: 1,
                }
            ],
            paymentMethod: 'CASH',
            paymentAccountId: payload.accountId,
        };
        return this.checkoutOrchestrator.processCheckout(quickOrderDto);
    }
    async calculateCart(dto) {
        const evaluatedLines = [];
        for (const lineDto of dto.lines) {
            const productBasePrice = 20.00;
            const resolvedBasePrice = await this.pricingService.resolvePrice(lineDto.variantId, productBasePrice, dto.customerId);
            evaluatedLines.push({
                variantId: lineDto.variantId,
                categoryId: 'mock-category-id',
                quantity: lineDto.quantity,
                basePrice: resolvedBasePrice,
                discountAmount: lineDto.discountPct ? (resolvedBasePrice * (lineDto.discountPct / 100)) : 0,
                finalPrice: resolvedBasePrice
            });
        }
        const cartEvaluation = this.rulesEngine.evaluateCartPromotions(evaluatedLines.map(l => ({
            id: crypto.randomUUID(),
            variantId: l.variantId,
            categoryId: l.categoryId,
            quantity: l.quantity,
            unitPrice: l.basePrice
        })));
        return {
            subtotal: cartEvaluation.originalTotal,
            lineDiscountsTotal: 0,
            cartDiscountTotal: cartEvaluation.discountTotal,
            grandTotal: cartEvaluation.finalTotal,
            lines: evaluatedLines.map(l => ({
                variantId: l.variantId,
                originalPrice: l.basePrice,
                finalPrice: l.finalPrice
            }))
        };
    }
};
exports.PosService = PosService;
exports.PosService = PosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [checkout_orchestrator_1.CheckoutOrchestrator,
        identifiers_service_1.IdentifiersService,
        pricing_service_1.PricingService,
        rules_engine_service_1.RulesEngineService])
], PosService);
//# sourceMappingURL=pos.service.js.map