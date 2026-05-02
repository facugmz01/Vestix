export declare class WooCommerceApiService {
    private readonly logger;
    private readonly baseUrl;
    private readonly auth;
    updateProductStock(wcProductId: number, wcVariationId: number, stockQuantity: number): Promise<{
        success: boolean;
    }>;
    updateProductPrice(wcProductId: number, wcVariationId: number, regularPrice: string): Promise<{
        success: boolean;
    }>;
    updateOrderStatus(wcOrderId: number, status: string): Promise<{
        success: boolean;
    }>;
    getOrder(wcOrderId: number): Promise<{
        id: number;
        status: string;
        billing: {
            email: string;
            phone: string;
            first_name: string;
            last_name: string;
        };
        line_items: {
            product_id: number;
            variation_id: number;
            quantity: number;
            price: string;
        }[];
        total: string;
    }>;
}
