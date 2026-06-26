import { Request } from 'express';
import { CheckoutOrchestrator } from './checkout.orchestrator';
import { SalesService } from './sales.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { MercadoPagoService } from './mercadopago.service';
import { InventoryService } from '../logistics/inventory.service';
import { SettingsService } from '../../modules/settings/settings.service';
export declare class StorefrontController {
    private readonly checkoutOrchestrator;
    private readonly salesService;
    private readonly prisma;
    private readonly mercadoPagoService;
    private readonly inventoryService;
    private readonly settingsService;
    private readonly logger;
    constructor(checkoutOrchestrator: CheckoutOrchestrator, salesService: SalesService, prisma: PrismaService, mercadoPagoService: MercadoPagoService, inventoryService: InventoryService, settingsService: SettingsService);
    getManifest(): Promise<{
        short_name: string;
        name: string;
        description: string;
        icons: {
            src: string;
            type: string;
            sizes: string;
            purpose: string;
        }[];
        start_url: string;
        display: string;
        background_color: string;
        theme_color: string;
        orientation: string;
    }>;
    getSettings(): Promise<{
        pwa: import("../../modules/settings/settings.service").PwaSettings;
        paymentMethods: any[];
        enabled: boolean;
        primaryColor: string;
        fontFamily: string;
        showHeader: boolean;
        showStoreName: boolean;
        imagesCarousel: any[];
        priceListToShow: string;
        defaultSort: string;
        hideOutOfStock: boolean;
        hideBrandFilters: boolean;
        transferCbu?: string;
        acceptCash: boolean;
        shippingInfo: string;
        requireShippingData: string;
        whatsapp: string;
        instagramUrl: string;
        facebookUrl: string;
        tiktokUrl: string;
        youtubeUrl: string;
        xUrl: string;
        subdomain?: string;
        allowedPaymentMethods?: string[];
        shippingMethods?: any[];
    }>;
    checkout(dto: any, req: Request): Promise<{
        payment: {
            method: string;
            initPoint: string;
            preferenceId: string;
            shippingCost: any;
            shippingMethod: any;
        };
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
            issueInvoice: boolean;
            createdAt: Date;
            syncedAt: Date;
        };
    } | {
        payment: {
            method: string;
            shippingCost: any;
            shippingMethod: any;
            initPoint?: undefined;
            preferenceId?: undefined;
        };
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
            issueInvoice: boolean;
            createdAt: Date;
            syncedAt: Date;
        };
    }>;
    getMyOrders(page: string, pageSize: string, req: Request): Promise<{
        data: {
            customerName: string;
            customer: {
                id: string;
                type: string;
                fullName: string;
                taxId: string | null;
                email: string | null;
                phone: string | null;
                creditLimit: number;
                usedCredit: number;
                isActive: boolean;
                priceListId: string | null;
                createdAt: Date;
                updatedAt: Date;
            };
            lines: {
                id: string;
                orderId: string;
                variantId: string;
                categoryId: string;
                quantity: number;
                basePrice: number;
                discountAmount: number;
                finalPrice: number;
                historicalSku: string | null;
                historicalName: string | null;
                historicalCost: number | null;
            }[];
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
            issueInvoice: boolean;
            createdAt: Date;
            syncedAt: Date;
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    getMyOrder(id: string, req: Request): Promise<{
        customer: {
            id: string;
            type: string;
            fullName: string;
            taxId: string | null;
            email: string | null;
            phone: string | null;
            creditLimit: number;
            usedCredit: number;
            isActive: boolean;
            priceListId: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
        lines: ({
            variant: {
                product: {
                    id: string;
                    name: string;
                    baseSku: string | null;
                    description: string | null;
                    categoryId: string;
                    brandId: string | null;
                    type: import(".prisma/client").$Enums.ProductType;
                    isVariable: boolean;
                    manageBatches: boolean;
                    costPrice: number;
                    isActive: boolean;
                    isPublished: boolean;
                    images: import(".prisma/client").Prisma.JsonValue;
                    metadata: import(".prisma/client").Prisma.JsonValue;
                    createdAt: Date;
                    updatedAt: Date;
                };
            } & {
                id: string;
                productId: string;
                sku: string;
                barcode: string | null;
                size: string | null;
                color: string | null;
                imageUrl: string | null;
                costPrice: number;
                basePrice: number;
                isActive: boolean;
                attributes: import(".prisma/client").Prisma.JsonValue;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            orderId: string;
            variantId: string;
            categoryId: string;
            quantity: number;
            basePrice: number;
            discountAmount: number;
            finalPrice: number;
            historicalSku: string | null;
            historicalName: string | null;
            historicalCost: number | null;
        })[];
        variance: {
            id: string;
            orderId: string;
            posTotal: number;
            serverTotal: number;
            difference: number;
            resolved: boolean;
            createdAt: Date;
        };
    } & {
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
        issueInvoice: boolean;
        createdAt: Date;
        syncedAt: Date;
    }>;
    mercadoPagoWebhook(body: any, req: Request): Promise<{
        received: boolean;
        error?: undefined;
    } | {
        received: boolean;
        error: string;
    }>;
}
