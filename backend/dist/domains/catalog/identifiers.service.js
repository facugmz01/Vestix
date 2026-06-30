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
exports.IdentifiersService = void 0;
const common_1 = require("@nestjs/common");
const barcode_generator_util_1 = require("./utils/barcode-generator.util");
const prisma_service_1 = require("../../core/prisma/prisma.service");
const crypto = __importStar(require("crypto"));
let IdentifiersService = class IdentifiersService {
    constructor(prisma) {
        this.prisma = prisma;
        this.internalItemCounter = 1;
    }
    async generateUniqueBarcode() {
        let isUnique = false;
        let barcode = '';
        let attempts = 0;
        if (this.internalItemCounter === 1) {
            this.internalItemCounter = Math.floor(Math.random() * 100000);
        }
        while (!isUnique && attempts < 10) {
            barcode = barcode_generator_util_1.BarcodeGeneratorUtil.generateInternalEan13(this.internalItemCounter++);
            isUnique = await this.validateBarcodeUniqueness(barcode);
            attempts++;
        }
        if (!isUnique) {
            throw new Error('Fatal: Failed to generate a unique barcode after 10 database attempts.');
        }
        return barcode;
    }
    async generateVariantSku(productId, attributes = []) {
        const product = await this.prisma.product.findUnique({ where: { id: productId } });
        const base = product?.baseSku || 'PROD';
        const suffix = attributes.join('-').toUpperCase();
        let sku = suffix ? `${base}-${suffix}` : base;
        let isUnique = await this.validateSkuUniqueness(sku);
        if (!isUnique) {
            sku = `${sku}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
        }
        return sku;
    }
    async validateBarcodeUniqueness(barcode) {
        const existing = await this.prisma.productVariant.findFirst({ where: { barcode } });
        return !existing;
    }
    async validateSkuUniqueness(sku) {
        const existingProduct = await this.prisma.product.findFirst({ where: { baseSku: sku } });
        const existingVariant = await this.prisma.productVariant.findFirst({ where: { sku } });
        return !existingProduct && !existingVariant;
    }
};
exports.IdentifiersService = IdentifiersService;
exports.IdentifiersService = IdentifiersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], IdentifiersService);
//# sourceMappingURL=identifiers.service.js.map