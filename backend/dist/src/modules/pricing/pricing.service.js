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
exports.PricingService = void 0;
const common_1 = require("@nestjs/common");
const price_list_model_1 = require("./models/price-list.model");
const crypto = __importStar(require("crypto"));
const rules_engine_service_1 = require("./rules-engine.service");
let PricingService = class PricingService {
    constructor(rulesEngine) {
        this.rulesEngine = rulesEngine;
        this.priceLists = [];
        this.entries = [];
        this.customerPriceListAssignments = new Map();
    }
    async findAll() {
        return this.priceLists;
    }
    async findOne(id) {
        const list = this.priceLists.find(pl => pl.id === id);
        if (!list)
            throw new common_1.NotFoundException('Price List not found');
        return list;
    }
    async createPriceList(dto) {
        if (dto.isPercentageBased && !dto.percentageDiscount) {
            throw new common_1.ConflictException('Percentage-based lists must provide a percentageDiscount value.');
        }
        const priceList = {
            id: crypto.randomUUID(),
            ...dto,
            isPercentageBased: dto.isPercentageBased ?? false,
            isActive: true,
            validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
            validTo: dto.validTo ? new Date(dto.validTo) : undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.priceLists.push(priceList);
        return priceList;
    }
    async setVariantPrice(priceListId, variantId, overridePrice) {
        const list = this.priceLists.find(pl => pl.id === priceListId);
        if (!list)
            throw new common_1.NotFoundException('Price List not found');
        if (list.isPercentageBased)
            throw new common_1.ConflictException('Cannot set explicit variant prices on a percentage-based price list.');
        const existingIdx = this.entries.findIndex(e => e.priceListId === priceListId && e.variantId === variantId);
        if (existingIdx >= 0) {
            this.entries[existingIdx].overridePrice = overridePrice;
            this.entries[existingIdx].updatedAt = new Date();
            return this.entries[existingIdx];
        }
        const entry = { id: crypto.randomUUID(), priceListId, variantId, overridePrice, updatedAt: new Date() };
        this.entries.push(entry);
        return entry;
    }
    async assignCustomerToPriceList(customerId, priceListId) {
        this.customerPriceListAssignments.set(customerId, priceListId);
        return { success: true };
    }
    async resolvePrice(variantId, basePrice, customerId) {
        let activeListId;
        if (customerId && this.customerPriceListAssignments.has(customerId))
            activeListId = this.customerPriceListAssignments.get(customerId);
        else {
            const defaultRetail = this.priceLists.find(pl => pl.type === price_list_model_1.PriceListType.RETAIL && pl.isActive);
            if (defaultRetail)
                activeListId = defaultRetail.id;
        }
        if (!activeListId)
            return basePrice;
        const list = this.priceLists.find(pl => pl.id === activeListId);
        if (!list || !list.isActive)
            return basePrice;
        const now = new Date();
        if (list.validFrom && now < list.validFrom)
            return basePrice;
        if (list.validTo && now > list.validTo)
            return basePrice;
        if (list.isPercentageBased && list.percentageDiscount) {
            const multiplier = (100 - list.percentageDiscount) / 100;
            return Number((basePrice * multiplier).toFixed(2));
        }
        else {
            const entry = this.entries.find(e => e.priceListId === activeListId && e.variantId === variantId);
            if (entry)
                return entry.overridePrice;
        }
        return basePrice;
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
        const list = this.priceLists.find(pl => pl.id === priceListId);
        if (!list)
            throw new common_1.NotFoundException('Price List not found');
        if (list.isPercentageBased)
            throw new common_1.ConflictException('Cannot bulk update explicit prices on a percentage-based list.');
        const multiplier = (100 + modifierPercentage) / 100;
        const updatedEntries = [];
        for (const vData of variantsData) {
            const newExplicitPrice = Number((vData.basePrice * multiplier).toFixed(2));
            const existingIdx = this.entries.findIndex(e => e.priceListId === priceListId && e.variantId === vData.variantId);
            if (existingIdx >= 0) {
                this.entries[existingIdx].overridePrice = newExplicitPrice;
                this.entries[existingIdx].updatedAt = new Date();
                updatedEntries.push(this.entries[existingIdx]);
            }
            else {
                const entry = { id: crypto.randomUUID(), priceListId, variantId: vData.variantId, overridePrice: newExplicitPrice, updatedAt: new Date() };
                this.entries.push(entry);
                updatedEntries.push(entry);
            }
        }
        return { success: true, updatedCount: updatedEntries.length };
    }
};
exports.PricingService = PricingService;
exports.PricingService = PricingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [rules_engine_service_1.RulesEngineService])
], PricingService);
//# sourceMappingURL=pricing.service.js.map