import { CheckoutOrchestrator } from '../sales/checkout.orchestrator';
import { IdentifiersService } from '../identifiers/identifiers.service';
import { PricingService } from '../pricing/pricing.service';
import { RulesEngineService } from '../pricing/rules-engine.service';
import { PrismaService } from '../../core/prisma/prisma.service';
export declare class PosService {
    private readonly checkoutOrchestrator;
    private readonly identifiersService;
    private readonly pricingService;
    private readonly rulesEngine;
    private readonly prisma;
    constructor(checkoutOrchestrator: CheckoutOrchestrator, identifiersService: IdentifiersService, pricingService: PricingService, rulesEngine: RulesEngineService, prisma: PrismaService);
    resolveBarcode(barcode: string): Promise<{
        variantId: string;
        categoryId: string;
        sku: string;
        name: string;
        basePrice: number;
        color: string;
        size: string;
    }>;
    processQuickSale(payload: {
        cashRegisterId: string;
        variantId: string;
        categoryId: string;
        accountId: string;
        cashShiftId?: string;
    }): Promise<{
        status: string;
        order: {
            id: string;
            branchId: string;
            warehouseId: string | null;
            source: string;
            customerId: string | null;
            subtotal: number;
            cartDiscountTotal: number;
            grandTotal: number;
            appliedPromotions: import(".prisma/client").Prisma.JsonValue;
            paymentMethod: string;
            paymentAccountId: string | null;
            status: string;
            cashShiftId: string | null;
            createdAt: Date;
            syncedAt: Date;
        };
    }>;
    calculateCart(dto: {
        lines: {
            variantId: string;
            quantity: number;
            discountPct?: number;
        }[];
        cartDiscountPct?: number;
        customerId?: string;
    }): Promise<{
        subtotal: number;
        lineDiscountsTotal: number;
        cartDiscountTotal: number;
        grandTotal: number;
        appliedPromotions: string[];
        lines: {
            variantId: any;
            originalPrice: any;
            finalPrice: any;
            discountAmount: any;
        }[];
    }>;
    searchCatalog(query: string): Promise<{
        id: string;
        sku: string;
        barcode: string;
        name: string;
        category: string;
        brand: string;
        basePrice: number;
        stock: number;
    }[]>;
    getRegisters(branchId?: string): Promise<({
        branch: {
            id: string;
            name: string;
            code: string;
            address: string | null;
            phone: string | null;
            isMain: boolean;
            isActive: boolean;
            settings: import(".prisma/client").Prisma.JsonValue | null;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        name: string;
        code: string;
        branchId: string;
        status: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    getCurrentSession(registerId: string): Promise<{
        cashRegister: {
            id: string;
            name: string;
            code: string;
            branchId: string;
            status: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        cashRegisterId: string;
        openedByUserId: string;
        closedByUserId: string | null;
        openingAmount: number;
        closingAmount: number | null;
        expectedAmount: number | null;
        difference: number | null;
        status: string;
        openedAt: Date;
        closedAt: Date | null;
        notes: string | null;
    }>;
    openSession(dto: {
        cashRegisterId: string;
        openingAmount: number;
        userId: string;
    }): Promise<{
        id: string;
        cashRegisterId: string;
        openedByUserId: string;
        closedByUserId: string | null;
        openingAmount: number;
        closingAmount: number | null;
        expectedAmount: number | null;
        difference: number | null;
        status: string;
        openedAt: Date;
        closedAt: Date | null;
        notes: string | null;
    }>;
    closeSession(dto: {
        shiftId: string;
        closingAmount: number;
        userId: string;
        notes?: string;
    }): Promise<{
        id: string;
        cashRegisterId: string;
        openedByUserId: string;
        closedByUserId: string | null;
        openingAmount: number;
        closingAmount: number | null;
        expectedAmount: number | null;
        difference: number | null;
        status: string;
        openedAt: Date;
        closedAt: Date | null;
        notes: string | null;
    }>;
    getCatalogSyncData(): Promise<{
        status: string;
        timestamp: string;
        data: {
            id: string;
            sku: string;
            barcode: string;
            name: string;
            basePrice: number;
            categoryId: string;
            categoryName: string;
            brandName: string;
        }[];
    }>;
}
