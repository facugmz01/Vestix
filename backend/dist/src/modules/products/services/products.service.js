"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../core/prisma/prisma.service");
const taxonomy_service_1 = require("./taxonomy.service");
const crypto = __importStar(require("crypto"));
let ProductsService = class ProductsService {
    constructor(prisma, categoriesService, brandsService) {
        this.prisma = prisma;
        this.categoriesService = categoriesService;
        this.brandsService = brandsService;
    }
    async create(createProductDto) {
        await this.categoriesService.findOne(createProductDto.categoryId);
        if (createProductDto.brandId) {
            await this.brandsService.findOne(createProductDto.brandId);
        }
        const finalSku = createProductDto.baseSku || `PROD-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        const exists = await this.prisma.product.findUnique({ where: { baseSku: finalSku } });
        if (exists)
            throw new common_1.ConflictException(`El SKU Base ${finalSku} ya está en uso`);
        return this.prisma.$transaction(async (tx) => {
            const product = await tx.product.create({
                data: {
                    name: createProductDto.name,
                    baseSku: finalSku,
                    description: createProductDto.description,
                    categoryId: createProductDto.categoryId,
                    brandId: createProductDto.brandId,
                    isVariable: createProductDto.isVariable || false,
                    costPrice: createProductDto.costPrice || 0,
                    isActive: true,
                    isPublished: false,
                    images: createProductDto.images || [],
                    metadata: createProductDto.metadata || {},
                },
                include: { category: true, brand: true }
            });
            if (createProductDto.isVariable && createProductDto.variants?.length) {
                await tx.productVariant.createMany({
                    data: createProductDto.variants.map(v => {
                        const parts = [finalSku, v.size, v.color].filter(Boolean).join('-');
                        return {
                            ...v,
                            productId: product.id,
                            costPrice: v.costPrice || createProductDto.costPrice || 0,
                            sku: v.sku || `${parts}-${crypto.randomBytes(2).toString('hex')}`.toUpperCase()
                        };
                    })
                });
            }
            else {
                await tx.productVariant.create({
                    data: {
                        productId: product.id,
                        sku: finalSku,
                        basePrice: createProductDto.basePrice || createProductDto.variants?.[0]?.basePrice || 0,
                        costPrice: createProductDto.costPrice || 0,
                        isActive: true
                    }
                });
            }
            return product;
        });
    }
    async findAll(query = {}) {
        const page = parseInt(query.page) || 1;
        const pageSize = parseInt(query.pageSize) || 15;
        const skip = (page - 1) * pageSize;
        const where = {};
        if (query.categoryId)
            where.categoryId = query.categoryId;
        if (query.brandId)
            where.brandId = query.brandId;
        if (query.isActive !== undefined)
            where.isActive = query.isActive === 'true';
        if (query.search) {
            where.OR = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { baseSku: { contains: query.search, mode: 'insensitive' } },
            ];
        }
        const [data, total] = await Promise.all([
            this.prisma.product.findMany({
                where,
                include: { category: true, brand: true },
                orderBy: { createdAt: 'desc' },
                skip,
                take: pageSize,
            }),
            this.prisma.product.count({ where }),
        ]);
        return { data, total, page, pageSize };
    }
    async findOne(id) {
        const product = await this.prisma.product.findUnique({
            where: { id },
            include: { category: true, brand: true, variants: true }
        });
        if (!product)
            throw new common_1.NotFoundException(`Producto ${id} no encontrado`);
        return product;
    }
    async update(id, updateProductDto) {
        const product = await this.findOne(id);
        if (updateProductDto.categoryId)
            await this.categoriesService.findOne(updateProductDto.categoryId);
        if (updateProductDto.brandId)
            await this.brandsService.findOne(updateProductDto.brandId);
        if (updateProductDto.baseSku && updateProductDto.baseSku !== product.baseSku) {
            const exists = await this.prisma.product.findUnique({ where: { baseSku: updateProductDto.baseSku } });
            if (exists)
                throw new common_1.ConflictException('El SKU Base ya está en uso por otro producto');
        }
        const { variants, images, basePrice, ...data } = updateProductDto;
        return this.prisma.$transaction(async (tx) => {
            const updatedProduct = await tx.product.update({
                where: { id },
                data: {
                    ...data,
                    images: images,
                },
                include: { category: true, brand: true }
            });
            if (variants && Array.isArray(variants)) {
                const existingVariants = await tx.productVariant.findMany({ where: { productId: id } });
                const variantsToKeepIds = variants.filter(v => v.id).map(v => v.id);
                const variantsToDelete = existingVariants.filter(v => !variantsToKeepIds.includes(v.id));
                for (const variant of variantsToDelete) {
                    try {
                        await tx.productVariant.delete({ where: { id: variant.id } });
                    }
                    catch (error) {
                        if (error.code === 'P2003') {
                            await tx.productVariant.update({
                                where: { id: variant.id },
                                data: { isActive: false }
                            });
                        }
                        else {
                            throw error;
                        }
                    }
                }
                for (const variant of variants) {
                    if (variant.id) {
                        const { id: varId, productId, createdAt, updatedAt, ...varData } = variant;
                        await tx.productVariant.update({
                            where: { id: varId },
                            data: varData
                        });
                    }
                    else {
                        const finalSku = updateProductDto.baseSku || product.baseSku;
                        const parts = [finalSku, variant.size, variant.color].filter(Boolean).join('-');
                        await tx.productVariant.create({
                            data: {
                                ...variant,
                                productId: id,
                                costPrice: variant.costPrice || updateProductDto.costPrice || product.costPrice || 0,
                                sku: variant.sku || `${parts}-${crypto.randomBytes(2).toString('hex')}`.toUpperCase()
                            }
                        });
                    }
                }
                const isNowVariable = updateProductDto.isVariable !== undefined ? updateProductDto.isVariable : product.isVariable;
                if (!isNowVariable && variants.length === 0) {
                    const remaining = await tx.productVariant.count({ where: { productId: id, isActive: true } });
                    if (remaining === 0) {
                        const finalSku = updateProductDto.baseSku || product.baseSku;
                        await tx.productVariant.create({
                            data: {
                                productId: id,
                                sku: finalSku || `PROD-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
                                basePrice: updateProductDto.basePrice || 0,
                                costPrice: updateProductDto.costPrice || product.costPrice || 0,
                                isActive: true
                            }
                        });
                    }
                }
            }
            return updatedProduct;
        });
    }
    async findVariants(productId) {
        return this.prisma.productVariant.findMany({
            where: { productId },
            orderBy: { createdAt: 'desc' }
        });
    }
    async createVariant(productId, data) {
        return this.prisma.productVariant.create({
            data: {
                ...data,
                productId,
                sku: data.sku || `SKU-${crypto.randomBytes(4).toString('hex').toUpperCase()}`
            }
        });
    }
    async updateVariant(id, data) {
        return this.prisma.productVariant.update({
            where: { id },
            data
        });
    }
    async deleteVariant(id) {
        return this.prisma.productVariant.delete({
            where: { id }
        });
    }
    async generateCombinations(productId, dto) {
        const variants = [];
        for (const color of dto.colors) {
            for (const size of dto.sizes) {
                variants.push({
                    productId,
                    color,
                    size,
                    basePrice: dto.basePrice,
                    sku: `${productId.substring(0, 4)}-${color}-${size}`.toUpperCase(),
                    isActive: true
                });
            }
        }
        return this.prisma.productVariant.createMany({
            data: variants,
            skipDuplicates: true
        });
    }
    async remove(id) {
        const product = await this.findOne(id);
        return this.prisma.$transaction(async (tx) => {
            await tx.productVariant.deleteMany({
                where: { productId: product.id }
            });
            return tx.product.delete({
                where: { id: product.id }
            });
        });
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        taxonomy_service_1.CategoriesService,
        taxonomy_service_1.BrandsService])
], ProductsService);
//# sourceMappingURL=products.service.js.map