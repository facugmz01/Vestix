import { Injectable } from '@nestjs/common';

export enum PromotionType {
  BOGO = 'BOGO',                           // Buy X of Variant A, Get Y of Variant A free
  CART_TOTAL_DISCOUNT = 'CART_TOTAL_DISCOUNT', // Spend $X, get $Y off total
  CATEGORY_DISCOUNT = 'CATEGORY_DISCOUNT', // Flat % off specific category (e.g., 20% off all Shoes)
}

export interface PromotionRule {
  id: string;
  name: string;
  type: PromotionType;
  isActive: boolean;
  conditions: any; // Dynamic JSON conditions (e.g., { requiredQuantity: 2, requiredVariantId: '123' })
  actions: any;    // Dynamic JSON actions (e.g., { freeQuantity: 1, discountPercentage: 100 })
  validFrom?: Date;
  validTo?: Date;
}

export interface CartLineItem {
  id: string;
  variantId: string;
  categoryId: string; // Passed in from Catalog to evaluate Category-level rules
  quantity: number;
  unitPrice: number; // Base price already resolved by PricingService
}

export interface EvaluatedCartLineItem extends CartLineItem {
  promotionalDiscount: number;
}

@Injectable()
export class RulesEngineService {
  private rules: PromotionRule[] = [];

  registerRule(rule: PromotionRule) {
    this.rules.push(rule);
  }

  /**
   * Applies complex promotional rules to a shopping cart.
   * Tracks discounts down to the individual line item for correct COGS / margin tracking.
   */
  evaluateCartPromotions(cartLines: CartLineItem[]): {
    originalTotal: number;
    discountTotal: number;
    finalTotal: number;
    appliedPromotions: string[];
    lines: EvaluatedCartLineItem[];
  } {
    const evaluatedLines: EvaluatedCartLineItem[] = cartLines.map(l => ({ ...l, promotionalDiscount: 0 }));
    let originalTotal = evaluatedLines.reduce((sum, line) => sum + (line.unitPrice * line.quantity), 0);
    let discountTotal = 0;
    const appliedPromotions: string[] = [];

    // Filter active rules based on time bounds
    const now = new Date();
    const activeRules = this.rules.filter(r => {
      if (!r.isActive) return false;
      if (r.validFrom && now < r.validFrom) return false;
      if (r.validTo && now > r.validTo) return false;
      return true;
    });

    for (const rule of activeRules) {
      // RULE 1: Buy One Get One (BOGO)
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
            if (!appliedPromotions.includes(rule.name)) appliedPromotions.push(rule.name);
          }
        }
      }
      
      // RULE 2: Category Wide Discounts
      if (rule.type === PromotionType.CATEGORY_DISCOUNT) {
        const targetCat = rule.conditions.targetCategoryId;
        const pctOff = rule.actions.discountPercentage;

        const eligibleLines = evaluatedLines.filter(l => l.categoryId === targetCat);
        eligibleLines.forEach(line => {
          const discountAmount = (line.unitPrice * line.quantity) * (pctOff / 100);
          line.promotionalDiscount += discountAmount;
          discountTotal += discountAmount;
          if (!appliedPromotions.includes(rule.name)) appliedPromotions.push(rule.name);
        });
      }

      // RULE 3: Minimum Spend Cart Discount
      if (rule.type === PromotionType.CART_TOTAL_DISCOUNT) {
        // Calculate against current subtotal (after other discounts)
        if ((originalTotal - discountTotal) >= rule.conditions.minimumSpend) {
          // Distribute cart discount proportionally across all lines to preserve item margins
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
}
