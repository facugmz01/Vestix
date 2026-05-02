export declare class SkuGeneratorUtil {
    static generateBaseSku(categoryCode: string, productName: string, randomSuffix?: boolean): string;
    static generateVariantSku(baseSku: string, attributes: Record<string, string>): string;
}
