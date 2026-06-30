"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PricingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma/prisma.service");
const rules_engine_service_1 = require("./rules-engine.service");
let PricingService = class PricingService {
    constructor(rulesEngine, prisma) {
        this.rulesEngine = rulesEngine;
        this.prisma = prisma;
    }
    async findAll() {
        return this.prisma.priceList.findMany({
            include: { entries: true }
        });
    }
    async findOne(id) {
        return this.prisma.priceList.findUniqueOrThrow({
            where: { id },
            include: { entries: true }
        });
    }
    async createPriceList(dto) {
        if (dto.isPercentageBased && !dto.percentageDiscount) {
            throw new common_1.ConflictException('Percentage-based lists must provide a percentageDiscount value.');
        }
        return this.prisma.priceList.create({
            data: {
                name: dto.name,
                type: dto.type || 'RETAIL',
                currency: dto.currency || 'ARS',
                isPercentageBased: dto.isPercentageBased ?? false,
                percentageDiscount: dto.percentageDiscount,
                validFrom: (dto.validFrom && dto.validFrom.trim() !== '') ? new Date(dto.validFrom) : undefined,
                validTo: (dto.validTo && dto.validTo.trim() !== '') ? new Date(dto.validTo) : undefined,
                isDefault: dto.isDefault ?? false,
            }
        });
    }
    async setVariantPrice(priceListId, variantId, overridePrice) {
        const list = await this.prisma.priceList.findUniqueOrThrow({ where: { id: priceListId } });
        if (list.isPercentageBased)
            throw new common_1.ConflictException('Cannot set explicit variant prices on a percentage-based price list.');
        return this.prisma.priceListEntry.upsert({
            where: {
                priceListId_variantId: { priceListId, variantId }
            },
            update: { overridePrice },
            create: { priceListId, variantId, overridePrice }
        });
    }
    async resolvePrice(variantId, basePrice, customerId) {
        let activePriceList;
        if (customerId) {
            const customer = await this.prisma.customer.findUnique({
                where: { id: customerId },
                include: { priceList: true }
            });
            if (customer?.priceList) {
                activePriceList = customer.priceList;
            }
        }
        if (!activePriceList) {
            activePriceList = await this.prisma.priceList.findFirst({
                where: { isDefault: true, isActive: true }
            });
        }
        if (!activePriceList)
            return basePrice;
        const now = new Date();
        if (activePriceList.validFrom && now < activePriceList.validFrom)
            return basePrice;
        if (activePriceList.validTo && now > activePriceList.validTo)
            return basePrice;
        const variant = await this.prisma.productVariant.findUnique({
            where: { id: variantId },
            select: { basePrice: true, costPrice: true }
        });
        const vBasePrice = variant?.basePrice ?? basePrice;
        const vCostPrice = variant?.costPrice ?? 0;
        const referencePrice = vBasePrice > 0 ? vBasePrice : vCostPrice;
        if (activePriceList.type === 'MODIFIER' || activePriceList.isPercentageBased) {
            const percentage = (activePriceList.modifierPercentage !== null && activePriceList.modifierPercentage !== undefined)
                ? activePriceList.modifierPercentage
                : -(activePriceList.percentageDiscount || 0);
            const multiplier = (100 + percentage) / 100;
            return Number((referencePrice * multiplier).toFixed(2));
        }
        else {
            const entry = await this.prisma.priceListEntry.findUnique({
                where: {
                    priceListId_variantId: { priceListId: activePriceList.id, variantId }
                }
            });
            if (entry)
                return entry.overridePrice;
            return vBasePrice > 0 ? vBasePrice : Number((vCostPrice * activePriceList.margin).toFixed(2));
        }
    }
    async resolvePriceListPrice(variantId, basePrice, priceListId) {
        const activePriceList = await this.prisma.priceList.findUnique({ where: { id: priceListId } });
        if (!activePriceList || !activePriceList.isActive)
            return basePrice;
        const now = new Date();
        if (activePriceList.validFrom && now < activePriceList.validFrom)
            return basePrice;
        if (activePriceList.validTo && now > activePriceList.validTo)
            return basePrice;
        const variant = await this.prisma.productVariant.findUnique({
            where: { id: variantId },
            select: { basePrice: true, costPrice: true }
        });
        const vBasePrice = variant?.basePrice ?? basePrice;
        const vCostPrice = variant?.costPrice ?? 0;
        const referencePrice = vBasePrice > 0 ? vBasePrice : vCostPrice;
        if (activePriceList.type === 'MODIFIER' || activePriceList.isPercentageBased) {
            const percentage = (activePriceList.modifierPercentage !== null && activePriceList.modifierPercentage !== undefined)
                ? activePriceList.modifierPercentage
                : -(activePriceList.percentageDiscount || 0);
            const multiplier = (100 + percentage) / 100;
            return Number((referencePrice * multiplier).toFixed(2));
        }
        else {
            const entry = await this.prisma.priceListEntry.findUnique({
                where: {
                    priceListId_variantId: { priceListId, variantId }
                }
            });
            if (entry)
                return entry.overridePrice;
            return vBasePrice > 0 ? vBasePrice : Number((vCostPrice * activePriceList.margin).toFixed(2));
        }
    }
    calculateMargin(sellingPrice, weightedAverageCost) {
        if (sellingPrice <= 0 || weightedAverageCost <= 0)
            return { marginPercent: 0, markupPercent: 0, grossProfit: 0 };
        const grossProfit = sellingPrice - weightedAverageCost;
        const marginPercent = (grossProfit / sellingPrice) * 100;
        const markupPercent = (grossProfit / weightedAverageCost) * 100;
        return {
            grossProfit: Number(grossProfit.toFixed(2)),
            marginPercent: Number(marginPercent.toFixed(2)),
            markupPercent: Number(markupPercent.toFixed(2)),
        };
    }
    async bulkUpdateVariantPrices(priceListId, variantsData, modifierPercentage) {
        const list = await this.prisma.priceList.findUniqueOrThrow({ where: { id: priceListId } });
        if (list.isPercentageBased)
            throw new common_1.ConflictException('Cannot bulk update explicit prices on a percentage-based list.');
        const multiplier = (100 + modifierPercentage) / 100;
        const operations = variantsData.map(vData => {
            const newExplicitPrice = Number((vData.basePrice * multiplier).toFixed(2));
            return this.prisma.priceListEntry.upsert({
                where: { priceListId_variantId: { priceListId, variantId: vData.variantId } },
                update: { overridePrice: newExplicitPrice },
                create: { priceListId, variantId: vData.variantId, overridePrice: newExplicitPrice }
            });
        });
        await Promise.all(operations);
        return { success: true, updatedCount: operations.length };
    }
};
exports.PricingService = PricingService;
exports.PricingService = PricingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [rules_engine_service_1.RulesEngineService,
        prisma_service_1.PrismaService])
], PricingService);
//# sourceMappingURL=pricing.service.js.map