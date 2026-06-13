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
exports.VariantsService = void 0;
const common_1 = require("@nestjs/common");
const variant_generator_service_1 = require("./variant-generator.service");
const crypto = __importStar(require("crypto"));
const prisma_service_1 = require("../../../core/prisma/prisma.service");
let VariantsService = class VariantsService {
    constructor(variantGenerator, prisma) {
        this.variantGenerator = variantGenerator;
        this.prisma = prisma;
    }
    async generateAndSave(productId, dto) {
        const mockProductBaseSku = 'MOCK-SKU';
        const newVariantsData = this.variantGenerator.generateCombinations(dto, productId, mockProductBaseSku);
        const generatedSkus = newVariantsData.map(v => v.sku);
        const existingCount = await this.prisma.productVariant.count({
            where: { sku: { in: generatedSkus } }
        });
        if (existingCount > 0) {
            throw new common_1.ConflictException('SKU collision detected. One or more generated SKUs already exist for this product. Check attributes or use manual creation.');
        }
        const savedVariants = newVariantsData.map(vData => ({
            id: crypto.randomUUID(),
            productId,
            sku: vData.sku,
            barcode: vData.barcode || null,
            attributes: vData.attributes || {},
            basePrice: vData.basePrice,
            costPrice: vData.costPrice || 0,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        }));
        await this.prisma.productVariant.createMany({
            data: savedVariants
        });
        return savedVariants;
    }
    async findByProduct(productId) {
        return this.prisma.productVariant.findMany({
            where: { productId }
        });
    }
    async updatePrice(id, newPrice) {
        const variant = await this.prisma.productVariant.update({
            where: { id },
            data: { basePrice: newPrice }
        });
        if (!variant)
            throw new common_1.NotFoundException(`Variant ${id} not found`);
        return variant;
    }
};
exports.VariantsService = VariantsService;
exports.VariantsService = VariantsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [variant_generator_service_1.VariantGeneratorService,
        prisma_service_1.PrismaService])
], VariantsService);
//# sourceMappingURL=variants.service.js.map