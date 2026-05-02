"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RulesEngineService = exports.PromotionType = void 0;
const common_1 = require("@nestjs/common");
var PromotionType;
(function (PromotionType) {
    PromotionType["BOGO"] = "BOGO";
    PromotionType["CART_TOTAL_DISCOUNT"] = "CART_TOTAL_DISCOUNT";
    PromotionType["CATEGORY_DISCOUNT"] = "CATEGORY_DISCOUNT";
})(PromotionType || (exports.PromotionType = PromotionType = {}));
let RulesEngineService = class RulesEngineService {
    constructor() {
        this.rules = [];
    }
    registerRule(rule) {
        this.rules.push(rule);
    }
    evaluateCartPromotions(cartLines) {
        const evaluatedLines = cartLines.map(l => ({ ...l, promotionalDiscount: 0 }));
        let originalTotal = evaluatedLines.reduce((sum, line) => sum + (line.unitPrice * line.quantity), 0);
        let discountTotal = 0;
        const appliedPromotions = [];
        const now = new Date();
        const activeRules = this.rules.filter(r => {
            if (!r.isActive)
                return false;
            if (r.validFrom && now < r.validFrom)
                return false;
            if (r.validTo && now > r.validTo)
                return false;
            return true;
        });
        for (const rule of activeRules) {
            if (rule.type === PromotionType.BOGO) {
                const reqQty = rule.conditions.requiredQuantity;
                const targetVariant = rule.conditions.targetVariantId;
                const line = evaluatedLines.find(l => l.variantId === targetVariant);
                if (line && line.quantity >= (reqQty + rule.actions.freeQuantity)) {
                    const eligibleSets = Math.floor(line.quantity / (reqQty + rule.actions.freeQuantity));
                    if (eligibleSets > 0) {
                        const discountAmount = eligibleSets * rule.actions.freeQuantity * line.unitPrice;
                        line.promotionalDiscount += discountAmount;
                        discountTotal += discountAmount;
                        if (!appliedPromotions.includes(rule.name))
                            appliedPromotions.push(rule.name);
                    }
                }
            }
            if (rule.type === PromotionType.CATEGORY_DISCOUNT) {
                const targetCat = rule.conditions.targetCategoryId;
                const pctOff = rule.actions.discountPercentage;
                const eligibleLines = evaluatedLines.filter(l => l.categoryId === targetCat);
                eligibleLines.forEach(line => {
                    const discountAmount = (line.unitPrice * line.quantity) * (pctOff / 100);
                    line.promotionalDiscount += discountAmount;
                    discountTotal += discountAmount;
                    if (!appliedPromotions.includes(rule.name))
                        appliedPromotions.push(rule.name);
                });
            }
            if (rule.type === PromotionType.CART_TOTAL_DISCOUNT) {
                if ((originalTotal - discountTotal) >= rule.conditions.minimumSpend) {
                    const cartDiscountAmount = rule.actions.flatDiscountAmount;
                    const currentTotalAfterLineDiscounts = originalTotal - discountTotal;
                    evaluatedLines.forEach(line => {
                        const lineCurrentTotal = (line.unitPrice * line.quantity) - line.promotionalDiscount;
                        const lineWeight = lineCurrentTotal / currentTotalAfterLineDiscounts;
                        line.promotionalDiscount += cartDiscountAmount * lineWeight;
                    });
                    discountTotal += cartDiscountAmount;
                    appliedPromotions.push(rule.name);
                }
            }
        }
        return {
            originalTotal: Number(originalTotal.toFixed(2)),
            discountTotal: Number(discountTotal.toFixed(2)),
            finalTotal: Number((originalTotal - discountTotal).toFixed(2)),
            appliedPromotions,
            lines: evaluatedLines
        };
    }
};
exports.RulesEngineService = RulesEngineService;
exports.RulesEngineService = RulesEngineService = __decorate([
    (0, common_1.Injectable)()
], RulesEngineService);
//# sourceMappingURL=rules-engine.service.js.map