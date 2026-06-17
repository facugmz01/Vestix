import { PrismaService } from '../../core/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { CheckoutDto } from './dto/checkout.dto';
export declare class StorefrontService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    getPublicProducts(filters: any): Promise<{
        data: {
            id: string;
            name: string;
            description: string;
            brand: string;
            category: string;
            price: number;
            basePrice: number;
            inStock: boolean;
            availableQuantity: number;
            images: import(".prisma/client").Prisma.JsonArray;
            variants: {
                id: string;
                sku: string;
                size: string;
                color: string;
                stock: number;
            }[];
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    getProduct(id: string): Promise<{
        id: string;
        name: string;
        description: string;
        brand: string;
        category: string;
        price: number;
        basePrice: number;
        inStock: boolean;
        availableQuantity: number;
        images: import(".prisma/client").Prisma.JsonArray;
        variants: {
            id: string;
            sku: string;
            size: string;
            color: string;
            stock: number;
        }[];
    }>;
    sendOtp(phone: string): Promise<{
        success: boolean;
        message: string;
    }>;
    verifyOtp(phone: string, code: string): Promise<{
        success: boolean;
        token: string;
        customer: {
            id: string;
            fullName: string;
            phone: string;
            email: string;
        };
    }>;
    getCustomer(id: string): Promise<{
        id: string;
        fullName: string;
        phone: string;
        email: string;
    }>;
    checkout(dto: CheckoutDto, customerId?: string): Promise<{
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
    getMyOrders(customerId: string, filters: any): Promise<{
        data: ({
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
                        preferredSupplierId: string | null;
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
        })[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    getMyOrder(customerId: string, orderId: string): Promise<{
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
                    preferredSupplierId: string | null;
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
}
