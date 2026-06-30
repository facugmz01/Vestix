"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VariantGeneratorService = void 0;
const common_1 = require("@nestjs/common");
let VariantGeneratorService = class VariantGeneratorService {
    generateCombinations(dto, productId, baseSku) {
        const { attributes, basePrice } = dto;
        const attributeNames = attributes.map(a => a.name);
        const attributeValuesLists = attributes.map(a => a.values);
        const cartesian = (...a) => a.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())));
        const combinations = attributeValuesLists.length === 1
            ? attributeValuesLists[0].map(v => [v])
            : cartesian(...attributeValuesLists);
        return combinations.map(comboArray => {
            const attributesMap = {};
            let skuSuffix = '';
            comboArray.forEach((val, idx) => {
                const attrName = attributeNames[idx].toLowerCase();
                attributesMap[attrName] = val;
                skuSuffix += `-${val.toString().toUpperCase().substring(0, 3)}`;
            });
            return {
                productId,
                sku: `${baseSku}${skuSuffix}`,
                barcode: this.generateInternalBarcode(),
                basePrice,
                attributes: attributesMap,
                isActive: true,
            };
        });
    }
    generateInternalBarcode() {
        const timestamp = Date.now().toString().slice(-9);
        const random = Math.floor(1000 + Math.random() * 9000);
        return `${timestamp}${random}`;
    }
};
exports.VariantGeneratorService = VariantGeneratorService;
exports.VariantGeneratorService = VariantGeneratorService = __decorate([
    (0, common_1.Injectable)()
], VariantGeneratorService);
//# sourceMappingURL=variant-generator.service.js.map