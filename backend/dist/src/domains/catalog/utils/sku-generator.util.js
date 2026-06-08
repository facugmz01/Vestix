"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkuGeneratorUtil = void 0;
class SkuGeneratorUtil {
    static generateBaseSku(categoryCode, productName, randomSuffix = false) {
        const cat = categoryCode.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase();
        const prod = productName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase();
        if (randomSuffix) {
            const rnd = Math.floor(100 + Math.random() * 900).toString();
            return `${cat}-${prod}-${rnd}`;
        }
        return `${cat}-${prod}`;
    }
    static generateVariantSku(baseSku, attributes) {
        const sortedKeys = Object.keys(attributes).sort();
        let suffix = '';
        for (const key of sortedKeys) {
            const val = attributes[key].toString().replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase();
            suffix += `-${val}`;
        }
        return `${baseSku}${suffix}`;
    }
}
exports.SkuGeneratorUtil = SkuGeneratorUtil;
//# sourceMappingURL=sku-generator.util.js.map