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
    async create(data) {
        const { name, margin, type, currency, isPercentageBased, percentageDiscount, validFrom, validTo, isDefault } = data;
        return this.prisma.priceList.create({
            data: {
                name,
                margin: margin !== undefined ? Number(margin) : 1.0,
                type: type || 'RETAIL',
                currency: currency || 'ARS',
                isPercentageBased: isPercentageBased ?? false,
                percentageDiscount: percentageDiscount !== undefined ? Number(percentageDiscount) : null,
                validFrom: validFrom ? new Date(validFrom) : null,
                validTo: validTo ? new Date(validTo) : null,
                isDefault: isDefault ?? false,
            }
        });
    }
    async update(id, data) {
        return this.prisma.priceList.update({ where: { id }, data });
    }
    async delete(id) {
        return this.prisma.priceList.delete({ where: { id } });
    }
};
exports.PriceListService = PriceListService;
exports.PriceListService = PriceListService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PriceListService);
//# sourceMappingURL=taxonomy.service.js.map