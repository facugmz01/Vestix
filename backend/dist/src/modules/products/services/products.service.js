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
const taxonomy_service_1 = require("./taxonomy.service");
const crypto = __importStar(require("crypto"));
let ProductsService = class ProductsService {
    constructor(categoriesService, brandsService) {
        this.categoriesService = categoriesService;
        this.brandsService = brandsService;
        this.products = [];
    }
    async create(createProductDto) {
        await this.categoriesService.findOne(createProductDto.categoryId);
        await this.brandsService.findOne(createProductDto.brandId);
        const exists = this.products.find(p => p.baseSku === createProductDto.baseSku);
        if (exists)
            throw new common_1.ConflictException(`Base SKU ${createProductDto.baseSku} is already in use`);
        const product = {
            id: crypto.randomUUID(),
            ...createProductDto,
            isActive: true,
            images: createProductDto.images || [],
            metadata: createProductDto.metadata || {},
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.products.push(product);
        return product;
    }
    async findAll() {
        return this.products;
    }
    async findOne(id) {
        const product = this.products.find(p => p.id === id);
        if (!product)
            throw new common_1.NotFoundException(`Product ${id} not found`);
        return product;
    }
    async update(id, updateProductDto) {
        const idx = this.products.findIndex(p => p.id === id);
        if (idx === -1)
            throw new common_1.NotFoundException(`Product ${id} not found`);
        if (updateProductDto.categoryId)
            await this.categoriesService.findOne(updateProductDto.categoryId);
        if (updateProductDto.brandId)
            await this.brandsService.findOne(updateProductDto.brandId);
        if (updateProductDto.baseSku && updateProductDto.baseSku !== this.products[idx].baseSku) {
            const exists = this.products.find(p => p.baseSku === updateProductDto.baseSku);
            if (exists)
                throw new common_1.ConflictException('Base SKU already in use by another product');
        }
        this.products[idx] = {
            ...this.products[idx],
            ...updateProductDto,
            updatedAt: new Date()
        };
        return this.products[idx];
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [taxonomy_service_1.CategoriesService,
        taxonomy_service_1.BrandsService])
], ProductsService);
//# sourceMappingURL=products.service.js.map