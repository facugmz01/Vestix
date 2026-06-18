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
var StorefrontCheckoutService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorefrontCheckoutService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../core/prisma/prisma.service");
const uuid_1 = require("uuid");
let StorefrontCheckoutService = StorefrontCheckoutService_1 = class StorefrontCheckoutService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(StorefrontCheckoutService_1.name);
    }
    async processCheckout(authCustomerId, dto) {
        if (!dto.cartLines || dto.cartLines.length === 0) {
            throw new common_1.BadRequestException('El carrito está vacío');
        }
        let customerId = authCustomerId;
        let customer = customerId ? await this.prisma.customer.findUnique({ where: { id: customerId } }) : null;
        if (!customer && dto.customerInfo.email) {
            customer = await this.prisma.customer.findFirst({
                where: { email: dto.customerInfo.email }
            });
            if (!customer) {
                customer = await this.prisma.customer.create({
                    data: {
                        fullName: `${dto.customerInfo.firstName} ${dto.customerInfo.lastName}`.trim(),
                        email: dto.customerInfo.email,
                        phone: dto.customerInfo.phone,
                        taxId: dto.customerInfo.documentNumber,
                        type: 'INDIVIDUAL',
                    }
                });
            }
            customerId = customer.id;
        }
        if (!customerId) {
            throw new common_1.BadRequestException('No se pudo determinar el cliente');
        }
        const settings = await this.prisma.systemSettings.findUnique({ where: { id: 'default' } });
        const storefrontConfig = settings?.storefront || {};
        const defaultBranchId = 'default-branch-id';
        const priceListId = customer?.priceListId || storefrontConfig.priceListToShow || 'retail-default';
        let subtotal = 0;
        const orderLinesData = [];
        for (const item of dto.cartLines) {
            const variant = await this.prisma.productVariant.findUnique({
                where: { id: item.variantId },
                include: { product: true }
            });
            if (!variant) {
                throw new common_1.BadRequestException(`La variante ${item.variantId} no existe`);
            }
            if (!variant.product.isPublished) {
                throw new common_1.BadRequestException(`El producto ${variant.product.name} ya no está disponible`);
            }
            const priceEntry = await this.prisma.priceListEntry.findUnique({
                where: { priceListId_variantId: { priceListId, variantId: item.variantId } }
            });
            const finalPrice = priceEntry ? priceEntry.overridePrice : variant.basePrice;
            subtotal += finalPrice * item.quantity;
            orderLinesData.push({
                variantId: variant.id,
                categoryId: variant.product.categoryId || 'uncategorized',
                quantity: item.quantity,
                basePrice: finalPrice,
                discountAmount: 0,
                finalPrice: finalPrice,
                historicalSku: variant.sku,
                historicalName: `${variant.product.name}`.trim(),
                historicalCost: variant.costPrice,
            });
        }
        const orderId = dto.id || (0, uuid_1.v4)();
        const order = await this.prisma.saleOrder.create({
            data: {
                id: orderId,
                branchId: defaultBranchId,
                source: 'STOREFRONT',
                customerId: customerId,
                subtotal: subtotal,
                cartDiscountTotal: 0,
                grandTotal: subtotal,
                paymentMethod: dto.paymentMethod || 'EFECTIVO',
                status: 'QUOTE',
                issueInvoice: dto.issueInvoice || false,
                createdAt: new Date(),
                lines: {
                    create: orderLinesData
                }
            },
            include: {
                lines: true
            }
        });
        this.logger.log(`Checkout successful for customer ${customerId}, Order: ${orderId}`);
        return { success: true, orderId: order.id, total: subtotal, payment: null };
    }
};
exports.StorefrontCheckoutService = StorefrontCheckoutService;
exports.StorefrontCheckoutService = StorefrontCheckoutService = StorefrontCheckoutService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StorefrontCheckoutService);
//# sourceMappingURL=storefront-checkout.service.js.map