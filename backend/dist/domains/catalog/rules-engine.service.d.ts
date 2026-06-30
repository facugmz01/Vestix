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
import { PrismaService } from '../../core/prisma/prisma.service';
export declare class RulesEngineService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    registerRule(rule: PromotionRule): Promise<{
        id: string;
        name: string;
        type: string;
        isActive: boolean;
        conditions: import(".prisma/client").Prisma.JsonValue;
        actions: import(".prisma/client").Prisma.JsonValue;
        validFrom: Date | null;
        validTo: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    evaluateCartPromotions(cartLines: CartLineItem[]): Promise<{
        originalTotal: number;
        discountTotal: number;
        finalTotal: number;
        appliedPromotions: string[];
        lines: EvaluatedCartLineItem[];
    }>;
}
