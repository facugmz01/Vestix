export declare enum PromotionType {
    BOGO = "BOGO",
    CART_TOTAL_DISCOUNT = "CART_TOTAL_DISCOUNT",
    CATEGORY_DISCOUNT = "CATEGORY_DISCOUNT"
}
export interface PromotionRule {
    id: string;
    name: string;
    type: PromotionType;
    isActive: boolean;
    conditions: any;
    actions: any;
    validFrom?: Date;
    validTo?: Date;
}
export interface CartLineItem {
    id: string;
    variantId: string;
    categoryId: string;
    quantity: number;
    unitPrice: number;
}
export interface EvaluatedCartLineItem extends CartLineItem {
    promotionalDiscount: number;
}
export declare class RulesEngineService {
    private rules;
    registerRule(rule: PromotionRule): void;
    evaluateCartPromotions(cartLines: CartLineItem[]): {
        originalTotal: number;
        discountTotal: number;
        finalTotal: number;
        appliedPromotions: string[];
        lines: EvaluatedCartLineItem[];
    };
}
