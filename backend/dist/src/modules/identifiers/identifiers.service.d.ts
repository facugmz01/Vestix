export declare class IdentifiersService {
    private internalItemCounter;
    generateUniqueBarcode(): Promise<string>;
    registerManualBarcode(barcode: string): Promise<boolean>;
    generateUniqueBaseSku(categoryCode: string, productName: string): Promise<string>;
    private validateBarcodeUniqueness;
    private validateSkuUniqueness;
}
