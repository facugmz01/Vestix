export declare class WooCommerceApiService {
    private readonly logger;
    private readonly configPath;
    private getConfig;
    private getBaseUrl;
    private getAuth;
    updateProductStock(wcProductId: number, wcVariationId: number, stockQuantity: number): Promise<any>;
    updateProductPrice(wcProductId: number, wcVariationId: number, regularPrice: string): Promise<any>;
    updateOrderStatus(wcOrderId: number, status: string): Promise<any>;
    getOrder(wcOrderId: number): Promise<any>;
}
