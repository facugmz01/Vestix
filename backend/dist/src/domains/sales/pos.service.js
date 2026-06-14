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
const checkout_orchestrator_1 = require("./checkout.orchestrator");
const identifiers_service_1 = require("../catalog/identifiers.service");
const pricing_service_1 = require("../catalog/pricing.service");
const rules_engine_service_1 = require("../catalog/rules-engine.service");
const prisma_service_1 = require("../../core/prisma/prisma.service");
const crypto = __importStar(require("crypto"));
let PosService = class PosService {
    constructor(checkoutOrchestrator, identifiersService, pricingService, rulesEngine, prisma) {
        this.checkoutOrchestrator = checkoutOrchestrator;
        this.identifiersService = identifiersService;
        this.pricingService = pricingService;
        this.rulesEngine = rulesEngine;
        this.prisma = prisma;
    }
    async resolveBarcode(barcode) {
        const variant = await this.prisma.productVariant.findUnique({
            where: { barcode },
            include: {
                product: {
                    include: { category: true }
                }
            }
        });
        if (!variant) {
            throw new common_1.NotFoundException(`Producto con código de barras ${barcode} no encontrado.`);
        }
        return {
            variantId: variant.id,
            categoryId: variant.product.categoryId,
            sku: variant.sku,
            name: variant.product.name,
            basePrice: variant.basePrice,
            color: variant.color,
            size: variant.size
        };
    }
    async processQuickSale(payload) {
        const register = await this.prisma.cashRegister.findUnique({
            where: { id: payload.cashRegisterId },
            include: { branch: true }
        });
        if (!register)
            throw new common_1.NotFoundException('Caja no encontrada.');
        const warehouse = await this.prisma.warehouse.findFirst({
            where: { branchId: register.branchId, isActive: true }
        });
        const quickOrderDto = {
            id: crypto.randomUUID(),
            branchId: register.branchId,
            warehouseId: warehouse?.id,
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
            cashShiftId: payload.cashShiftId,
        };
        return this.checkoutOrchestrator.processCheckout(quickOrderDto);
    }
    async calculateCart(dto) {
        const evaluatedLines = [];
        for (const lineDto of dto.lines) {
            const variant = await this.prisma.productVariant.findUnique({
                where: { id: lineDto.variantId },
                include: { product: true }
            });
            if (!variant)
                throw new common_1.NotFoundException(`Producto ${lineDto.variantId} no encontrado.`);
            const resolvedBasePrice = await this.pricingService.resolvePrice(lineDto.variantId, variant.basePrice, dto.customerId);
            const discountAmount = lineDto.discountPct
                ? (resolvedBasePrice * (lineDto.discountPct / 100))
                : 0;
            evaluatedLines.push({
                variantId: lineDto.variantId,
                categoryId: variant.product.categoryId,
                quantity: lineDto.quantity,
                basePrice: resolvedBasePrice,
                discountAmount: discountAmount,
                finalPrice: resolvedBasePrice - discountAmount
            });
        }
        const cartEvaluation = await this.rulesEngine.evaluateCartPromotions(evaluatedLines.map(l => ({
            id: crypto.randomUUID(),
            variantId: l.variantId,
            categoryId: l.categoryId,
            quantity: l.quantity,
            unitPrice: l.basePrice
        })));
        return {
            subtotal: Number(cartEvaluation.originalTotal.toFixed(2)),
            lineDiscountsTotal: Number(evaluatedLines.reduce((acc, l) => acc + (l.discountAmount * l.quantity), 0).toFixed(2)),
            cartDiscountTotal: Number(cartEvaluation.discountTotal.toFixed(2)),
            grandTotal: Number(cartEvaluation.finalTotal.toFixed(2)),
            appliedPromotions: cartEvaluation.appliedPromotions,
            lines: evaluatedLines.map(l => ({
                variantId: l.variantId,
                originalPrice: l.basePrice,
                finalPrice: l.finalPrice,
                discountAmount: l.discountAmount
            }))
        };
    }
    async searchCatalog(query, customerId) {
        const variants = await this.prisma.productVariant.findMany({
            where: {
                isActive: true,
                OR: [
                    { sku: { contains: query, mode: 'insensitive' } },
                    { barcode: { contains: query, mode: 'insensitive' } },
                    { product: { name: { contains: query, mode: 'insensitive' } } },
                ],
            },
            include: {
                product: { include: { category: true, brand: true } },
                stockLevels: true,
            },
            take: 20,
        });
        return Promise.all(variants.map(async (v) => {
            const resolvedPrice = await this.pricingService.resolvePrice(v.id, v.basePrice || 0, customerId);
            return {
                id: v.id,
                sku: v.sku,
                barcode: v.barcode,
                name: v.product?.name || 'Producto Desconocido',
                category: v.product?.category?.name,
                brand: v.product?.brand?.name,
                size: v.size,
                color: v.color,
                costPrice: v.costPrice || 0,
                basePrice: resolvedPrice,
                stock: v.stockLevels.reduce((acc, s) => acc + s.availableQuantity, 0),
            };
        }));
    }
    async getRegisters(branchId) {
        const where = { isActive: true };
        if (branchId && branchId !== '' && branchId !== 'current-branch') {
            where.branchId = branchId;
        }
        return this.prisma.cashRegister.findMany({
            where,
            include: { branch: true }
        });
    }
    async getCurrentSession(registerId) {
        return this.prisma.cashShift.findFirst({
            where: {
                cashRegisterId: registerId,
                status: 'OPEN'
            },
            include: { cashRegister: true }
        });
    }
    async openSession(dto) {
        const existing = await this.getCurrentSession(dto.cashRegisterId);
        if (existing)
            throw new common_1.BadRequestException('Ya existe una sesión abierta para esta caja.');
        return this.prisma.$transaction(async (tx) => {
            await tx.cashRegister.update({
                where: { id: dto.cashRegisterId },
                data: { status: 'OPEN' }
            });
            return tx.cashShift.create({
                data: {
                    cashRegisterId: dto.cashRegisterId,
                    openedByUserId: dto.userId,
                    openingAmount: dto.openingAmount,
                    status: 'OPEN'
                }
            });
        });
    }
    async closeSession(dto) {
        const shift = await this.prisma.cashShift.findUnique({
            where: { id: dto.shiftId }
        });
        if (!shift)
            throw new common_1.NotFoundException('Sesión no encontrada.');
        if (shift.status === 'CLOSED')
            throw new common_1.BadRequestException('La sesión ya se encuentra cerrada.');
        return this.prisma.$transaction(async (tx) => {
            await tx.cashRegister.update({
                where: { id: shift.cashRegisterId },
                data: { status: 'CLOSED' }
            });
            return tx.cashShift.update({
                where: { id: dto.shiftId },
                data: {
                    status: 'CLOSED',
                    closedByUserId: dto.userId,
                    closingAmount: dto.closingAmount,
                    closedAt: new Date(),
                    notes: dto.notes
                }
            });
        });
    }
    async getCatalogSyncData() {
        const catalog = await this.prisma.productVariant.findMany({
            where: { isActive: true },
            include: {
                product: { include: { category: true, brand: true } }
            }
        });
        return {
            status: 'SYNC_READY',
            timestamp: new Date().toISOString(),
            data: catalog.map(v => ({
                id: v.id,
                sku: v.sku,
                barcode: v.barcode,
                name: v.product.name,
                basePrice: v.basePrice,
                categoryId: v.product.categoryId,
                categoryName: v.product.category.name,
                brandName: v.product.brand?.name
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
        rules_engine_service_1.RulesEngineService,
        prisma_service_1.PrismaService])
], PosService);
//# sourceMappingURL=pos.service.js.map