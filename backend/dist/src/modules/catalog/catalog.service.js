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
exports.CatalogService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma/prisma.service");
let CatalogService = class CatalogService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createProduct(dto) {
        try {
            return await this.prisma.product.create({
                data: {
                    name: dto.name,
                    baseSku: dto.baseSku,
                    description: dto.description,
                    categoryId: dto.categoryId,
                    brandId: dto.brandId,
                    isActive: dto.isActive ?? true,
                },
            });
        }
        catch (error) {
            if (error.code === 'P2002') {
                throw new common_1.ConflictException('Product with this base SKU already exists');
            }
            throw error;
        }
    }
    async addVariantToProduct(productId, dto) {
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
        });
        if (!product) {
            throw new common_1.BadRequestException('Product not found');
        }
        try {
            return await this.prisma.productVariant.create({
                data: {
                    productId,
                    sku: dto.sku,
                    barcode: dto.barcode,
                    size: dto.size,
                    color: dto.color,
                    costPrice: dto.costPrice || 0,
                    basePrice: dto.basePrice,
                    isActive: dto.isActive ?? true,
                },
            });
        }
        catch (error) {
            if (error.code === 'P2002') {
                throw new common_1.ConflictException('Variant with this SKU or barcode already exists');
            }
            throw error;
        }
    }
    async addBarcodeToVariant(variantId, dto) {
        try {
            return await this.prisma.productBarcode.create({
                data: {
                    variantId,
                    barcode: dto.barcode,
                    type: dto.type || 'INTERNAL',
                },
            });
        }
        catch (error) {
            if (error.code === 'P2002') {
                throw new common_1.ConflictException('Barcode already exists globally');
            }
            throw error;
        }
    }
    async findAllForPos() {
        const variants = await this.prisma.productVariant.findMany({
            where: {
                isActive: true,
                product: { isActive: true },
            },
            select: {
                id: true,
                sku: true,
                barcode: true,
                basePrice: true,
                size: true,
                color: true,
                product: {
                    select: {
                        id: true,
                        name: true,
                        categoryId: true,
                    },
                },
                barcodes: {
                    select: {
                        barcode: true,
                    },
                },
            },
        });
        return variants.map((v) => ({
            id: v.id,
            productId: v.product.id,
            name: v.product.name,
            categoryId: v.product.categoryId,
            sku: v.sku,
            primaryBarcode: v.barcode,
            allBarcodes: [v.barcode, ...v.barcodes.map((b) => b.barcode)].filter(Boolean),
            price: v.basePrice,
            size: v.size,
            color: v.color,
        }));
    }
};
exports.CatalogService = CatalogService;
exports.CatalogService = CatalogService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CatalogService);
//# sourceMappingURL=catalog.service.js.map