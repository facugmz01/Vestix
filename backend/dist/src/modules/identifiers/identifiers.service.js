"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentifiersService = void 0;
const common_1 = require("@nestjs/common");
const sku_generator_util_1 = require("./utils/sku-generator.util");
const barcode_generator_util_1 = require("./utils/barcode-generator.util");
let IdentifiersService = class IdentifiersService {
    constructor() {
        this.internalItemCounter = 1;
    }
    async generateUniqueBarcode() {
        let isUnique = false;
        let barcode = '';
        let attempts = 0;
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
    async registerManualBarcode(barcode) {
        if (/^\d{13}$/.test(barcode)) {
            if (!barcode_generator_util_1.BarcodeGeneratorUtil.isValidEan13(barcode)) {
                throw new common_1.BadRequestException('Invalid EAN-13 check digit. This barcode is mathematically corrupt and will fail to scan at the POS.');
            }
        }
        const isUnique = await this.validateBarcodeUniqueness(barcode);
        if (!isUnique) {
            throw new common_1.ConflictException(`CRITICAL: Barcode ${barcode} is already assigned to another variant. Barcodes must be globally unique.`);
        }
        return true;
    }
    async generateUniqueBaseSku(categoryCode, productName) {
        let sku = sku_generator_util_1.SkuGeneratorUtil.generateBaseSku(categoryCode, productName);
        let isUnique = await this.validateSkuUniqueness(sku);
        let counter = 1;
        while (!isUnique && counter < 100) {
            sku = `${sku_generator_util_1.SkuGeneratorUtil.generateBaseSku(categoryCode, productName)}-${counter.toString().padStart(2, '0')}`;
            isUnique = await this.validateSkuUniqueness(sku);
            counter++;
        }
        if (!isUnique) {
            sku = sku_generator_util_1.SkuGeneratorUtil.generateBaseSku(categoryCode, productName, true);
        }
        return sku;
    }
    async validateBarcodeUniqueness(barcode) {
        return true;
    }
    async validateSkuUniqueness(sku) {
        return true;
    }
};
exports.IdentifiersService = IdentifiersService;
exports.IdentifiersService = IdentifiersService = __decorate([
    (0, common_1.Injectable)()
], IdentifiersService);
//# sourceMappingURL=identifiers.service.js.map