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
exports.StorefrontService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma/prisma.service");
const jwt_1 = require("@nestjs/jwt");
const uuid_1 = require("uuid");
let StorefrontService = class StorefrontService {
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async getPublicProducts(filters) {
        const { page = 1, pageSize = 15, search, categoryId, brand } = filters;
        const skip = (page - 1) * pageSize;
        const where = { isPublished: true, isActive: true };
        if (search)
            where.name = { contains: search, mode: 'insensitive' };
        if (categoryId)
            where.categoryId = categoryId;
        if (brand)
            where.brandId = brand;
        const [products, total] = await Promise.all([
            this.prisma.product.findMany({
                where,
                skip,
                take: Number(pageSize),
                include: {
                    brand: true,
                    category: true,
                    variants: {
                        where: { isActive: true },
                        include: {
                            stockLevels: true,
                        }
                    }
                }
            }),
            this.prisma.product.count({ where })
        ]);
        const mapped = products.map(p => {
            let totalAvail = 0;
            const mappedVariants = p.variants.map(v => {
                const stock = v.stockLevels.reduce((acc, sl) => acc + sl.availableQuantity, 0);
                totalAvail += stock;
                return {
                    id: v.id,
                    sku: v.sku,
                    size: v.size,
                    color: v.color,
                    stock
                };
            });
            return {
                id: p.id,
                name: p.name,
                description: p.description,
                brand: p.brand?.name || null,
                category: p.category?.name || null,
                price: p.variants[0]?.basePrice || p.costPrice * 1.5,
                basePrice: p.variants[0]?.basePrice || p.costPrice * 1.5,
                inStock: totalAvail > 0,
                availableQuantity: totalAvail,
                images: Array.isArray(p.images) ? p.images : [],
                variants: mappedVariants,
            };
        });
        return { data: mapped, total, page: Number(page), pageSize: Number(pageSize) };
    }
    async getProduct(id) {
        const p = await this.prisma.product.findUnique({
            where: { id },
            include: {
                brand: true,
                category: true,
                variants: {
                    where: { isActive: true },
                    include: {
                        stockLevels: true,
                    }
                }
            }
        });
        if (!p || !p.isPublished || !p.isActive) {
            throw new common_1.BadRequestException('Product not found or not published');
        }
        let totalAvail = 0;
        const mappedVariants = p.variants.map(v => {
            const stock = v.stockLevels.reduce((acc, sl) => acc + sl.availableQuantity, 0);
            totalAvail += stock;
            return {
                id: v.id,
                sku: v.sku,
                size: v.size,
                color: v.color,
                stock
            };
        });
        return {
            id: p.id,
            name: p.name,
            description: p.description,
            brand: p.brand?.name || null,
            category: p.category?.name || null,
            price: p.variants[0]?.basePrice || p.costPrice * 1.5,
            basePrice: p.variants[0]?.basePrice || p.costPrice * 1.5,
            inStock: totalAvail > 0,
            availableQuantity: totalAvail,
            images: Array.isArray(p.images) ? p.images : [],
            variants: mappedVariants,
        };
    }
    async sendOtp(phone) {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        console.log(`\n\n=== MOCK OTP FOR ${phone} ===\nCODE: ${code}\n==============================\n`);
        try {
            const settings = await this.prisma.systemSettings.findUnique({ where: { id: 'default' } });
            const notifSettings = settings?.notifications || {};
            const targetUrl = notifSettings.openWaOtpUrl || notifSettings.openWaUrl;
            const targetSession = notifSettings.openWaOtpSession || notifSettings.openWaSession || 'default';
            if (notifSettings.whatsappEnabled && targetUrl) {
                let waPhone = phone.replace(/[^0-9]/g, '');
                if (!waPhone.endsWith('@c.us')) {
                    waPhone = `${waPhone}@c.us`;
                }
                const message = `Tu código de verificación para la Tienda Web es: *${code}*`;
                await fetch(`${targetUrl}/api/sendText`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chatId: waPhone,
                        text: message,
                        session: targetSession
                    })
                }).catch(err => {
                    console.error('Failed to send OpenWA message:', err.message);
                });
            }
        }
        catch (e) {
            console.error('Error fetching settings for OpenWA:', e);
        }
        return { success: true, message: 'OTP processed' };
    }
    async verifyOtp(phone, code) {
        if (code !== '123456' && code.length !== 6) {
            throw new common_1.UnauthorizedException('Invalid OTP code');
        }
        let customer = await this.prisma.customer.findFirst({
            where: { phone }
        });
        if (!customer) {
            customer = await this.prisma.customer.create({
                data: {
                    fullName: 'Customer ' + phone,
                    phone,
                    type: 'INDIVIDUAL',
                }
            });
        }
        const token = this.jwtService.sign({ sub: customer.id, role: 'customer' });
        return {
            success: true,
            token,
            customer: {
                id: customer.id,
                fullName: customer.fullName,
                phone: customer.phone,
                email: customer.email,
            }
        };
    }
    async getCustomer(id) {
        const customer = await this.prisma.customer.findUnique({ where: { id } });
        if (!customer)
            throw new common_1.UnauthorizedException('Customer not found');
        return {
            id: customer.id,
            fullName: customer.fullName,
            phone: customer.phone,
            email: customer.email,
        };
    }
    async checkout(dto, customerId) {
        return this.prisma.$transaction(async (tx) => {
            let actualCustomerId = customerId;
            if (!actualCustomerId) {
                let customer = await tx.customer.findFirst({
                    where: {
                        OR: [
                            { email: dto.customerInfo.email },
                            { taxId: dto.customerInfo.documentNumber }
                        ]
                    }
                });
                if (!customer) {
                    customer = await tx.customer.create({
                        data: {
                            fullName: `${dto.customerInfo.firstName} ${dto.customerInfo.lastName}`,
                            email: dto.customerInfo.email,
                            phone: dto.customerInfo.phone,
                            taxId: dto.customerInfo.documentNumber,
                            type: dto.customerInfo.documentType === 'CUIT' ? 'BUSINESS' : 'INDIVIDUAL',
                        }
                    });
                }
                actualCustomerId = customer.id;
            }
            let branch = await tx.branch.findFirst({ where: { isMain: true } });
            if (!branch) {
                branch = await tx.branch.findFirst();
            }
            if (!branch)
                throw new common_1.BadRequestException('No branch configured in the system');
            let subtotal = 0;
            const linesData = [];
            for (const line of dto.cartLines) {
                const variant = await tx.productVariant.findUnique({
                    where: { id: line.variantId },
                    include: { product: true }
                });
                if (!variant)
                    throw new common_1.BadRequestException(`Variant ${line.variantId} not found`);
                const lineTotal = line.quantity * line.price;
                subtotal += lineTotal;
                linesData.push({
                    variantId: variant.id,
                    categoryId: variant.product.categoryId,
                    quantity: line.quantity,
                    basePrice: line.price,
                    discountAmount: 0,
                    finalPrice: line.price,
                    historicalSku: variant.sku,
                    historicalName: variant.product.name,
                    historicalCost: variant.costPrice,
                });
            }
            const orderId = dto.id || (0, uuid_1.v4)();
            const order = await tx.saleOrder.create({
                data: {
                    id: orderId,
                    branchId: branch.id,
                    source: 'STOREFRONT',
                    customerId: actualCustomerId,
                    subtotal,
                    cartDiscountTotal: 0,
                    grandTotal: subtotal,
                    paymentMethod: dto.paymentMethod,
                    status: 'PENDING',
                    issueInvoice: dto.issueInvoice || true,
                    createdAt: new Date(),
                    syncedAt: new Date(),
                    lines: {
                        create: linesData,
                    }
                },
                include: { lines: true }
            });
            return order;
        });
    }
    async getMyOrders(customerId, filters) {
        const { page = 1, pageSize = 15 } = filters;
        const skip = (page - 1) * pageSize;
        const [data, total] = await Promise.all([
            this.prisma.saleOrder.findMany({
                where: { customerId, source: 'STOREFRONT' },
                skip,
                take: Number(pageSize),
                orderBy: { createdAt: 'desc' },
                include: { lines: { include: { variant: { include: { product: true } } } } }
            }),
            this.prisma.saleOrder.count({ where: { customerId, source: 'STOREFRONT' } })
        ]);
        return { data, total, page: Number(page), pageSize: Number(pageSize) };
    }
    async getMyOrder(customerId, orderId) {
        const order = await this.prisma.saleOrder.findFirst({
            where: { id: orderId, customerId },
            include: { lines: { include: { variant: { include: { product: true } } } } }
        });
        if (!order)
            throw new common_1.BadRequestException('Order not found');
        return order;
    }
};
exports.StorefrontService = StorefrontService;
exports.StorefrontService = StorefrontService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], StorefrontService);
//# sourceMappingURL=storefront.service.js.map