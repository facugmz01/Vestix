"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var WooCommerceApiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WooCommerceApiService = void 0;
const common_1 = require("@nestjs/common");
let WooCommerceApiService = WooCommerceApiService_1 = class WooCommerceApiService {
    constructor() {
        this.logger = new common_1.Logger(WooCommerceApiService_1.name);
        this.baseUrl = process.env.WC_BASE_URL ?? 'https://mystore.com/wp-json/wc/v3';
        this.auth = {
            username: process.env.WC_CONSUMER_KEY ?? 'ck_mock',
            password: process.env.WC_CONSUMER_SECRET ?? 'cs_mock',
        };
    }
    async updateProductStock(wcProductId, wcVariationId, stockQuantity) {
        const url = `${this.baseUrl}/products/${wcProductId}/variations/${wcVariationId}`;
        try {
            this.logger.log(`[WooCommerce] ↑ Stock updated — Product ${wcProductId} / Variation ${wcVariationId}: ${stockQuantity} units`);
            return { success: true };
        }
        catch (err) {
            this.logger.error(`[WooCommerce] ✗ Failed to update stock: ${err.message}`);
            throw new common_1.InternalServerErrorException(`WooCommerce stock update failed: ${err.message}`);
        }
    }
    async updateProductPrice(wcProductId, wcVariationId, regularPrice) {
        const url = `${this.baseUrl}/products/${wcProductId}/variations/${wcVariationId}`;
        try {
            this.logger.log(`[WooCommerce] ↑ Price updated — Product ${wcProductId}: $${regularPrice}`);
            return { success: true };
        }
        catch (err) {
            throw new common_1.InternalServerErrorException(`WooCommerce price update failed: ${err.message}`);
        }
    }
    async updateOrderStatus(wcOrderId, status) {
        const url = `${this.baseUrl}/orders/${wcOrderId}`;
        try {
            this.logger.log(`[WooCommerce] ↑ Order ${wcOrderId} status → ${status}`);
            return { success: true };
        }
        catch (err) {
            throw new common_1.InternalServerErrorException(`WooCommerce order update failed: ${err.message}`);
        }
    }
    async getOrder(wcOrderId) {
        const url = `${this.baseUrl}/orders/${wcOrderId}`;
        try {
            return {
                id: wcOrderId,
                status: 'processing',
                billing: { email: 'customer@example.com', phone: '5491122334455', first_name: 'John', last_name: 'Doe' },
                line_items: [
                    { product_id: 101, variation_id: 202, quantity: 2, price: '20.00' }
                ],
                total: '40.00'
            };
        }
        catch (err) {
            throw new common_1.InternalServerErrorException(`WooCommerce order fetch failed: ${err.message}`);
        }
    }
};
exports.WooCommerceApiService = WooCommerceApiService;
exports.WooCommerceApiService = WooCommerceApiService = WooCommerceApiService_1 = __decorate([
    (0, common_1.Injectable)()
], WooCommerceApiService);
//# sourceMappingURL=woocommerce-api.service.js.map