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
exports.CheckoutOrchestrator = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma/prisma.service");
const pricing_service_1 = require("../catalog/pricing.service");
const rules_engine_service_1 = require("../catalog/rules-engine.service");
const catalog_facade_1 = require("../catalog/catalog.facade");
const afip_producer_1 = require("../invoicing/afip.producer");
const inventory_service_1 = require("../logistics/inventory.service");
const settings_service_1 = require("../../modules/settings/settings.service");
const crypto = __importStar(require("crypto"));
let CheckoutOrchestrator = class CheckoutOrchestrator {
    constructor(prisma, pricingService, rulesEngine, catalogFacade, afipProducer, inventoryService, settingsService) {
        this.prisma = prisma;
        this.pricingService = pricingService;
        this.rulesEngine = rulesEngine;
        this.catalogFacade = catalogFacade;
        this.afipProducer = afipProducer;
        this.inventoryService = inventoryService;
        this.settingsService = settingsService;
    }
    async processCheckout(dto, cashierUserId) {
        const existingOrder = await this.prisma.saleOrder.findUnique({
            where: { id: dto.id },
        });
        if (existingOrder) {
            return { status: 'ALREADY_PROCESSED', order: existingOrder };
        }
        const isQuote = dto.status === 'QUOTE' || dto.status === 'QUOTATION';
        if (!isQuote && (dto.source === 'POS' || dto.source === 'OFFLINE_POS')) {
            if (!dto.cashShiftId) {
                throw new common_1.BadRequestException('Un turno de caja abierto es obligatorio para registrar ventas en el POS.');
            }
            const shift = await this.prisma.cashShift.findUnique({ where: { id: dto.cashShiftId } });
            if (!shift || shift.status !== 'OPEN') {
                throw new common_1.BadRequestException('El turno de caja provisto no es válido o ya fue cerrado.');
            }
            const posSettings = await this.settingsService.getPosSettings();
            if (posSettings.boxMode === 'STRICT') {
                if (!cashierUserId || shift.openedByUserId !== cashierUserId) {
                    throw new common_1.BadRequestException('El modo de caja es ESTRICTO. Solo el usuario que abrió el turno puede registrar ventas.');
                }
            }
        }
        const pricingSettings = await this.settingsService.getPricingSettings();
        const evaluatedLines = [];
        for (const lineDto of dto.lines) {
            const variant = await this.prisma.productVariant.findUnique({ where: { id: lineDto.variantId } });
            if (!variant)
                throw new common_1.BadRequestException(`Variant ${lineDto.variantId} not found`);
            let resolvedBasePrice;
            if (lineDto.unitPriceOverride !== undefined) {
                resolvedBasePrice = lineDto.unitPriceOverride;
            }
            else {
                resolvedBasePrice = await this.pricingService.resolvePrice(lineDto.variantId, variant.basePrice, dto.customerId);
            }
            const manualDiscountPct = lineDto.discountPct || 0;
            if (manualDiscountPct > 0) {
                if (pricingSettings.allowManualDiscount === false) {
                    throw new common_1.BadRequestException('Los descuentos manuales están deshabilitados por configuración del sistema.');
                }
                if (pricingSettings.maxDiscountPct && manualDiscountPct > pricingSettings.maxDiscountPct) {
                    throw new common_1.BadRequestException(`El descuento manual excede el máximo permitido del ${pricingSettings.maxDiscountPct}%`);
                }
            }
            const manualDiscountAmount = resolvedBasePrice * (manualDiscountPct / 100);
            const finalPriceAfterManualDiscount = resolvedBasePrice - manualDiscountAmount;
            evaluatedLines.push({
                variantId: lineDto.variantId,
                categoryId: lineDto.categoryId || 'default_category',
                quantity: lineDto.quantity,
                basePrice: resolvedBasePrice,
                manualDiscountAmount: manualDiscountAmount,
                finalPrice: finalPriceAfterManualDiscount
            });
        }
        const cartEvaluation = await this.rulesEngine.evaluateCartPromotions(evaluatedLines.map(l => ({
            id: crypto.randomUUID(),
            variantId: l.variantId,
            categoryId: l.categoryId,
            quantity: l.quantity,
            unitPrice: l.finalPrice
        })));
        const serverCalculatedTotal = cartEvaluation.finalTotal;
        const finalLinesForDB = evaluatedLines.map((line, index) => {
            const promotionalDiscount = cartEvaluation.lines[index].promotionalDiscount;
            const totalDiscountAmount = line.manualDiscountAmount + promotionalDiscount;
            return {
                ...line,
                totalDiscountAmount,
                finalPrice: line.basePrice - (totalDiscountAmount / line.quantity)
            };
        });
        const isManualEntry = dto.source === 'POS' || dto.source === 'BACKOFFICE' || dto.source === 'OFFLINE_POS';
        let posTotal = serverCalculatedTotal;
        if (isManualEntry && dto.posGrandTotal !== undefined) {
            posTotal = dto.posGrandTotal;
        }
        else if (dto.posGrandTotal !== undefined && Math.abs(dto.posGrandTotal - serverCalculatedTotal) > 0.01) {
            if (isQuote) {
                posTotal = dto.posGrandTotal;
            }
            else {
                throw new common_1.BadRequestException(`Price mismatch. Expected ${serverCalculatedTotal}, got ${dto.posGrandTotal}`);
            }
        }
        const posDifference = posTotal - serverCalculatedTotal;
        const result = await this.prisma.$transaction(async (tx) => {
            const isBackoffice = dto.source === 'BACKOFFICE';
            if (!isQuote) {
                if (dto.paymentMethod === 'CUSTOMER_CREDIT') {
                    if (!dto.customerId)
                        throw new common_1.BadRequestException('Customer ID required for credit');
                    const customer = await tx.customer.findUnique({ where: { id: dto.customerId } });
                    if (!customer)
                        throw new common_1.BadRequestException('Customer not found');
                    if (customer.usedCredit + posTotal > customer.creditLimit) {
                        throw new common_1.BadRequestException('Credit limit exceeded');
                    }
                    await tx.customer.update({
                        where: { id: dto.customerId },
                        data: { usedCredit: { increment: posTotal } }
                    });
                }
                else if (dto.paymentAccountId && !isBackoffice) {
                    await tx.treasuryReceipt.create({
                        data: {
                            accountId: dto.paymentAccountId,
                            amount: posTotal,
                            payerName: dto.customerId || 'Walk-in',
                            referenceId: dto.id,
                            description: `Checkout via ${dto.paymentMethod}`
                        }
                    });
                }
            }
            if (!isQuote && dto.warehouseId) {
                if (dto.status === 'PENDING_PAYMENT') {
                    for (const line of finalLinesForDB) {
                        await this.inventoryService.reserveStock(line.variantId, dto.warehouseId, dto.branchId, line.quantity, dto.id, tx);
                    }
                }
                else {
                    await this.deductStock(tx, {
                        orderId: dto.id,
                        branchId: dto.branchId,
                        warehouseId: dto.warehouseId,
                        lines: finalLinesForDB
                    });
                }
            }
            const order = await tx.saleOrder.create({
                data: {
                    id: dto.id,
                    branchId: dto.branchId,
                    warehouseId: dto.warehouseId,
                    source: dto.source,
                    customerId: dto.customerId,
                    subtotal: cartEvaluation.originalTotal,
                    cartDiscountTotal: cartEvaluation.discountTotal,
                    grandTotal: posTotal,
                    appliedPromotions: cartEvaluation.appliedPromotions,
                    paymentMethod: dto.paymentMethod,
                    paymentAccountId: dto.paymentAccountId,
                    status: dto.status || 'COMPLETED',
                    cashShiftId: dto.cashShiftId,
                    issueInvoice: dto.issueInvoice ?? true,
                    createdAt: dto.createdAtIso ? new Date(dto.createdAtIso) : new Date(),
                    lines: {
                        create: finalLinesForDB.map(l => ({
                            variantId: l.variantId,
                            categoryId: l.categoryId,
                            quantity: l.quantity,
                            basePrice: l.basePrice,
                            discountAmount: l.totalDiscountAmount,
                            finalPrice: l.finalPrice
                        }))
                    }
                },
                include: { lines: true }
            });
            if (Math.abs(posDifference) > 0.01) {
                await tx.saleOrderVariance.create({
                    data: {
                        orderId: order.id,
                        posTotal: posTotal,
                        serverTotal: serverCalculatedTotal,
                        difference: posDifference
                    }
                });
            }
            if (order.status === 'COMPLETED' || order.status === 'PENDING_PAYMENT') {
                await tx.outboxEvent.create({
                    data: {
                        aggregate: 'SaleOrder',
                        aggregateId: order.id,
                        type: 'ORDER_CREATED',
                        payload: { orderId: order.id, branchId: order.branchId, status: order.status, grandTotal: order.grandTotal }
                    }
                });
            }
            return { status: 'SUCCESS', order };
        });
        if (result.order.issueInvoice) {
            await this.afipProducer.enqueueInvoiceGeneration(result.order.id, dto.branchId);
        }
        return result;
    }
    async confirmQuotation(id) {
        const quote = await this.prisma.saleOrder.findUnique({
            where: { id },
            include: { lines: true }
        });
        if (!quote)
            throw new common_1.NotFoundException('Quotation not found');
        if (quote.status !== 'QUOTATION' && quote.status !== 'QUOTE') {
            throw new common_1.BadRequestException('Order is already confirmed or cancelled');
        }
        let targetWarehouseId = quote.warehouseId;
        if (!targetWarehouseId) {
            const branch = await this.prisma.branch.findUnique({ where: { id: quote.branchId }, include: { warehouses: true } });
            if (branch?.warehouses.length)
                targetWarehouseId = branch.warehouses[0].id;
        }
        if (!targetWarehouseId)
            throw new common_1.BadRequestException('No warehouse specified for stock deduction');
        return this.prisma.$transaction(async (tx) => {
            await this.deductStock(tx, {
                orderId: quote.id,
                branchId: quote.branchId,
                warehouseId: targetWarehouseId,
                lines: quote.lines.map(l => ({
                    variantId: l.variantId,
                    quantity: l.quantity,
                    basePrice: l.basePrice
                }))
            });
            const updated = await tx.saleOrder.update({
                where: { id },
                data: { status: 'CONFIRMED' },
                include: { lines: true }
            });
            await tx.outboxEvent.create({
                data: {
                    aggregate: 'SaleOrder',
                    aggregateId: updated.id,
                    type: 'ORDER_CONFIRMED',
                    payload: { orderId: updated.id, branchId: updated.branchId, status: 'CONFIRMED', grandTotal: updated.grandTotal }
                }
            });
            if (updated.issueInvoice) {
                await this.afipProducer.enqueueInvoiceGeneration(updated.id, updated.branchId);
            }
            return updated;
        });
    }
    async deductStock(tx, data) {
        for (const line of data.lines) {
            const variantWithProduct = await this.catalogFacade.getVariantWithCombos(line.variantId, tx);
            if (variantWithProduct?.product?.type === 'COMBO') {
                for (const cl of variantWithProduct.product.comboLines) {
                    await this.inventoryService.recordMovement({
                        variantId: cl.childVariantId,
                        sourceWarehouseId: data.warehouseId,
                        destinationWarehouseId: null,
                        branchId: data.branchId,
                        type: 'SALE_EXIT',
                        quantity: line.quantity * cl.quantity,
                        unitCost: line.basePrice,
                        referenceId: data.orderId
                    }, tx);
                }
            }
            else {
                await this.inventoryService.recordMovement({
                    variantId: line.variantId,
                    sourceWarehouseId: data.warehouseId,
                    destinationWarehouseId: null,
                    branchId: data.branchId,
                    type: 'SALE_EXIT',
                    quantity: line.quantity,
                    unitCost: line.basePrice,
                    referenceId: data.orderId
                }, tx);
            }
        }
    }
    async cancelOrder(id) {
        const order = await this.prisma.saleOrder.findUnique({ where: { id } });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        return this.prisma.saleOrder.update({
            where: { id },
            data: { status: 'CANCELLED' }
        });
    }
};
exports.CheckoutOrchestrator = CheckoutOrchestrator;
exports.CheckoutOrchestrator = CheckoutOrchestrator = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        pricing_service_1.PricingService,
        rules_engine_service_1.RulesEngineService,
        catalog_facade_1.CatalogFacade,
        afip_producer_1.AfipProducer,
        inventory_service_1.InventoryService,
        settings_service_1.SettingsService])
], CheckoutOrchestrator);
//# sourceMappingURL=checkout.orchestrator.js.map