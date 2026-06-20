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
exports.PriceListService = exports.AttributesService = exports.CategoriesService = exports.BrandsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../core/prisma/prisma.service");
let BrandsService = class BrandsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createBrandDto) {
        const exists = await this.prisma.brand.findUnique({ where: { name: createBrandDto.name } });
        if (exists)
            throw new common_1.ConflictException('La marca ya existe');
        return this.prisma.brand.create({
            data: { name: createBrandDto.name }
        });
    }
    async findAll() {
        return this.prisma.brand.findMany({
            orderBy: { name: 'asc' }
        });
    }
    async findOne(id) {
        const brand = await this.prisma.brand.findUnique({ where: { id } });
        if (!brand)
            throw new common_1.NotFoundException(`Marca ${id} no encontrada`);
        return brand;
    }
    async update(id, data) {
        await this.findOne(id);
        return this.prisma.brand.update({ where: { id }, data });
    }
    async delete(id) {
        await this.findOne(id);
        return this.prisma.brand.delete({ where: { id } });
    }
};
exports.BrandsService = BrandsService;
exports.BrandsService = BrandsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BrandsService);
let CategoriesService = class CategoriesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createCategoryDto) {
        const exists = await this.prisma.category.findUnique({ where: { name: createCategoryDto.name } });
        if (exists)
            throw new common_1.ConflictException('La categoría ya existe');
        return this.prisma.category.create({
            data: {
                name: createCategoryDto.name,
                parentId: createCategoryDto.parentId
            }
        });
    }
    async findAll() {
        return this.prisma.category.findMany({
            include: { parent: true },
            orderBy: { name: 'asc' }
        });
    }
    async findOne(id) {
        const category = await this.prisma.category.findUnique({ where: { id } });
        if (!category)
            throw new common_1.NotFoundException(`Categoría ${id} no encontrada`);
        return category;
    }
    async update(id, data) {
        await this.findOne(id);
        return this.prisma.category.update({ where: { id }, data });
    }
    async delete(id) {
        await this.findOne(id);
        return this.prisma.category.delete({ where: { id } });
    }
};
exports.CategoriesService = CategoriesService;
exports.CategoriesService = CategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CategoriesService);
let AttributesService = class AttributesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        return this.prisma.attribute.findMany({
            include: { values: true },
            orderBy: { name: 'asc' }
        });
    }
    async create(data) {
        return this.prisma.attribute.create({
            data: {
                name: data.name,
                values: {
                    create: data.values?.map((v) => ({ value: v })) || []
                }
            },
            include: { values: true }
        });
    }
    async update(id, data) {
        await this.prisma.attributeValue.deleteMany({ where: { attributeId: id } });
        return this.prisma.attribute.update({
            where: { id },
            data: {
                name: data.name,
                values: data.values ? { create: data.values.map(v => ({ value: v })) } : undefined
            },
            include: { values: true }
        });
    }
    async delete(id) {
        return this.prisma.attribute.delete({ where: { id } });
    }
};
exports.AttributesService = AttributesService;
exports.AttributesService = AttributesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AttributesService);
let PriceListService = class PriceListService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        return this.prisma.priceList.findMany({
            orderBy: { createdAt: 'desc' }
        });
    }
    async findAllPaged(query) {
        const page = Number(query.page) || 1;
        const pageSize = Number(query.pageSize) || 10;
        const skip = (page - 1) * pageSize;
        const where = {};
        if (query.search) {
            where.OR = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { code: { contains: query.search, mode: 'insensitive' } }
            ];
        }
        if (query.type) {
            where.type = query.type;
        }
        if (query.isActive !== undefined) {
            where.isActive = query.isActive === true || String(query.isActive) === 'true';
        }
        const [data, total] = await Promise.all([
            this.prisma.priceList.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { createdAt: 'desc' }
            }),
            this.prisma.priceList.count({ where })
        ]);
        return { data, total, page, pageSize };
    }
    async findOne(id) {
        const list = await this.prisma.priceList.findUnique({
            where: { id }
        });
        if (!list)
            throw new common_1.NotFoundException(`Lista de precios ${id} no encontrada`);
        return list;
    }
    async create(data) {
        const { name, code, currency, type, modifierPercentage, isActive } = data;
        const isPercentageBased = type === 'MODIFIER';
        const percentageDiscount = isPercentageBased ? -(modifierPercentage || 0) : null;
        return this.prisma.priceList.create({
            data: {
                name,
                code: code || '',
                currency: currency || 'ARS',
                type: type || 'BASE',
                modifierPercentage: modifierPercentage !== undefined ? Number(modifierPercentage) : 0,
                isActive: isActive ?? true,
                isPercentageBased,
                percentageDiscount,
                margin: 1.0,
            }
        });
    }
    async update(id, data) {
        const updateData = { ...data };
        if (updateData.type !== undefined) {
            updateData.isPercentageBased = updateData.type === 'MODIFIER';
        }
        if (updateData.modifierPercentage !== undefined) {
            updateData.percentageDiscount = updateData.isPercentageBased || updateData.type === 'MODIFIER'
                ? -Number(updateData.modifierPercentage)
                : null;
            updateData.modifierPercentage = Number(updateData.modifierPercentage);
        }
        return this.prisma.priceList.update({
            where: { id },
            data: updateData
        });
    }
    async delete(id) {
        await this.findOne(id);
        return this.prisma.priceList.delete({ where: { id } });
    }
    async findItems(priceListId, page, pageSize) {
        const skip = (page - 1) * pageSize;
        const [variants, total] = await Promise.all([
            this.prisma.productVariant.findMany({
                skip,
                take: pageSize,
                include: {
                    product: {
                        select: { name: true }
                    },
                    priceListEntries: {
                        where: { priceListId }
                    }
                },
                orderBy: { sku: 'asc' }
            }),
            this.prisma.productVariant.count()
        ]);
        const data = variants.map(v => {
            const entry = v.priceListEntries[0];
            const overridePrice = entry ? entry.overridePrice : v.basePrice;
            let variantName = v.product.name;
            const attributes = [];
            if (v.color)
                attributes.push(v.color);
            if (v.size)
                attributes.push(v.size);
            if (attributes.length > 0) {
                variantName += ` (${attributes.join(' / ')})`;
            }
            return {
                id: entry?.id || v.id,
                priceListId,
                variantId: v.id,
                overridePrice,
                variantSku: v.sku,
                variantName,
                basePrice: v.basePrice
            };
        });
        return { data, total, page, pageSize };
    }
    async assignToCustomers(priceListId, customerIds) {
        await this.prisma.customer.updateMany({
            where: {
                id: { in: customerIds }
            },
            data: {
                priceListId
            }
        });
        return { success: true };
    }
};
exports.PriceListService = PriceListService;
exports.PriceListService = PriceListService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PriceListService);
//# sourceMappingURL=taxonomy.service.js.map